const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

const frontendDir = path.join(__dirname, 'frontend');
const ALLOWED_HATS = [
    "mario", "glitch", "speed", "trash", "tv", "hacker", "soldier", "police", 
    "demonmask", "shirt", "tinymario", "cap", "king", "palestine", "hiimstickman", 
    "back", "kitty", "satan", "bull", "ballet", "scarf", "bear", "bfdi", "bieber", 
    "bowtie", "bucket", "chain", "chef", "clippy", "cowboy", "elon", "evil", 
    "headphones", "northkorea", "horse", "kamala", "maga", "ninja", "obama", 
    "pirate", "pot", "stare", "tophat", "troll", "windows", "witch", "wizard"
];

const BLESSED_HATS = [
    "premium", "dank", "cake", "cigar", "gangster", "illuminati", "propeller", "gamer",
    "windows2", "windows3", "windows4", "windows5", "windows6", "windows7", "windows8", 
    "windows9", "windows10", "windows11", "windows12", "mario2", "luigi", "megatron"
];

// Security constants
const BLOCKED_PATTERNS = [
    'socket', 'eval', 'Function', 'constructor', 'prototype', 'document',
    'window', 'localStorage', 'sessionStorage', 'indexedDB', 'XMLHttpRequest',
    'WebSocket', 'fetch', 'prompt', 'alert', 'confirm', 'script', 'iframe',
    'onload', 'onerror', 'javascript:', 'data:', 'vbscript:'
];

const RATE_LIMIT = {
    messages: 5,    // messages
    interval: 5000  // milliseconds
};

// IP tracking and limits
const ipConnections = new Map(); // Tracks active socket IDs per IP
const ipAlts = new Map(); // Tracks total alt count per IP (persists after disconnect)
const MAX_ALTS = 4;  // Maximum alts per IP

// Rate limiting trackers
const messageRateLimit = new Map();
const commandRateLimit = new Map();

