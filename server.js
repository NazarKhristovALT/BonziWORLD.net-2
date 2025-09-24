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
    "demonmask", "shirt", "tinymario", "cap", "palestine", "hiimstickman", 
    "back", "kitty", "satan", "bull", "ballet", "scarf", "bear", "bfdi", "bieber", 
    "bowtie", "bucket", "chain", "chef", "clippy", "cowboy", "elon", "evil", 
    "headphones", "northkorea", "horse", "kamala", "maga", "ninja", "obama", 
    "pirate", "pot", "stare", "tophat", "troll", "windows", "witch", "wizard", "patrick"
];

const BLESSED_HATS = [
    "premium", "scorp", "dank", "cake", "cigar", "gangster", "illuminati", "propeller", "gamer",
    "windows2", "windows3", "windows4", "windows5", "windows6", "windows7", "windows8", 
    "windows9", "windows10", "windows11", "windows12", "mario2", "luigi", "megatron"
];

const MODERATOR_HATS = [
    "police", "soldier", "guard", "scorp", "king"
];

const ADMIN_HATS = [
    "scorp"
];
const BLESSED_USERS = [
    // Add blessed usernames or IPs here
    "exampleUser",
    "anotherUser"
];

const MODERATOR_USERS = [
    // Add moderator usernames here
    "trustedUser1",
    "trustedUser2"
];

// Rate limiting configuration (only for messages)
const RATE_LIMIT = {
    interval: 60000, // 1 minute in milliseconds
    messages: 10     // Max messages per interval
};

// Command timeout configuration
const COMMAND_TIMEOUT = 1000; // 1 second timeout for commands

// Security constants
const BLOCKED_PATTERNS = [
    // JavaScript execution
    'javascript:', 'eval(', 'Function(', '.constructor', 'document.',
    'window.', 'localStorage', 'sessionStorage', 'indexedDB', 
    'XMLHttpRequest', 'WebSocket', 'fetch(', 'Worker(', 
    'importScripts', 'Proxy(', 'addEventListener',

    // HTML injection
    '<script', '</script', '<iframe', '<object', '<embed',
    'javascript:', 'vbscript:', 'data:', 'onload=', 'onerror=',
    'onclick=', 'onmouseover=', 'onfocus=', 'onblur=',

    // Protocol handlers
    'file:', 'data:', 'blob:', 'about:', 'javascript:', 'vbscript:',
    
    // Malicious patterns
    '[[', ']]', '__proto__', '__defineGetter__', '__defineSetter__',
    'prototype', '.call(', '.apply(', '.bind('
];

// Enhanced IP tracking and limits (like index.js)
const ipConnections = new Map(); // Tracks active socket IDs per IP
const ipConnectionCounts = new Map(); // Tracks total connections per IP (like index.js)
let altLimit = 5; // Default connection limit per IP

// Text filtering system (like index.js)
const BLACKLIST_PATH = path.join(__dirname, 'config', 'blacklist.txt');
let blacklist = [];

// Load blacklist
function loadBlacklist() {
    try {
        if (fs.existsSync(BLACKLIST_PATH)) {
            const blacklistContent = fs.readFileSync(BLACKLIST_PATH, 'utf8')
                .toString()
                .replace(/\r/g, '')
                .split('\n')
                .filter(word => word.trim() !== '' && !word.startsWith('#'));
            blacklist = blacklistContent;
            console.log('Blacklist loaded with', blacklist.length, 'words');
        } else {
            // Create default blacklist file
            const configDir = path.dirname(BLACKLIST_PATH);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(BLACKLIST_PATH, '# Add blocked words/phrases here\n# One per line\n');
            console.log('Created default blacklist file');
        }
    } catch (err) {
        console.error('Error loading blacklist:', err);
    }
}