// Cleanup function to remove old IP entries
function cleanupIpAlts() {
  const now = Date.now();
  for (const [ip, data] of ipAlts.entries()) {
    // Remove entries older than 1 hour
    if (now - data.lastSeen > 3600000) {
      ipAlts.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupIpAlts, 3600000);

// Enable CORS for all routes (for development)
app.use(cors());

// Serve static files (css, js, images, fonts, etc.)
app.use(express.static(frontendDir));

// Serve index.html for the root
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = socketio(server);

// Allow all origins for socket.io (v1.x way)
io.set('origins', '*:*');

// In-memory user and room tracking
const rooms = {};
// Active polls per room
const roomPolls = {};

// Color configuration
const COMMON_COLORS = [
  'black',
  'blue',
  'brown',
  'green',
  'purple',
  'red',
  'pink',
  'white',
  'yellow',
  'orange',
  'cyan',
];

// Add this missing constant
const ADMIN_ONLY_COLORS = ["pope", "megatron", "vitamin", "death", "king"];

function isKnownColor(color) {
  return COMMON_COLORS.includes(color) || ADMIN_ONLY_COLORS.includes(color);
}

function isAdminOnlyColor(color) {
  return ADMIN_ONLY_COLORS.includes(color);
}

function getRandomCommonColor() {
  return COMMON_COLORS[Math.floor(Math.random() * COMMON_COLORS.length)];
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

// Security helper functions
function containsInjectionAttempt(text) {
    if (typeof text !== 'string') return true;
    const normalized = text.toLowerCase();
    return BLOCKED_PATTERNS.some(pattern => normalized.includes(pattern));
}

function sanitizeInput(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .substring(0, 1000); // Limit message length
}

// Default media whitelists
const DEFAULT_IMAGE_WHITELIST = [
  'files.catbox.moe',
  'litter.catbox.moe',
  'web.archive.org',
  'i.ibb.co',
  'media.tenor.com',
  'i.imgur.com'
];
const DEFAULT_VIDEO_WHITELIST = [
  'files.catbox.moe',
  'i.ibb.co',
  'web.archive.org',
  'media.tenor.com',
  'i.imgur.com'
];

// Load or create config file
let config = {
    godmode_password: "nasrshbools",
    image_whitelist: DEFAULT_IMAGE_WHITELIST.slice(),
    video_whitelist: DEFAULT_VIDEO_WHITELIST.slice()
};

const configPath = path.join(__dirname, 'config', 'config.json');
const bansPath = path.join(__dirname, 'bans.json');

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Ensure defaults exist if missing in existing config file
        if (!config || typeof config !== 'object') config = {};
        if (typeof config.godmode_password !== 'string') config.godmode_password = 'bonzi';
        if (!Array.isArray(config.image_whitelist) || config.image_whitelist.length === 0) config.image_whitelist = DEFAULT_IMAGE_WHITELIST.slice();
        if (!Array.isArray(config.video_whitelist) || config.video_whitelist.length === 0) config.video_whitelist = DEFAULT_VIDEO_WHITELIST.slice();
    } else {
        // Ensure config directory exists
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    }
} catch (err) {
    console.error('Error loading config:', err);
}

// Load or create bans file
let bans = [];
try {
    if (fs.existsSync(bansPath)) {
        bans = JSON.parse(fs.readFileSync(bansPath, 'utf8'));
    } else {
        fs.writeFileSync(bansPath, JSON.stringify(bans, null, 4));
    }
} catch (err) {
    console.error('Error loading bans:', err);
}

// Function to save bans to file
function saveBans() {
    try {
        fs.writeFileSync(bansPath, JSON.stringify(bans, null, 4));
    } catch (err) {
        console.error('Error saving bans:', err);
    }
}

// Function to check if a user is banned
function checkBan(ip) {
    const now = new Date();
    // Clean up expired bans while we're at it
    bans = bans.filter(ban => new Date(ban.end) > now);
    saveBans();
    
    // Check for active ban
    const ban = bans.find(ban => 
        ban.ip === ip && 
        new Date(ban.end) > now
    );
    return ban || null;
}

// Helper: validate media URLs against whitelist and extensions
function isAllowedMediaUrl(rawUrl, kind) {
  try {
    const u = new URL(rawUrl);
    const host = (u.hostname || '').toLowerCase();
    const pathname = (u.pathname || '').toLowerCase();
    const allowedDomains = (kind === 'image') ? (config.image_whitelist || []) : (config.video_whitelist || []);
    const domainAllowed = allowedDomains.some(d => host === d || host.endsWith('.' + d));
    if (!domainAllowed) return false;
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const videoExts = ['.mp4', '.webm', '.ogg'];
    const allowedExts = (kind === 'image') ? imageExts : videoExts;
    return allowedExts.some(ext => pathname.endsWith(ext));
  } catch (e) {
    return false;
  }
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Get real IP from headers or socket with better IP validation
  let clientIp = socket.handshake.headers['x-real-ip'] || 
                 socket.handshake.headers['x-forwarded-for'] || 
                 socket.handshake.address;
  
  // Handle X-Forwarded-For format (could be comma-separated list)
  if (clientIp && clientIp.includes(',')) {
    clientIp = clientIp.split(',')[0].trim();
  }
  
  // Validate IP format (basic validation)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([a-f0-9:]+:+)+[a-f0-9]+$/i;
  if (!ipRegex.test(clientIp)) {
    console.log('Invalid IP address detected:', clientIp);
    socket.disconnect();
    return;
  }
  
  // Initialize IP tracking
  if (!ipConnections.has(clientIp)) {
    ipConnections.set(clientIp, new Set());
  }
  
  // Initialize or update IP alts tracking
  if (!ipAlts.has(clientIp)) {
    ipAlts.set(clientIp, {
      count: 0,
      lastSeen: Date.now()
    });
  }
  
  // Update last seen time
  ipAlts.get(clientIp).lastSeen = Date.now();
  
  // Check alt limit
  if (ipAlts.get(clientIp).count >= MAX_ALTS) {
    socket.emit('errr', {
      code: 105,
      limit: MAX_ALTS
    });
    socket.disconnect();
    return;
  }
  
  // Add this connection to IP tracking
  ipConnections.get(clientIp).add(socket.id);
  ipAlts.get(clientIp).count++;
  
  // Send current alt count
  socket.emit('stats', {
    climit: `${ipAlts.get(clientIp).count}/${MAX_ALTS}`
  });

  socket.on('login', function(data) {
    // Input validation and sanitization
    if (!data || typeof data !== 'object') {
      socket.disconnect();
      return;
    }
    
    // Check for injection attempts in name and room
    if (containsInjectionAttempt(data.name) || containsInjectionAttempt(data.room)) {
      console.log('Injection attempt detected in login:', socket.id);
      socket.disconnect();
      return;
    }
    
    const name = sanitizeInput((data.name || '').trim().substring(0, 32)) || 'Anonymous';
    const room = sanitizeInput((data.room || 'main').trim());
    const guid = socket.id;

    // Check for ban if trying to join public room
    if (room === 'main') {
      const ban = checkBan(clientIp);
      if (ban) {
        socket.emit('ban', {
          reason: ban.reason,
          end: ban.end
        });
        return;
      }
    }

    const userPublic = {
      name: name,
      color: getRandomCommonColor(),
      guid: guid,
      speed: Math.floor(Math.random() * (275 - 125 + 1)) + 125,
      pitch: Math.floor(Math.random() * (125 - 15 + 1)) + 15,
      voice: 'en-us',
      admin: false,
      hat: [] 
    };

    // Join room
    socket.join(room);
    if (!rooms[room]) rooms[room] = {};
    rooms[room][guid] = userPublic;
    socket.room = room;
    socket.guid = guid;

    // Send room info
    socket.emit('room', {
      isOwner: Object.keys(rooms[room]).length === 1,
      isPublic: room === 'main',
      room: room
    });
    // Send all users in the room
    socket.emit('updateAll', {
      usersPublic: rooms[room]
    });
    // Notify others in the room
    socket.to(room).emit('update', {
      guid: guid,
      userPublic: userPublic
    });
  });

  socket.on('talk', function(data) {
    // Rate limiting
    const now = Date.now();
    if (!messageRateLimit.has(socket.guid)) {
        messageRateLimit.set(socket.guid, {
            messages: 1,
            firstMessage: now
        });
    } else {
        const limit = messageRateLimit.get(socket.guid);
        if (now - limit.firstMessage < RATE_LIMIT.interval) {
            limit.messages++;
            if (limit.messages > RATE_LIMIT.messages) {
                socket.emit('alert', { text: 'You are sending messages too fast!' });
                return;
            }
        } else {
            // Reset counter
            messageRateLimit.set(socket.guid, {
                messages: 1,
                firstMessage: now
            });
        }
    }
    
    const room = socket.room;
    const guid = socket.guid;
    
    // Validate input
    if (!room || !guid || !rooms[room] || !rooms[room][guid]) return;
    if (typeof data.text !== 'string') return;
    
    // Check for injection attempts
    if (containsInjectionAttempt(data.text)) {
        // Log attempt
        console.log(`Injection attempt from ${guid}: ${data.text}`);
        
        // Notify everyone about the attempt
        io.to(room).emit('talk', {
            guid: guid,
            text: "HEY EVERYONE LOOK AT ME I'M TRYING TO SCREW WITH THE SERVERS LMAO"
        });
        
        // Optional: Add strike system
        if (!rooms[room][guid].strikes) rooms[room][guid].strikes = 0;
        rooms[room][guid].strikes++;
        
        // Auto-kick after 3 strikes
        if (rooms[room][guid].strikes >= 3) {
            io.to(guid).emit('kick', {
                guid: guid,
                reason: "Too many injection attempts"
            });
            delete rooms[room][guid];
            io.to(room).emit('leave', { guid: guid });
        }
        
        return;
    }
    
    // Clean the text
    const cleanText = sanitizeInput(data.text);
    
    // Broadcast clean message
    io.to(room).emit('talk', {
        guid: guid,
        text: cleanText
    });
  });

  socket.on('command', function(data) {
    // Rate limiting for commands
    const now = Date.now();
    if (!commandRateLimit.has(socket.guid)) {
        commandRateLimit.set(socket.guid, {
            commands: 1,
            firstCommand: now
        });
    } else {
        const limit = commandRateLimit.get(socket.guid);
        if (now - limit.firstCommand < RATE_LIMIT.interval) {
            limit.commands++;
            if (limit.commands > RATE_LIMIT.messages) {
                socket.emit('alert', { text: 'you are sending commands too fast!!1!' });
                return;
            }
        } else {
            // Reset counter
            commandRateLimit.set(socket.guid, {
                commands: 1,
                firstCommand: now
            });
        }
    }
    
    if (!Array.isArray(data.list) || data.list.length === 0) return;
    
    // Check each command argument for injection attempts
    if (data.list.some(arg => containsInjectionAttempt(arg))) {
        console.log(`command injection attempt from ${socket.guid}: ${data.list.join(' ')}`);
        socket.emit('alert', { text: 'oh dont do that' });
        return;
    }
    
    const cmd = (data.list[0] || '').toLowerCase();
    const args = data.list.slice(1);
    const room = socket.room;
    const guid = socket.guid;
    if (!room || !guid || !rooms[room] || !rooms[room][guid]) return;
    const userPublic = rooms[room][guid];

    switch (cmd) {
      case 'asshole':
        // args[0] = target name
        io.to(room).emit('asshole', { guid, target: args[0] || '' });
        break;
      case 'owo':
        io.to(room).emit('owo', { guid, target: args[0] || '' });
        break;
      case 'name':
        if (args.length > 0) {
          const newName = sanitizeInput(args.join(' ').substring(0, 32));
          userPublic.name = newName;
          io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'h':
        userPublic.hat = ["mario"]; // Test with mario hat
        io.to(room).emit('update', { guid, userPublic });
        break;
      case 'hat':
        if (args.length > 0) {
            let requestedHats = args.join(' ').toLowerCase().split(' ').slice(0, 3);
            let allowedHats = [...ALLOWED_HATS];
            
            // Admins get access to blessed hats
            if (userPublic.admin) {
                allowedHats = [...allowedHats, ...BLESSED_HATS];
            }

            // Filter valid hats
            let validHats = requestedHats.filter(hat => allowedHats.includes(hat));
            
            userPublic.hat = validHats;
            io.to(room).emit('update', { guid, userPublic });
            
            console.log("Hat command executed:", {
                user: userPublic.name,
                requested: requestedHats,
                allowed: validHats
            });
        } else {
            // Remove all hats if no arguments
            userPublic.hat = [];
            io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'color':
        if (args[0]) {
          const requested = args[0].toLowerCase();
          if (!isKnownColor(requested)) {
            socket.emit('alert', { text: 'Unknown color.' });
            break;
          }
          if (isAdminOnlyColor(requested) && !rooms[room][guid].admin) {
            socket.emit('alert', { text: 'Color reserved for admins.' });
            break;
          }
          userPublic.color = requested;
          io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'pitch':
        if (args[0]) {
          const n = parseInt(args[0], 10);
          if (Number.isNaN(n)) break;
          const value = clamp(n, 15, 125);
          userPublic.pitch = value;
          io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'speed':
        if (args[0]) {
          const n = parseInt(args[0], 10);
          if (Number.isNaN(n)) break;
          const value = clamp(n, 125, 275);
          userPublic.speed = value;
          io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'youtube':
        if (args[0]) {
          io.to(room).emit('youtube', { guid, vid: args[0] });
        }
        break;
      case 'joke':
        // Optionally randomize a seed for joke selection
        io.to(room).emit('joke', { guid, rng: Math.random().toString() });
        break;
      case 'fact':
        io.to(room).emit('fact', { guid, rng: Math.random().toString() });
        break;
      case 'backflip':
        // args[0] can be a flag for 'swag' (optional)
        io.to(room).emit('backflip', { guid, swag: !!args[0] });
        break;
      case 'triggered':
        io.to(room).emit('triggered', { guid });
        break;
      case 'linux':
        io.to(room).emit('linux', { guid });
        break;
      case 'image': {
        if (!args[0]) break;
        const url = args[0];
        const valid = isAllowedMediaUrl(url, 'image');
        if (!valid) {
          socket.emit('alert', { text: 'Image not allowed. Domain or extension not whitelisted.' });
          break;
        }
        io.to(room).emit('image', { guid, url });
        break;
      }
      case 'video': {
        if (!args[0]) break;
        const url = args[0];
        const valid = isAllowedMediaUrl(url, 'video');
        if (!valid) {
          socket.emit('alert', { text: 'Video not allowed. Domain or extension not whitelisted.' });
          break;
        }
        io.to(room).emit('video', { guid, url });
        break;
      }
      case 'tag':
        if (args.length > 0) {
          const newTag = sanitizeInput(args.join(' ').substring(0, 20)); // Limit to 20 characters
          userPublic.tag = newTag;
          io.to(room).emit('update', { guid, userPublic });
        } else {
          // Clear tag if no arguments
          userPublic.tag = '';
          io.to(room).emit('update', { guid, userPublic });
        }
        break;
      case 'poll':
        if (args.length > 0) {
          const question = sanitizeInput(args.join(' ').trim().substring(0, 140));
          if (question.length === 0) break;
          const pollId = `${Date.now()}_${guid}`;
          roomPolls[room] = {
            id: pollId,
            question,
            yes: 0,
            no: 0,
            voters: new Map() // guid -> 'yes' | 'no'
          };
          io.to(room).emit('poll_start', {
            guid,
            pollId,
            question,
            yes: 0,
            no: 0
          });
        }
        break;
      case 'bye':
        // Just play the leave animation for this user's Bonzi, do not remove from room or disconnect
        io.to(room).emit('leave', { guid: guid });
        // After 7 seconds, make the Bonzi reappear as 'Traumatized Bonzi'
        setTimeout(() => {
          if (room && rooms[room] && rooms[room][guid]) {
            rooms[room][guid].name = 'Traumatized Bonzi';
            io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
          }
        }, 7000);
        break;
      case 'godmode':
        // Check password for godmode command
        if (!args[0]) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        if (args[0] !== config.godmode_password) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        // Enable admin privileges for this user
        if (rooms[room][guid]) {
          rooms[room][guid].admin = true;
          // Update the user's public info to show they're an admin
          io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
          // Send admin status to the client
          socket.emit('admin', { admin: true });
        }
        break;
      case 'pope':
        // Kept for backwards compatibility; prefer /color pope
        if (!rooms[room][guid].admin) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        if (rooms[room][guid]) {
          rooms[room][guid].color = 'pope';
          io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
        }
        break;
      case 'kick':
        console.log('Kick command received:', {
          sender: guid,
          hasAdmin: rooms[room][guid].admin,
          target: args[0],
          reason: args.slice(1).join(' ')
        });
        // Check if user has godmode
        if (!rooms[room][guid].admin) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        // Find the target user by name
        const kickTargetGuid = Object.keys(rooms[room]).find(key => 
          rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
        );
        console.log('Found kick target:', kickTargetGuid);
        if (kickTargetGuid && kickTargetGuid !== guid) {
          const reason = args.slice(1).join(' ') || 'No reason provided';
          // Send kick event to target and leave event to others
          io.to(kickTargetGuid).emit('kick', {
            guid: kickTargetGuid,
            reason: reason
          });
          // Remove user from room
          delete rooms[room][kickTargetGuid];
          // Notify everyone they left
          io.to(room).emit('leave', { guid: kickTargetGuid });
          console.log('Kick executed successfully');
        }
        break;
      case 'ban':
        // Check if user has godmode
        if (!rooms[room][guid].admin) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        // Find the target user by name
        const banTargetGuid = Object.keys(rooms[room]).find(key => 
          rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
        );
        console.log('Found ban target:', banTargetGuid);
        if (banTargetGuid && banTargetGuid !== guid) {
          const reason = args.slice(1).join(' ') || 'No reason provided';
          const banEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour ban
          
          // Get target's IP from connected sockets
          let targetIp = null;
          Object.keys(io.sockets.connected).forEach(socketId => {
            if (socketId === banTargetGuid) {
              const targetSocket = io.sockets.connected[socketId];
              targetIp = targetSocket.handshake.headers['x-real-ip'] || 
                        targetSocket.handshake.headers['x-forwarded-for'] || 
                        targetSocket.handshake.address;
            }
          });

          if (targetIp) {
            // Add to persistent bans with IP
            bans.push({
              ip: targetIp,
              name: rooms[room][banTargetGuid].name, // Keep name for reference
              reason: reason,
              end: banEnd,
              bannedBy: rooms[room][guid].name,
              bannedAt: new Date().toISOString()
            });
            saveBans();

            // Notify all sockets from this IP about the ban
            Object.keys(io.sockets.connected).forEach(socketId => {
              const connectedSocket = io.sockets.connected[socketId];
              const socketIp = connectedSocket.handshake.headers['x-real-ip'] || 
                              connectedSocket.handshake.headers['x-forwarded-for'] || 
                              connectedSocket.handshake.address;
              
              if (socketIp === targetIp) {
                // Only remove them if they're in the main room
                const socketRoom = connectedSocket.room;
                const socketGuid = connectedSocket.guid;
                if (socketRoom === 'main' && rooms[socketRoom] && rooms[socketRoom][socketGuid]) {
                  delete rooms[socketRoom][socketGuid];
                  // Clean up empty rooms
                  if (Object.keys(rooms[socketRoom]).length === 0) {
                    delete rooms[socketRoom];
                  }
                  io.to(socketRoom).emit('leave', { guid: socketGuid });
                }
                
                // Notify them about the ban
                connectedSocket.emit('ban', {
                  guid: banTargetGuid,
                  reason: reason,
                  end: banEnd
                });
              }
            });

            console.log('Ban executed successfully');
          }
        }
        break;
      case 'announcement':
        // Admin-only broadcast to all clients; accepts HTML
        if (!rooms[room][guid].admin) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        if (args.length > 0) {
          const html = sanitizeInput(args.join(' ').trim());
          if (html.length > 0) {
            io.emit('announcement', {
              from: rooms[room][guid].name,
              html: html
            });
          }
        }
        break;
      case 'nuke':
        // Admin-only nuke command
        if (!rooms[room][guid].admin) {
          socket.emit('alert', { text: 'Did you try password?' });
          break;
        }
        // Find the target user by name
        const nukeTargetGuid = Object.keys(rooms[room]).find(key => 
          rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
        );
        if (nukeTargetGuid && nukeTargetGuid !== guid) {
          // Broadcast explosion animation to everyone in room
          io.to(room).emit('nuke', {
            targetGuid: nukeTargetGuid,
            targetName: rooms[room][nukeTargetGuid].name,
            nukerName: rooms[room][guid].name
          });
          // After 4 seconds, refresh the target's page
          setTimeout(() => {
            const targetSocket = io.sockets.connected[nukeTargetGuid];
            if (targetSocket) {
              targetSocket.emit('refresh');
            }
          }, 4000);
        }
        break;
      // For now we're just gonna end this command list here
    }
  });

  // Vote handler
  socket.on('poll_vote', function(data) {
    const room = socket.room;
    const guid = socket.guid;
    if (!room || !guid) return;
    const active = roomPolls[room];
    if (!active || !data || data.pollId !== active.id) return;
    const choice = data.choice === 'yes' ? 'yes' : (data.choice === 'no' ? 'no' : null);
    if (!choice) return;
    // adjust counts for change of mind
    const prev = active.voters.get(guid);
    if (prev === choice) {
      // no change
    } else {
      if (prev === 'yes') active.yes = Math.max(0, active.yes - 1);
      if (prev === 'no') active.no = Math.max(0, active.no - 1);
      if (choice === 'yes') active.yes += 1; else active.no += 1;
      active.voters.set(guid, choice);
      io.to(room).emit('poll_update', {
        pollId: active.id,
        yes: active.yes,
        no: active.no
      });
    }
  });

  socket.on('disconnect', function() {
    // Remove from active connections tracking and reset IP count
    if (ipConnections.has(clientIp)) {
      ipConnections.get(clientIp).delete(socket.id);
      if (ipConnections.get(clientIp).size === 0) {
        ipConnections.delete(clientIp);
        // Reset alt count when all connections are gone
        if (ipAlts.has(clientIp)) {
          ipAlts.delete(clientIp);
        }
      }
    }

    // Clean up rate limiting
    messageRateLimit.delete(socket.guid);
    commandRateLimit.delete(socket.guid);

    const room = socket.room;
    const guid = socket.guid;
    if (room && rooms[room] && rooms[room][guid]) {
      // Remove user
      delete rooms[room][guid];
      // Notify others
      socket.to(room).emit('leave', { guid: guid });
      // Clean up empty rooms
      if (Object.keys(rooms[room]).length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});