// Text filtering function (like index.js)
function filterText(text) {
    if (typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    for (const word of blacklist) {
        if (word && lowerText.includes(word.toLowerCase())) {
            return true;
        }
    }
    return false;
}

// Enhanced IP validation function
function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 validation (basic)
    const ipv6Regex = /^([a-f0-9:]+:+)+[a-f0-9]+$/i;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Function to get clean IP (like index.js)
function getCleanIP(socket) {
    let clientIp = socket.handshake.headers['cf-connecting-ip'] || socket.handshake.headers['x-real-ip'] || 
                   socket.handshake.headers['x-forwarded-for'] || 
                   socket.handshake.address;
    
    // Handle X-Forwarded-For format
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    
    // Additional IP cleaning
    clientIp = clientIp.replace(/::ffff:/, ''); // Remove IPv6 prefix for IPv4 addresses
    
    return isValidIP(clientIp) ? clientIp : null;
}

// Update containsInjectionAttempt to be more robust
function containsInjectionAttempt(text) {
    if (typeof text !== 'string') return true;
    
    // Convert to lowercase and normalize whitespace
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    
    // Check for blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
        if (normalized.includes(pattern.toLowerCase())) {
            return true;
        }
    }
    
    // Check for HTML tags
    if (/<[^>]*>/g.test(text)) {
        return true; 
    }

    // Check for URL schemes
    if (/^(?:javascript|data|vbscript|file):/i.test(text)) {
        return true;
    }

    // Check blacklist
    if (filterText(text)) {
        return true;
    }

    return false;
}

// Enhanced sanitize function with blacklist checking
function sanitizeInput(text) {
    if (typeof text !== 'string') return '';

    // First check blacklist and return hashes if blocked (like index.js)
    if (filterText(text)) {
        return '#'.repeat(Math.min(text.length, 32));
    }
    
    return text
        // Remove HTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Remove quotes
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove slashes
        .replace(/\//g, '&#x2F;')
        // Remove backticks
        .replace(/`/g, '&#x60;')
        // Remove null bytes
        .replace(/\0/g, '')
        // Limit length
        .substring(0, 1000);
}

// Rate limiting trackers (only for messages)
const messageRateLimit = new Map();

// Cleanup function to remove old IP entries
function cleanupIpConnections() {
    const now = Date.now();
    // We'll cleanup on disconnect instead of interval for better performance
}

// Run cleanup every hour
setInterval(cleanupIpConnections, 3600000);

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

const configPath = path.join(__dirname, 'config', 'config.json');
const bansPath = path.join(__dirname, 'bans.json');

// Default config
let config = {
    godmode_password: 'bonzi',
    moderator_password: 'modpass',
    image_whitelist: DEFAULT_IMAGE_WHITELIST.slice(),
    video_whitelist: DEFAULT_VIDEO_WHITELIST.slice(),
    altlimit: 5, // Added like index.js
    namelimit: 32, // Added like index.js
    slowmode: 1000 // Added like index.js
};

try {
    if (fs.existsSync(configPath)) {
        const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Ensure defaults exist if missing in existing config file
        if (loadedConfig && typeof loadedConfig === 'object') {
            config = { ...config, ...loadedConfig };
        }
        if (typeof config.godmode_password !== 'string') config.godmode_password = 'bonzi';
        if (typeof config.moderator_password !== 'string') config.moderator_password = 'modpass';
        if (!Array.isArray(config.image_whitelist) || config.image_whitelist.length === 0) config.image_whitelist = DEFAULT_IMAGE_WHITELIST.slice();
        if (!Array.isArray(config.video_whitelist) || config.video_whitelist.length === 0) config.video_whitelist = DEFAULT_VIDEO_WHITELIST.slice();
        
        // Load alt limit from config
        if (config.altlimit) {
            altLimit = config.altlimit;
        }
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

// Load blacklist on startup
loadBlacklist();

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

// Helper function to check permissions
function hasPermission(userPublic, requiredLevel) {
    if (requiredLevel === 'admin') {
        return userPublic.admin;
    }
    if (requiredLevel === 'moderator') {
        return userPublic.admin || userPublic.moderator;
    }
    return true; // public commands
}

// Enhanced connection handler with IP protection
io.on('connection', (socket) => {
    // Get and validate IP (like index.js)
    const clientIp = getCleanIP(socket);
    if (!clientIp) {
        console.log('Invalid IP address, disconnecting:', socket.handshake.address);
        socket.disconnect();
        return;
    }
    
    console.log('Connection attempt from:', clientIp, socket.id);
    
    // IP-based connection limiting (like index.js)
    if (!ipConnectionCounts.has(clientIp)) {
        ipConnectionCounts.set(clientIp, 0);
    }
    
    const currentConnections = ipConnectionCounts.get(clientIp);
    if (currentConnections >= altLimit) {
        console.log('IP connection limit exceeded:', clientIp, currentConnections);
        socket.emit('error', {
            code: 'CONNECTION_LIMIT',
            message: `Too many connections from your IP (limit: ${altLimit})`
        });
        socket.disconnect();
        return;
    }
    
    // Increment connection count
    ipConnectionCounts.set(clientIp, currentConnections + 1);
    
    // Initialize IP tracking for active connections
    if (!ipConnections.has(clientIp)) {
        ipConnections.set(clientIp, new Set());
    }
    ipConnections.get(clientIp).add(socket.id);
    
    // Send connection stats to client
    socket.emit('connectionStats', {
        ip: clientIp,
        currentConnections: currentConnections + 1,
        maxConnections: altLimit
    });
    socket.on('banMyself',(data) => {
        socket.emit("ban", {
            reason: data.reason,
            end: data.end
        });
        socket.disconnect();
    })
    // Enhanced login handler with better validation
    socket.on('login', function(data) {
        // Strict input validation (like index.js)
        if (!data || typeof data !== 'object' || 
            typeof data.name !== 'string' || 
            typeof data.room !== 'string') {
            socket.disconnect();
            return;
        }
        
        // Check for injection attempts
        if (containsInjectionAttempt(data.name) || containsInjectionAttempt(data.room)) {
            console.log('Injection attempt detected in login:', socket.id);
            socket.disconnect();
            return;
        }
        
        const name = sanitizeInput((data.name || '').trim().substring(0, config.namelimit || 32)) || 'Anonymous';
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
            moderator: false,
            hat: [],
            coins: 500 // Added like index.js
        };

        // Check for moderator status
        if (MODERATOR_USERS.includes(name.toLowerCase())) {
            userPublic.moderator = true;
            userPublic.color = 'blue';
        }

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
        
        // Send login success with current user's GUID
        socket.emit('loginSuccess', {
            guid: guid,
            userPublic: userPublic
        });
        
        // Send all users in the room
        socket.emit('updateAll', {
            usersPublic: rooms[room]
        });
        
        // Send coin display like index.js
        socket.emit('coinDisplay', { coins: userPublic.coins });
        
        // Notify others in the room
        socket.to(room).emit('update', {
            guid: guid,
            userPublic: userPublic
        });
    });

    // Enhanced talk handler with slowmode (like index.js)
    let slowed = false; // Slowmode state
    
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
        
        // Slowmode check (like index.js)
        if (slowed) {
            return;
        }
        
        const room = socket.room;
        const guid = socket.guid;
        
        // Validate input
        if (!room || !guid || !rooms[room] || !rooms[room][guid]) return;
        if (typeof data.text !== 'string') return;
        
        // Check for injection attempts
        if (containsInjectionAttempt(data.text)) {
            console.log(`Injection attempt from ${guid}: ${data.text}`);
            
            // Apply slowmode
            slowed = true;
            setTimeout(() => {
                slowed = false;
            }, config.slowmode || 1000);
            
            // Notify everyone about the attempt
            io.to(room).emit('talk', {
                guid: guid,
                text: " "
            });
            
            // Strike system
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
        
        // Apply slowmode after successful message (like index.js)
        slowed = true;
        setTimeout(() => {
            slowed = false;
        }, config.slowmode || 1000);
        
        // Create a special version for TTS that removes [[ sequences
        const ttsText = cleanText.replace(/\[\[/g, '');
        
        // Broadcast clean message with both display and TTS versions
        io.to(room).emit('talk', {
            guid: guid,
            text: cleanText,
            tts: ttsText
        });
    });

    // Enhanced command handler with slowmode
    socket.on('command', function(data) {
        // Slowmode check for commands (like index.js)
        if (slowed) {
            return;
        }
        
        // Set up 1-second timeout for command execution
        let timeout = setTimeout(() => {
            socket.emit('alert', { text: 'Command timed out (1 second limit)' });
            return;
        }, COMMAND_TIMEOUT);

        try {
            // Apply slowmode for commands too (like index.js)
            slowed = true;
            setTimeout(() => {
                slowed = false;
            }, config.slowmode || 1000);
            
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
                case 'modmode':
                    if (!args[0]) {
                        socket.emit('alert', { text: 'Enter moderator password' });
                        break;
                    }
                    if (args[0] !== config.moderator_password) {
                        socket.emit('alert', { text: 'Invalid moderator password' });
                        break;
                    }
                    if (rooms[room][guid]) {
                        rooms[room][guid].moderator = true;
                        rooms[room][guid].color = 'blue';
                        io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
                        socket.emit('moderator', { moderator: true });
                    }
                    break;

                case 'asshole':
                    io.to(room).emit('asshole', { guid, target: args[0] || '' });
                    break;
                    
                case 'owo':
                    io.to(room).emit('owo', { guid, target: args[0] || '' });
                    break;
                    
                case 'name':
                    if (args.length > 0) {
                        const newName = sanitizeInput(args.join(' ').substring(0, config.namelimit || 32));
                        userPublic.name = newName;
                        io.to(room).emit('update', { guid, userPublic });
                    }
                    break;
                    
                case 'h':
                    userPublic.hat = ["mario"];
                    io.to(room).emit('update', { guid, userPublic });
                    break;
                    
                case 'hat':
                    if (args.length > 0) {
                        let requestedHats = args.join(' ').toLowerCase().split(' ').slice(0, 3);
                        let allowedHats = [...ALLOWED_HATS];
                        
                        if (userPublic.moderator || userPublic.admin) {
                            allowedHats = [...allowedHats, ...MODERATOR_HATS, ...BLESSED_HATS];
                        }
                        
                        if (userPublic.admin) {
                            allowedHats = [...allowedHats, ...BLESSED_HATS];
                        }

                        let validHats = requestedHats.filter(hat => allowedHats.includes(hat));
                        
                        userPublic.hat = validHats;
                        io.to(room).emit('update', { guid, userPublic });
                    } else {
                        userPublic.hat = [];
                        io.to(room).emit('update', { guid, userPublic });
                    }
                    break;
                    
                case 'figure':
                    if (args[0]) {
                        const figure = args[0].toLowerCase();
                        if (figure === 'peedy') {
                            userPublic.figure = 'peedy';
                            io.to(room).emit('update', { guid, userPublic });
                        } else if (figure === 'bonzi') {
                            userPublic.figure = 'bonzi';
                            io.to(room).emit('update', { guid, userPublic });
                        }
                    } else {
                        userPublic.figure = 'bonzi';
                        io.to(room).emit('update', { guid, userPublic });
                    }
                    break;
                    
                case 'color':
                    if (args[0]) {
                        const requested = args[0].toLowerCase();
                        if (!isKnownColor(requested)) break;
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
                    
                case 'shop':
                    socket.emit('shop', { guid: guid });
                    break;

                case 'event':
                    socket.emit('event', { guid: guid });
                    break;
                    
                case 'youtube':
                    if (args[0]) {
                        io.to(room).emit('youtube', { guid, vid: args[0] });
                    }
                    break;
                    
                case 'joke':
                    io.to(room).emit('joke', { guid, rng: Math.random().toString() });
                    break;
                    
                case 'fact':
                    io.to(room).emit('fact', { guid, rng: Math.random().toString() });
                    break;
                    
                case 'backflip':
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
                        const newTag = sanitizeInput(args.join(' ').substring(0, 20));
                        userPublic.tag = newTag;
                        io.to(room).emit('update', { guid, userPublic });
                    } else {
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
                            voters: new Map()
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
                    io.to(room).emit('leave', { guid: guid });
                    setTimeout(() => {
                        if (room && rooms[room] && rooms[room][guid]) {
                            rooms[room][guid].name = 'Traumatized Bonzi';
                            io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
                        }
                    }, 7000);
                    break;
                    
                case 'godmode':
                    if (!args[0]) {
                        socket.emit('alert', { text: 'Did you try password?' });
                        break;
                    }
                    if (args[0] !== config.godmode_password) {
                        socket.emit('alert', { text: 'Did you try password?' });
                        break;
                    }
                    if (rooms[room][guid]) {
                        rooms[room][guid].admin = true;
                        io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
                        socket.emit('admin', { admin: true });
                    }
                    break;
                    
                case 'pope':
                    if (!rooms[room][guid].admin) {
                        socket.emit('alert', { text: 'Did you try password?' });
                        break;
                    }
                    if (rooms[room][guid]) {
                        rooms[room][guid].color = 'pope';
                        io.to(room).emit('update', { guid, userPublic: rooms[room][guid] });
                    }
                    break;
                    
                case 'shush':
                    if (!hasPermission(userPublic, 'moderator')) {
                        socket.emit('alert', { text: 'Moderator access required' });
                        break;
                    }
                    const shushTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (shushTargetGuid && shushTargetGuid !== guid) {
                        io.to(room).emit('shush', {
                            guid: shushTargetGuid,
                            shusher: rooms[room][guid].name
                        });
                    }
                    break;
                    
                case 'moduser':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    const modTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    console.log('Found mod target:', modTargetGuid);
                    if (modTargetGuid && modTargetGuid !== guid) {
                        rooms[room][modTargetGuid].moderator = true;
                        rooms[room][modTargetGuid].color = 'blue';
                        
                        io.to(modTargetGuid).emit('moderator', { moderator: true });
                        
                        io.to(room).emit('update', {
                            guid: modTargetGuid,
                            userPublic: rooms[room][modTargetGuid]
                        });
                        
                        socket.emit('alert', { text: 'User promoted to moderator' });
                        console.log('Mod promotion executed successfully');
                    }
                    break;

                case 'unmoduser':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    const unmodTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    console.log('Found unmod target:', unmodTargetGuid);
                    if (unmodTargetGuid && unmodTargetGuid !== guid) {
                        rooms[room][unmodTargetGuid].moderator = false;
                        rooms[room][unmodTargetGuid].color = getRandomCommonColor();
                        
                        io.to(unmodTargetGuid).emit('moderator', { moderator: false });
                        
                        io.to(room).emit('update', {
                            guid: unmodTargetGuid,
                            userPublic: rooms[room][unmodTargetGuid]
                        });
                        
                        socket.emit('alert', { text: 'User demoted from moderator' });
                        console.log('Mod removal executed successfully');
                    }
                    break;

                case 'changecolor':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    if (args.length < 2) {
                        socket.emit('alert', { text: 'Usage: /changecolor [username] [color]' });
                        break;
                    }
                    const colorTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (colorTargetGuid) {
                        const requestedColor = args[1].toLowerCase();
                        if (!isKnownColor(requestedColor)) {
                            socket.emit('alert', { text: 'Unknown color' });
                            break;
                        }
                        if (isAdminOnlyColor(requestedColor) && !rooms[room][colorTargetGuid].admin) {
                            socket.emit('alert', { text: 'Color reserved for admins.' });
                            break;
                        }
                        rooms[room][colorTargetGuid].color = requestedColor;
                        io.to(room).emit('update', {
                            guid: colorTargetGuid,
                            userPublic: rooms[room][colorTargetGuid]
                        });
                        socket.emit('alert', { text: 'Color changed successfully' });
                    }
                    break;

                case 'changename':
    if (!userPublic.admin) {
        socket.emit('alert', { text: 'Admin access required' });
        break;
    }
    if (args.length < 2) {
        socket.emit('alert', { text: 'Usage: /changename [username] [new name]' });
        break;
    }
    const nameTargetGuid = Object.keys(rooms[room]).find(key => 
        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
    );
    if (nameTargetGuid) {
        const newName = sanitizeInput(args.slice(1).join(' ').substring(0, config.namelimit || 32));
        if (newName.length === 0) {
            socket.emit('alert', { text: 'Invalid name' });
            break;
        }
        rooms[room][nameTargetGuid].name = newName;
        io.to(room).emit('update', {
            guid: nameTargetGuid,
            userPublic: rooms[room][nameTargetGuid]
        });
        socket.emit('alert', { text: 'Name changed successfully' });
    }
    break;

                case 'changetag':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    if (args.length < 2) {
                        socket.emit('alert', { text: 'Usage: /changetag [username] [new tag]' });
                        break;
                    }
                    const tagTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (tagTargetGuid) {
                        const newTag = sanitizeInput(args.slice(1).join(' ').substring(0, 20));
                        rooms[room][tagTargetGuid].tag = newTag;
                        io.to(room).emit('update', {
                            guid: tagTargetGuid,
                            userPublic: rooms[room][tagTargetGuid]
                        });
                        socket.emit('alert', { text: 'Tag changed successfully' });
                    }
                    break;
                    
                case 'bless':
                    if (!hasPermission(userPublic, 'moderator')) {
                        socket.emit('alert', { text: 'Moderator access required' });
                        break;
                    }
                    const blessTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (blessTargetGuid) {
                        rooms[room][blessTargetGuid].color = 'angel';
                        io.to(room).emit('update', {
                            guid: blessTargetGuid,
                            userPublic: rooms[room][blessTargetGuid]
                        });
                    }
                    break;

                case 'ultrabless':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    const ultraBlessTargetGuid = Object.keys(rooms[room]).find(key =>
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (ultraBlessTargetGuid) {
                        rooms[room][ultraBlessTargetGuid].color = 'angelsupreme';
                        io.to(room).emit('update', {
                            guid: ultraBlessTargetGuid, 
                            userPublic: rooms[room][ultraBlessTargetGuid]
                        });
                    }
                    break;

                case 'kick':
                    console.log('Kick command received:', {
                        sender: guid,
                        hasAdmin: rooms[room][guid].admin,
                        hasModerator: rooms[room][guid].moderator,
                        target: args[0],
                        reason: args.slice(1).join(' ')
                    });
                    if (!hasPermission(userPublic, 'moderator')) {
                        socket.emit('alert', { text: 'Moderator access required' });
                        break;
                    }
                    const kickTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    console.log('Found kick target:', kickTargetGuid);
                    if (kickTargetGuid && kickTargetGuid !== guid) {
                        const reason = args.slice(1).join(' ') || 'No reason provided';
                        io.to(kickTargetGuid).emit('kick', {
                            guid: kickTargetGuid,
                            reason: reason
                        });
                        delete rooms[room][kickTargetGuid];
                        io.to(room).emit('leave', { guid: kickTargetGuid });
                        console.log('Kick executed successfully');
                    }
                    break;

                case 'tempban':
                    if (!hasPermission(userPublic, 'moderator')) {
                        socket.emit('alert', { text: 'Moderator access required' });
                        break;
                    }
                    const tempbanTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    console.log('Found tempban target:', tempbanTargetGuid);
                    if (tempbanTargetGuid && tempbanTargetGuid !== guid) {
                        const reason = args.slice(1).join(' ') || 'No reason provided';
                        const banEnd = new Date(Date.now() + 5 * 60 * 1000).toISOString();
                        
                        let targetIp = null;
                        Object.keys(io.sockets.connected).forEach(socketId => {
                            if (socketId === tempbanTargetGuid) {
                                const targetSocket = io.sockets.connected[socketId];
                                targetIp = getCleanIP(targetSocket);
                            }
                        });

                        if (targetIp) {
                            bans.push({
                                ip: targetIp,
                                name: rooms[room][tempbanTargetGuid].name,
                                reason: `[TEMP] ${reason}`,
                                end: banEnd,
                                bannedBy: rooms[room][guid].name,
                                bannedAt: new Date().toISOString(),
                                isTemp: true
                            });
                            saveBans();

                            Object.keys(io.sockets.connected).forEach(socketId => {
                                const connectedSocket = io.sockets.connected[socketId];
                                const socketIp = getCleanIP(connectedSocket);
                                
                                if (socketIp === targetIp) {
                                    const socketRoom = connectedSocket.room;
                                    const socketGuid = connectedSocket.guid;
                                    if (socketRoom === 'main' && rooms[socketRoom] && rooms[socketRoom][socketGuid]) {
                                        delete rooms[socketRoom][socketGuid];
                                        if (Object.keys(rooms[socketRoom]).length === 0) {
                                            delete rooms[socketRoom];
                                        }
                                        io.to(socketRoom).emit('leave', { guid: socketGuid });
                                    }
                                    
                                    connectedSocket.emit('ban', {
                                        guid: tempbanTargetGuid,
                                        reason: `Temporary ban: ${reason}`,
                                        end: banEnd
                                    });
                                }
                            });

                            console.log('Tempban executed successfully');
                        }
                    }
                    break;

                case 'ban':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    const banTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    console.log('Found ban target:', banTargetGuid);
                    if (banTargetGuid && banTargetGuid !== guid) {
                        const reason = args.slice(1).join(' ') || 'No reason provided';
                        const banEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                        
                        let targetIp = null;
                        Object.keys(io.sockets.connected).forEach(socketId => {
                            if (socketId === banTargetGuid) {
                                const targetSocket = io.sockets.connected[socketId];
                                targetIp = getCleanIP(targetSocket);
                            }
                        });

                        if (targetIp) {
                            bans.push({
                                ip: targetIp,
                                name: rooms[room][banTargetGuid].name,
                                reason: reason,
                                end: banEnd,
                                bannedBy: rooms[room][guid].name,
                                bannedAt: new Date().toISOString(),
                                isTemp: false
                            });
                            saveBans();

                            Object.keys(io.sockets.connected).forEach(socketId => {
                                const connectedSocket = io.sockets.connected[socketId];
                                const socketIp = getCleanIP(connectedSocket);
                                
                                if (socketIp === targetIp) {
                                    const socketRoom = connectedSocket.room;
                                    const socketGuid = connectedSocket.guid;
                                    if (socketRoom === 'main' && rooms[socketRoom] && rooms[socketRoom][socketGuid]) {
                                        delete rooms[socketRoom][socketGuid];
                                        if (Object.keys(rooms[socketRoom]).length === 0) {
                                            delete rooms[socketRoom];
                                        }
                                        io.to(socketRoom).emit('leave', { guid: socketGuid });
                                    }
                                    
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

                case 'unban':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    const search = args[0];
                    if (!search) {
                        socket.emit('alert', { text: 'Provide IP or username to unban' });
                        break;
                    }
                    
                    const initialLength = bans.length;
                    bans = bans.filter(ban => ban.ip !== search && ban.name.toLowerCase() !== search.toLowerCase());
                    
                    if (bans.length < initialLength) {
                        saveBans();
                        socket.emit('alert', { text: 'User unbanned successfully' });
                    } else {
                        socket.emit('alert', { text: 'No matching ban found' });
                    }
                    break;

                case 'bans':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    socket.emit('bans_list', { bans: bans });
                    break;

                case 'pollvote':
                    if (!roomPolls[room]) break;
                    if (args[0] === 'yes' || args[0] === 'no') {
                        const vote = args[0];
                        const poll = roomPolls[room];
                        if (poll.voters.has(guid)) {
                            const oldVote = poll.voters.get(guid);
                            if (oldVote === 'yes') poll.yes--;
                            else poll.no--;
                        }
                        poll.voters.set(guid, vote);
                        if (vote === 'yes') poll.yes++;
                        else poll.no++;
                        io.to(room).emit('poll_update', {
                            pollId: poll.id,
                            yes: poll.yes,
                            no: poll.no
                        });
                    }
                    break;

                case 'pollend':
                    if (!roomPolls[room]) break;
                    if (hasPermission(userPublic, 'moderator')) {
                        const poll = roomPolls[room];
                        io.to(room).emit('poll_end', {
                            pollId: poll.id,
                            yes: poll.yes,
                            no: poll.no
                        });
                        delete roomPolls[room];
                    }
                    break;

                // Coin system commands (like index.js)
                case 'coins':
                    socket.emit('coinDisplay', { coins: userPublic.coins });
                    break;

                case 'givecoins':
                    if (!userPublic.admin) {
                        socket.emit('alert', { text: 'Admin access required' });
                        break;
                    }
                    if (args.length < 2) {
                        socket.emit('alert', { text: 'Usage: /givecoins [username] [amount]' });
                        break;
                    }
                    const coinTargetGuid = Object.keys(rooms[room]).find(key => 
                        rooms[room][key].name.toLowerCase() === args[0].toLowerCase()
                    );
                    if (coinTargetGuid) {
                        const amount = parseInt(args[1], 10);
                        if (isNaN(amount) || amount <= 0) {
                            socket.emit('alert', { text: 'Invalid amount' });
                            break;
                        }
                        rooms[room][coinTargetGuid].coins += amount;
                        io.to(coinTargetGuid).emit('coinDisplay', { coins: rooms[room][coinTargetGuid].coins });
                        socket.emit('alert', { text: `Gave ${amount} coins to ${rooms[room][coinTargetGuid].name}` });
                    }
                    break;

                case 'daily':
                    const lastDaily = userPublic.lastDaily || 0;
                    const now = Date.now();
                    const oneDay = 24 * 60 * 60 * 1000;
                    
                    if (now - lastDaily < oneDay) {
                        const nextDaily = new Date(lastDaily + oneDay);
                        socket.emit('alert', { text: `Next daily reward available at ${nextDaily.toLocaleTimeString()}` });
                    } else {
                        const reward = 100;
                        userPublic.coins += reward;
                        userPublic.lastDaily = now;
                        socket.emit('coinDisplay', { coins: userPublic.coins });
                        socket.emit('alert', { text: `You received ${reward} daily coins!` });
                    }
                    break;

                default:
                    // Unknown command
                    break;
            }
        } finally {
            clearTimeout(timeout);
        }
    });

    // Enhanced disconnect handler with IP cleanup
    socket.on('disconnect', function() {
        console.log('User disconnected:', socket.id);
        const room = socket.room;
        const guid = socket.guid;

        // Decrement IP connection count
        if (clientIp && ipConnectionCounts.has(clientIp)) {
            const currentCount = ipConnectionCounts.get(clientIp);
            if (currentCount > 1) {
                ipConnectionCounts.set(clientIp, currentCount - 1);
            } else {
                ipConnectionCounts.delete(clientIp);
            }
        }

        // Remove from IP tracking
        if (clientIp && ipConnections.has(clientIp)) {
            const connections = ipConnections.get(clientIp);
            connections.delete(socket.id);
            if (connections.size === 0) {
                ipConnections.delete(clientIp);
            }
        }

        // Remove from room
        if (room && guid && rooms[room] && rooms[room][guid]) {
            delete rooms[room][guid];
            if (Object.keys(rooms[room]).length === 0) {
                delete rooms[room];
            } else {
                socket.to(room).emit('leave', { guid: guid });
            }
        }
    });
});

// Add blacklist reload endpoint (like index.js)
app.get('/reload-blacklist', (req, res) => {
    if (req.query.key !== config.godmode_password) {
        return res.status(403).send('Forbidden');
    }
    loadBlacklist();
    res.send('Blacklist reloaded successfully');
});

// Add config reload endpoint (like index.js)
app.get('/reload-config', (req, res) => {
    if (req.query.key !== config.godmode_password) {
        return res.status(403).send('Forbidden');
    }
    try {
        if (fs.existsSync(configPath)) {
            const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (loadedConfig && typeof loadedConfig === 'object') {
                config = { ...config, ...loadedConfig };
                if (config.altlimit) {
                    altLimit = config.altlimit;
                }
                res.send('Config reloaded successfully');
            } else {
                res.status(500).send('Invalid config file');
            }
        } else {
            res.status(404).send('Config file not found');
        }
    } catch (err) {
        res.status(500).send('Error reloading config: ' + err.message);
    }
});

// Start the server
server.listen(PORT, () => {
    console.log('Server running at http://localhost:' + PORT);
    console.log('Alt limit:', altLimit);
    console.log('Blacklist words:', blacklist.length);
});