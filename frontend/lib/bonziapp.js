//this some of them are made by scorp and niko so be careful some of them may be vibe coded...
//HEY!
// PLS FIX NOW!!!!!!!!




"use strict";
var passcode = "";
var err = false;
var admin = false;
// Color configuration (easier to extend)
var COMMON_COLORS = ["black", "blue", "brown", "green", "purple", "red", "angel", "crazy", "angelsupreme", "pink", "white", "yellow", "orange", "cyan", "clippy", "jabba", "jew", "dress", "troll", "glow", "noob", "gold", "rainbow"]; 
var ADMIN_ONLY_COLORS = ["pope", "megatron", "vitamin", "death", "king"];
const ALLOWED_HATS = [
    "mario", "glitch", "speed", "trash", "tv", "hacker", "soldier", "police",
    "demonmask", "shirt", "tinymario", "cap", "palestine", "hiimstickman", 
    "back", "kitty", "satan", "bull", "ballet", "scarf", "bear", "kfc", "bfdi", "bieber", 
    "bowtie", "bucket", "chain", "chef", "clippy", "cowboy", "elon", "evil", 
    "headphones", "northkorea", "horse", "kamala", "maga", "ninja", "obama", "cape",
    "pirate", "pot", "stare", "tophat", "troll", "windows", "witch", "wizard", "patrick", "squiddy", "3dglasses", "beard", 
    "mrkrabs", "gromit"
];

const BLESSED_HATS = [
    "premium", "scorp", "dank", "cake", "cigar", "gangster", "illuminati", "propeller", "gamer",
    "windows2", "windows3", "windows4", "windows5", "windows6", "windows7", "windows8", 
    "windows9", "windows10", "windows11", "illuminati2", "windows12", "mario2", "luigi", "megatron",
"soldier", "guard", "scorp", "king", "king2", "niko"
];

const MODERATOR_HATS = [
    "police"
];
var HATS_LOADED = false; 
var ALL_COLORS = COMMON_COLORS.concat(ADMIN_ONLY_COLORS);
var quote = null;
let lastUser = "";
// Shared AudioContext for all Bonzi instances
var sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
var sharedAnalyser = sharedAudioContext.createAnalyser();
var sharedGainNode = sharedAudioContext.createGain();

// Configure shared analyser
sharedAnalyser.fftSize = 256;
sharedAnalyser.smoothingTimeConstant = 0.3;
sharedAnalyser.minDecibels = -60;
sharedAnalyser.maxDecibels = -10;

// Connect shared nodes
sharedGainNode.connect(sharedAnalyser);
sharedAnalyser.connect(sharedAudioContext.destination);
var currentUserGuid = "";
function max(array) {
    var max = array[0];
    var len = array.length;
    for (var i = 0; i < len; ++i) {
        if (array[i] > max) {
            max = array[i];
        }
    }
    return max;
}
function showSettingsWindow() {
    const existing = document.getElementById("settings_window");
    if (existing) existing.remove();

    const settingsWindow = document.createElement("div");
    settingsWindow.id = "settings_window";
    settingsWindow.className = "window";
    settingsWindow.style.cssText = "left: 236px; top: 408px; position: absolute; z-index: 10002; width: 600px; height: 400px;";
    
    settingsWindow.innerHTML = `
        <div class="window_header">
            Settings
            <div class="window_close" onclick="closeSettings()"></div>
        </div>
        <div class="window_body">
            <div class="blessed_body">
                <h3>Appearance Settings</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <input type="checkbox" id="classic_bg" onchange="toggleClassicBackground()">
                        Enable Classic Background
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="vaporwave_theme" onchange="toggleVaporwaveTheme()">
                        Enable Vaporwave Theme
                    </label>
                </div>
                
                <h3>Character Customization</h3>
                <div class="roulette">
                    <div class="card" onclick="showColorSelection()" style="background: #7c41c9; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        Change Color
                    </div>
                    <div class="card" onclick="showHatSelection()" style="background: #7c41c9; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        Change Hats
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(settingsWindow);
    makeWindowDraggable(settingsWindow);
}

function closeSettings() {
    const settingsWindow = document.getElementById("settings_window");
    if (settingsWindow) settingsWindow.remove();
}

function toggleClassicBackground() {
    const classicBg = document.getElementById('classic_bg').checked;
    const content = document.getElementById('content');
    
    if (classicBg) {
        content.style.backgroundColor = '#6B339E';
        document.body.classList.remove('vaporwave');
        document.getElementById('vaporwave_theme').checked = false;
    } else {
        content.style.backgroundColor = '';
    }
}

function toggleVaporwaveTheme() {
    const vaporwaveTheme = document.getElementById('vaporwave_theme').checked;
    
    if (vaporwaveTheme) {
        document.body.classList.add('vaporwave');
        document.getElementById('classic_bg').checked = false;
        document.getElementById('content').style.backgroundColor = '';
    } else {
        document.body.classList.remove('vaporwave');
    }
}

function showColorSelection() {
    const existing = document.getElementById("color_selection_window");
    if (existing) existing.remove();

    const colorWindow = document.createElement("div");
    colorWindow.id = "color_selection_window";
    colorWindow.className = "window";
    colorWindow.style.cssText = "left: 236px; top: 408px; position: absolute; z-index: 10002; width: 600px; height: 400px;";
    
    let colorGrid = '';
    COMMON_COLORS.forEach(color => {
        colorGrid += `
            <div class="color-option" onclick="selectColor('${color}')" 
                 style="display: inline-block; margin: 5px; text-align: center; cursor: pointer;">
                <img src="./img/pfp/${color}.png" width="50" height="50" 
                     style="border: 1px solid #000000ff;" 
                     onerror="this.style.display='none'">
                <div style="font-size: 12px; margin-top: 5px;">${capitalizeFirst(color)}</div>
            </div>
        `;
    });

    colorWindow.innerHTML = `
        <div class="window_header">
            Change Color
            <div class="window_close" onclick="closeColorSelection()"></div>
        </div>
        <div class="window_body">
            <div class="blessed_body">
                <h3>Select a Color</h3>
                <p>Click on a color to apply it to your character:</p>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px;">
                    ${colorGrid}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(colorWindow);
    makeWindowDraggable(colorWindow);
}


function closeColorSelection() {
    const colorWindow = document.getElementById("color_selection_window");
    if (colorWindow) colorWindow.remove();
}

function selectColor(color) {
    socket.emit('command', { list: ['color', color] });
    closeColorSelection();
}

function showHatSelection() {
    const existing = document.getElementById("hat_selection_window");
    if (existing) existing.remove();

    const hatWindow = document.createElement("div");
    hatWindow.id = "hat_selection_window";
    hatWindow.className = "window";
    hatWindow.style.cssText = "left: 236px; top: 408px; position: absolute; z-index: 10002; width: 600px; height: 400px;";
    
    let hatGrid = '';
    const allHats = [...ALLOWED_HATS];
    
    allHats.forEach(hat => {
        hatGrid += `
            <div class="cardhat" onclick="selectHat('${hat}')" style="background-image: url('./img/hats/${hat}.webp');">
            </div>
        `;
    });

    hatWindow.innerHTML = `
        <div class="window_header">
            Change Hats
            <div class="window_close" onclick="closeHatSelection()"></div>
        </div>
        <div class="window_body">
            <div class="blessed_body">
                <h3>Select Hats</h3>
                <div class="roulette">
                    ${hatGrid}
                </div>
                <button onclick="clearHats()" style="margin-top: 10px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Clear All Hats
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(hatWindow);
    makeWindowDraggable(hatWindow);
}

function closeHatSelection() {
    const hatWindow = document.getElementById("hat_selection_window");
    if (hatWindow) hatWindow.remove();
}

function selectHat(hat) {
    socket.emit('command', { list: ['hat', hat] });
}

function clearHats() {
    socket.emit('command', { list: ['hat'] });
}
function showUserInfoWindow(data) {
    const existing = document.getElementById("userinfo_window");
    if (existing) existing.remove();

    const infoWindow = document.createElement("div");
    infoWindow.id = "userinfo_window";
    infoWindow.className = "window";
    infoWindow.style.cssText = "left: 300px; top: 200px; position: absolute; z-index: 10003; width: 500px; height: 400px; background: white; border: 2px solid #7c41c9;";
    
    infoWindow.innerHTML = `
        <div class="window_header" style="background: #7c41c9; color: white; padding: 8px 12px; font-family: Tahoma, Arial; font-weight: bold; cursor: move;">
            User Information - ${data.userPublic.name}
            <div class="window_close" onclick="closeUserInfo()" style="float: right; cursor: pointer; font-weight: bold;">X</div>
        </div>
        <div class="window_body" style="padding: 15px; font-family: Tahoma, Arial; color: #222; height: calc(100% - 40px); overflow-y: auto;">
            <div class="user-info-content">
                <h3 style="color: #7c41c9; margin-top: 0;">Basic Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Username:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.userPublic.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">GUID:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">${data.targetGuid}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Color:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">
                            <span style="color: ${data.userPublic.color};">${data.userPublic.color}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Role:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">
                            ${data.userPublic.admin ? '👑 Admin' : data.userPublic.moderator ? '🛡️ Moderator' : data.userPublic.blessed ? '🌟 Blessed' : '👤 User'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Coins:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.userPublic.coins || 0} B-Coins</td>
                    </tr>
                </table>
                
                <h3 style="color: #7c41c9; margin-top: 20px;">Network Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">IP Address:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-family: monospace;">${data.ip || 'Unknown'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Connections:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.connections} active connection(s)</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Room:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.room}</td>
                    </tr>
                </table>
                
                <h3 style="color: #7c41c9; margin-top: 20px;">User Stats</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Voice Speed:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.userPublic.speed || 175}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Voice Pitch:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.userPublic.pitch || 50}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Hats:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">
                            ${data.userPublic.hat && data.userPublic.hat.length > 0 ? 
                                data.userPublic.hat.map(hat => `<span class="hat-tag">${hat}</span>`).join(', ') : 
                                'None'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Tag:</td>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">${data.userPublic.tag || 'None'}</td>
                    </tr>
                </table>
                
                ${data.userPublic.admin ? `
                <div style="margin-top: 20px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <strong>⚠️ Admin Note:</strong> This user has administrator privileges.
                </div>
                ` : ''}
                
                ${data.connections > 1 ? `
                <div style="margin-top: 20px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                    <strong>⚠️ Multiple Connections:</strong> This IP has ${data.connections} active connections.
                </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(infoWindow);
    
    // Add some basic CSS for the elements
    const style = document.createElement('style');
    style.textContent = `
        .hat-tag {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            margin: 2px;
            display: inline-block;
        }
        .window_close:hover {
            background: #5a2d9c;
        }
    `;
    document.head.appendChild(style);
    
    makeWindowDraggable(infoWindow);
}

// Add close function
function closeUserInfo() {
    const infoWindow = document.getElementById("userinfo_window");
    if (infoWindow) infoWindow.remove();
}
function parseMarkdown(text) {
    // First escape HTML to prevent XSS
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");

    // Process rainbow syntax first - handle both single and double pair
    // Single pair: $r$text (everything after becomes rainbow)
    text = text.replace(/\$r\$(.*?)(?=\$r\$|$)/g, function(match, content) {
        return "<gay-rainbow>" + content + "</gay-rainbow>";
    });
    
    // Double pair: $r$text$r$ (only text between markers)
    text = text.replace(/\$r\$(.*?)\$r\$/g, "<gay-rainbow>$1</gay-rainbow>");

    // Process other markdown formatting
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
               .replace(/~~(.*?)~~/g, "<em>$1</em>")
               .replace(/__(.*?)__/g, "<u>$1</u>")
               .replace(/--(.*?)--/g, "<del>$1</del>")
               .replace(/\^\^(.*?)\^\^/g, "<gay-big>$1</gay-big>")
               .replace(/\|\|(.*?)\|\|/g, "<gay-spoiler onclick=\"this.classList.add('reveal')\">$1</gay-spoiler>")
               .replace(/``(.*?)``/g, "<gay-code>$1</gay-code>");

    return text;
}
function addMarkdownStyles() {
    // Check if styles are already added
    if (document.getElementById('markdown-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'markdown-styles';
    style.textContent = `
        /* Add all the fixed CSS from above here */
        gay-big {
            font-size: 1.5em;
            font-weight: bold;
            display: inline;
        }

        gay-spoiler {
            background-color: #2f4f4f;
            border-radius: 3px;
            color: transparent;
            user-select: none;
            transition: background-color 0.2s, color 0.2s;
            cursor: pointer;
            padding: 1px 4px;
            margin: 0 1px;
            display: inline;
        }

        gay-spoiler:hover {
            background-color: #556666;
        }

        gay-spoiler.reveal {
            background-color: rgba(85, 85, 85, 0.3);
            color: inherit;
            user-select: text;
            cursor: text;
        }

        gay-rainbow {
            background: linear-gradient(90deg, 
                #ff0000, #ff8000, #ffff00, #80ff00, 
                #00ff00, #00ff80, #00ffff, #0080ff, 
                #0000ff, #8000ff, #ff00ff, #ff0080,
                #ff0000);
            background-size: 1200% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            animation: rainbow-move 3s linear infinite;
            font-weight: bold;
            display: inline;
        }

        gay-code {
            border: 1px solid #999;
            background-color: #f0f0f0;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            padding: 1px 4px;
            margin: 0 1px;
            display: inline;
        }

        @keyframes rainbow-move {
            0% {
                background-position: 0% 50%;
            }
            100% {
                background-position: 100% 50%;
            }
        }

        /* Ensure markdown works in chat bubbles and chat log */
        .bubble-content gay-big,
        .bubble-content gay-spoiler, 
        .bubble-content gay-rainbow,
        .bubble-content gay-code,
        .log_message_text gay-big,
        .log_message_text gay-spoiler,
        .log_message_text gay-rainbow,
        .log_message_text gay-code {
            display: inline !important;
        }
    `;
    document.head.appendChild(style);
    console.log("Markdown styles loaded");
}

// wowzar got blessed got blessed
function showBlessmode2Window(data) {
    const existing = document.getElementById("blessmode2_window");
    if (existing) existing.remove();

    const blessWindow = document.createElement("div");
    blessWindow.id = "blessmode2_window";
    blessWindow.className = "window2"; // New class for rank 2 styling
    blessWindow.style.cssText = "left: 236px; top: 408px; position: absolute; z-index: 10002; width: 600px; height: 400px;";
    
    blessWindow.innerHTML = `
        <div class="window_header2">
            Rank 2 Blessmode ${data.blessedBy ? ' - Blessed by ' + data.blessedBy : ''}
            <div class="window_close2" onclick="closeBlessmode2()"></div>
        </div>
        <div class="window_body2">
            <div class="blessed_body">
                <h1><marquee>YOU'VE BEEN BLESSED WITH RANK 2!</marquee></h1>
                Rank 2 Blessed is an upgraded VIP status.<br>
                You now have access to:<br>
                <ul>
                    <li><b>Skins:</b> 4 exclusive pope skins</li>
                    <li><b>Hats:</b> 4 special rank 2 hats</li>
                </ul>
                
                <h3>Skins</h3>
                <div class="roulette">
                    <div class="card angelsupreme" onclick="applyBlessedSkin('angelsupreme')"></div>
                    <div class="card megatrons" onclick="applyBlessedSkin('megatron')"></div>
                    <div class="card crazy" onclick="applyBlessedSkin('crazy')"></div>
                    <div class="card angel" onclick="applyBlessedSkin('angel')"></div>
                    <div class="card glow" onclick="applyBlessedSkin('glow')"></div>
                    <div class="card noob" onclick="applyBlessedSkin('noob')"></div>
                    <div class="card gold" onclick="applyBlessedSkin('gold')"></div>
                </div>
                
                <h3>Hats</h3>
                <div class="roulette">
                    <div class="cardhat windows10" onclick="applyBlessedHat('windows10')"></div>
                    <div class="cardhat mario2" onclick="applyBlessedHat('mario2')"></div>
                    <div class="cardhat illuminati2" onclick="applyBlessedHat('illuminati2')"></div>
                    <div class="cardhat king2" onclick="applyBlessedHat('king2')"></div>
                    <div class="cardhat windows2" onclick="applyBlessedHat('windows2')"></div>
                    <div class="cardhat premium" onclick="applyBlessedHat('premium')"></div>
                    <div class="cardhat gamer" onclick="applyBlessedHat('gamer')"></div>
                    <div class="cardhat megatron" onclick="applyBlessedHat('megatron')"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(blessWindow);
    makeWindowDraggable(blessWindow);
}

// Add close function for rank 2 window
function closeBlessmode2() {
    const blessWindow = document.getElementById("blessmode2_window");
    if (blessWindow) blessWindow.remove();
}
function showBlessmodeWindow(data) {
    const existing = document.getElementById("blessmode_window");
    if (existing) existing.remove();

    const blessWindow = document.createElement("div");
    blessWindow.id = "blessmode_window";
    blessWindow.className = "window";
    blessWindow.style.cssText = "left: 236px; top: 408px; position: absolute; z-index: 10002; width: 600px; height: 400px;";
    
    blessWindow.innerHTML = `
        <div class="window_header">
            Blessmode ${data.blessedBy ? ' - Blessed by ' + data.blessedBy : ''}
            <div class="window_close" onclick="closeBlessmode()"></div>
        </div>
        <div class="window_body">
            <div class="blessed_body">
                <h1><marquee>YOU'VE BEEN BLESSED!</marquee></h1>
                Blessed is a VIP-like status given to users who I like.<br>
                You now have access to:<br>
                <ul>
                    <li><b>Skins:</b> 4 custom skins</li>
                    <li><b>Hats:</b> 4 extra hats</li>
                </ul>
                
                <h3>Skins</h3>
                <div class="roulette">
                    <div class="card angel" onclick="applyBlessedSkin('angel')"></div>
                    <div class="card glow" onclick="applyBlessedSkin('glow')"></div>
                    <div class="card noob" onclick="applyBlessedSkin('noob')"></div>
                    <div class="card gold" onclick="applyBlessedSkin('gold')"></div>
                </div>
                
                <h3>Hats</h3>
                <div class="roulette">
                    <div class="cardhat windows2" onclick="applyBlessedHat('windows2')"></div>
                    <div class="cardhat premium" onclick="applyBlessedHat('premium')"></div>
                    <div class="cardhat gamer" onclick="applyBlessedHat('gamer')"></div>
                    <div class="cardhat megatron" onclick="applyBlessedHat('megatron')"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(blessWindow);
    
    makeWindowDraggable(blessWindow);
}

// helper functions
function closeBlessmode() {
    const blessWindow = document.getElementById("blessmode_window");
    if (blessWindow) blessWindow.remove();
}

function applyBlessedSkin(skin) {
    socket.emit('command', { list: [skin] });
}

function applyBlessedHat(hat) {
    socket.emit('command', { list: ['hat', hat] });
}

// Use existing draggable function or create simple one
function makeWindowDraggable(element) {
    const header = element.querySelector('.window_header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(element.style.left) || 236;
        initialY = parseInt(element.style.top) || 408;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = (initialX + dx) + 'px';
        element.style.top = (initialY + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

function updateCoinDisplay(coins) {
    let coinDisplay = document.getElementById('currency_display');
    let currencyAmount = document.getElementById('currency_amount');
    
    if (!coinDisplay) {
        // Create the display if it doesn't exist
        coinDisplay = document.createElement('div');
        coinDisplay.id = 'currency_display';
        coinDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            font-family: Tahoma, Arial;
            font-size: 14px;
            font-weight: bold;
            z-index: 999;
            display: flex;
            align-items: center;
        `;
        
        coinDisplay.innerHTML = `
            <img src="./img/coin.gif" style="height: 30px; margin-right: 8px;">
            <span id="currency_amount" style="font-size: 24px;">0</span>
            <span style="font-size: 18px; margin-left: 5px;">B-Coins</span>
        `;
        document.body.appendChild(coinDisplay);
        currencyAmount = document.getElementById('currency_amount');
    }
    
    if (currencyAmount) {
        currencyAmount.textContent = coins.toLocaleString();
    }
}

function showCoinNotification(data) {
    if (data.error) {
        showCoinError(data.error);
        return;
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1001;
        font-family: Tahoma, Arial;
        font-size: 14px;
        font-weight: bold;
        border: 2px solid ${data.amount >= 0 ? '#00ff00' : '#ff0000'};
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    let message = '';
    if (data.gifted) {
        message = `🎁 You gifted ${Math.abs(data.amount)} coins to ${data.to}`;
    } else if (data.from) {
        message = `🎁 Received ${data.amount} coins from ${data.from}`;
    } else if (data.reason) {
        message = `💰 ${data.reason}: +${data.amount} coins`;
    } else {
        message = `${data.amount >= 0 ? '📈 Gained' : '📉 Lost'} ${Math.abs(data.amount)} coins`;
    }
    
    notification.innerHTML = `
        <div>${message}</div>
        <div style="margin-top: 5px; color: gold;">Total: ${data.total.toLocaleString()} coins</div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate and remove
    setTimeout(() => {
        notification.style.transition = 'all 0.5s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

function showCoinError(message) {
    const error = document.createElement('div');
    error.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: rgba(255,0,0,0.9);
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1001;
        font-family: Tahoma, Arial;
        font-size: 14px;
        font-weight: bold;
        border: 2px solid #ff0000;
        max-width: 300px;
    `;
    error.textContent = message;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
        error.style.transition = 'all 0.5s ease';
        error.style.opacity = '0';
        setTimeout(() => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        }, 500);
    }, 3000);
}
function time() {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let hourString = String(hours % 12).padStart(2, "0");
    let minuteString = String(minutes).padStart(2, "0");
    let ampm = hours >= 12 ? "PM" : "AM";
    return `${hourString}:${minuteString} ${ampm}`;
}

function bonzilog(id, name, html, color, text, single, msgid) {
    let chat_log_content = document.getElementById("chat_log_content");
    if (!chat_log_content) return;

    let icon = "";
    let scrolled = chat_log_content.scrollHeight - chat_log_content.clientHeight - chat_log_content.scrollTop <= 20;
    
    if (color) {
        icon = `<div class="log_icon">
            <img src="./img/pfp/${color}.png">
        </div>`;
    } else {
        icon = `<div class="log_left_spacing"></div>`;
    }

    let thisUser = `${id};${name};${color}`;
    let showDelete = (admin) && msgid;
    let timeString = `<span class="log_time">${time()}</span>`;
    
    // Parse markdown in the message
    let formattedHtml = parseMarkdown(html);
    
    if (thisUser !== lastUser || single) {
        chat_log_content.insertAdjacentHTML("beforeend", `
            <hr>
            <div class="log_message" ${msgid ? `id="msg_${msgid}"` : ""}>
                ${icon}
                <div class="log_message_cont">
                    <b>${name}</b> ${timeString}
                    <div class="log_message_text">${formattedHtml}</div>
                </div>
                <div class="reply" onclick="socket.emit('talk',{text:'@${name} '})"></div>
                ${showDelete ? '<div class="delete" onclick="socket.emit(\'delete\',{msgid:\'' + msgid + '\'})"></div>' : ''}
            </div>`);
        lastUser = single ? "" : thisUser;
    } else {
        chat_log_content.insertAdjacentHTML("beforeend", `
            <div class="log_message log_continue" ${msgid ? `id="msg_${msgid}"` : ""}>
                <div class="log_left_spacing"></div>
                <div class="log_message_cont">
                    <div class="log_message_text">${formattedHtml}</div>
                </div>
                ${showDelete ? '<div class="delete" onclick="socket.emit(\'delete\',{msgid:\'' + msgid + '\'})"></div>' : ''}
            </div>`);
    }

    if (scrolled) {
        chat_log_content.scrollTop = chat_log_content.scrollHeight;
    }
}
function capitalizeFirst(a){return a && a.length ? a.charAt(0).toUpperCase()+a.slice(1) : a;}
function loadHat(hatName, callback) {
    if (loadDone.includes("hat_" + hatName)) {
        callback && callback();
        return;
    }
    var fileLoadHandler = function(e) {
        if (e.item.id === "hat_" + hatName) {
            loadDone.push("hat_" + hatName);
            loadQueue.off("fileload", fileLoadHandler);
            callback && callback();
        }
    };
    loadQueue.on("fileload", fileLoadHandler);
    loadQueue.loadManifest([{ id: "hat_" + hatName, src: "./img/hats/" + hatName + ".webp" }]);
}
// Simple announcement modal creator
function showAnnouncementModal(data){
    var existing = document.getElementById("announcement_modal");
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement("div");
    overlay.id = "announcement_modal";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    // Transparent background to remove dim effect
    overlay.style.background = "transparent";
    overlay.style.zIndex = 99999;

    var modal = document.createElement("div");
    modal.style.position = "fixed";
    // Start centered
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.minWidth = "360px";
    modal.style.maxWidth = "80%";
    modal.style.background = "#fff";
    modal.style.border = "2px solid #a06bd6";
    modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";

    var header = document.createElement("div");
    header.style.background = "#7c41c9";
    header.style.color = "#fff";
    header.style.padding = "8px 12px";
    header.style.fontFamily = "Tahoma, Arial, sans-serif";
    header.style.fontWeight = "bold";
    header.style.cursor = "move";
    header.textContent = "Announcement" + (data && data.from ? " from " + data.from : "");

    var body = document.createElement("div");
    body.style.padding = "16px";
    body.style.fontFamily = "Tahoma, Arial, sans-serif";
    body.style.color = "#222";
    body.innerHTML = (data && data.html) ? data.html : "";

    var footer = document.createElement("div");
    footer.style.textAlign = "center";
    footer.style.padding = "12px";

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.padding = "6px 12px";
    closeBtn.onclick = function(){ document.body.removeChild(overlay); };

    footer.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Draggable behavior (drag by header)
    (function(){
        var dragging = false;
        var startX = 0, startY = 0, initialX = 0, initialY = 0;

        function pxToNum(v){ return Number((v||"0").toString().replace("px","")) || 0; }

        header.addEventListener("mousedown", function(e){
            dragging = true;
            // Reset transform so left/top are accurate for dragging
            var rect = modal.getBoundingClientRect();
            modal.style.transform = "";
            startLeft = rect.left;
            startTop = rect.top;
            startX = e.clientX;
            startY = e.clientY;
            e.preventDefault();
        });

        function onMove(e){
            if (!dragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            var newLeft = startLeft + dx;
            var newTop = startTop + dy;
            // Constrain within viewport
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var rect = modal.getBoundingClientRect();
            var width = rect.width; var height = rect.height;
            newLeft = Math.max(0, Math.min(vw - width, newLeft));
            newTop = Math.max(0, Math.min(vh - height, newTop));
            modal.style.left = newLeft + "px";
            modal.style.top = newTop + "px";
        }

        function onUp(){ dragging = false; }

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);

        // Clean up on close
        closeBtn.addEventListener("click", function(){
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        });
    })();
}
function updateAds() {
    var a = $(window).height() - $(adElement).height(),
        b = a <= 250;
    b && (a = $(window).height()), $(adElement)[b ? "hide" : "show"](), $("#content").height(a);
}
function _classCallCheck(a, b) {
    if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function");
}
function range(a, b) {
    for (var c = [], d = a; d <= b; d++) c.push(d);
    for (var d = a; d >= b; d--) c.push(d);
    return c;
}
function replaceAll(a, b, c) {
    return a.replace(new RegExp(b, "g"), c);
}
function s4() {
    return Math.floor(65536 * (1 + Math.random()))
        .toString(16)
        .substring(1);
}
function youtubeParser(a) {
    var b = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
        c = a.match(b);
    return !(!c || 11 != c[7].length) && c[7];
}
function rtimeOut(a, b) {
    var c,
        d = Date.now,
        e = window.requestAnimationFrame,
        f = d(),
        g = function () {
            d() - f < b ? c || e(g) : a();
        };
    return (
        e(g),
        {
            clear: function () {
                c = 1;
            },
        }
    );
}
function rInterval(a, b) {
    var c,
        d = Date.now,
        e = window.requestAnimationFrame,
        f = d(),
        g = function () {
            d() - f < b || ((f += b), a()), c || e(g);
        };
    return (
        e(g),
        {
            clear: function () {
                c = 1;
            },
        }
    );
}
function linkify(a) {
    var b = /(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/gi;
    return a.replace(b, "<a href='$1' target='_blank'>$1</a>");
}
function loadBonzis(a) {
    // Load both Bonzi and Peedy assets for all colors
    var manifest = [];
    
    // Load Bonzi figures
    ALL_COLORS.forEach(function(c){ 
        manifest.push({ id: "bonzi_" + c, src: "./img/bonzi/" + c + ".webp" });
    });
    
    // Load Peedy figures  
    ALL_COLORS.forEach(function(c){ 
        manifest.push({ id: "peedy_" + c, src: "./img/peedy/" + c + ".webp" });
    });
    
    manifest.push({ id: "topjej", src: "./img/misc/topjej.png" });
    
    loadQueue.loadManifest(manifest),
    loadQueue.on(
        "fileload",
        function (a) {
            loadDone.push(a.item.id);
        },
        this
    ),
    a && loadQueue.on("complete", a, this);
}
function loadTest() {
    $("#login_card").hide(),
        $("#login_error").hide(),
        $("#login_load").show(),
        (window.loadTestInterval = rInterval(function () {
            try {
                if (!loadDone.equals(loadNeeded)) throw "Not done loading.";
                login(), loadTestInterval.clear();
            } catch (a) {}
        }, 100));
}
function login() {
    
        if (localStorage.banned == "true") {
            const pastDate = new Date(localStorage.bannedDate);
            const currentDate = new Date();
            if (pastDate > currentDate) {
                if ($("#login_room").val() != " ") {

                    $("#page_ban").show(), 
                    $("#ban_reason").html(localStorage.bannedReason), 
                    $("#ban_end").html(pastDate.toString()),
                    $("#ban_by").html("System"),
                    $("#ban_date").html(new Date(a.bannedAt).toString());
                    return;

                }
            } else {
                socket.emit("unban");
            }
        }
   socket.emit("login", {passcode:passcode, name: $("#login_name").val(), room: $("#login_room").val() }), setup();
}
function errorFatal() {
    ("none" != $("#page_ban").css("display") && "none" != $("#page_kick").css("display")) || $("#page_error").show();
}
function setup() {
    document.getElementById("chat_log_button").onclick = function() {
    document.getElementById("chat_log_button").classList.add("hidden");
    document.getElementById("chat_log").classList.remove("hidden");
};

document.getElementById("chat_log_close").onclick = function() {
    document.getElementById("chat_log_button").classList.remove("hidden");
    document.getElementById("chat_log").classList.add("hidden"); 
};
    $("#chat_send").click(sendInput),
        $("#chat_message").keypress(function (a) {
            13 == a.which && sendInput();
        }),
        socket.on("room", function (a) {
            $("#room_owner")[a.isOwner ? "show" : "hide"](), $("#room_public")[a.isPublic ? "show" : "hide"](), $("#room_private")[a.isPublic ? "hide" : "show"](), $(".room_id").text(a.room);
        }),
        socket.on("coinDisplay", function(data) {
    if (data && data.coins !== undefined) {
        updateCoinDisplay(Number(data.coins));
    }
});
socket.on("userInfo", function(data) {
    showUserInfoWindow(data);
});
socket.on("coinNotification", function(data) {
    showCoinNotification(data);
});
    socket.on("rainbow", function (data) {
    var b = bonzis[data.guid];
    if (!b) return;
    
    // Toggle rainbow effect
    b.rainbow();
});
socket.on("updateAll", function (a) {
    $("#page_login").hide(), 
    (usersPublic = a.usersPublic), 
    usersUpdate(), 
    BonziHandler.bonzisCheck();
    for (var guid in usersPublic) {
        currentUserGuid = guid;
        break;
    }
});
socket.on("update", function(a) {
    (window.usersPublic[a.guid] = a.userPublic), 
    usersUpdate(), 
    BonziHandler.bonzisCheck();
    
    // Update coin display if it's the current user
    if (a.guid === currentUserGuid && a.userPublic.coins !== undefined) {
        updateCoinDisplay(a.userPublic.coins);
    }
    
    // Update hat if it exists
    if (bonzis[a.guid] && a.userPublic.hat) {
        bonzis[a.guid].updateHat(a.userPublic.hat);
    }
});
socket.on("talk", function(data) {
    var b = bonzis[data.guid];
    b.cancel();
    b.runSingleEvent([{ type: "text", text: data.text }]);
    
    // Use the original text for logging (markdown will be parsed in bonzilog)
    bonzilog(
        data.guid, 
        usersPublic[data.guid].name,
        data.text,  // This will be parsed by parseMarkdown in bonzilog
        usersPublic[data.guid].color,
        data.text,
        false,
        data.msgid || null
    );
});
socket.on("shop", function(data) {
    var b = bonzis[data.guid];
    if (b && data.guid === currentUserGuid) { // Only show to the user who requested it
        b.debugShop();
    }
});
socket.on("tv", function(data) {
    if (data.enabled) {
        // Create TV background
        const tvOverlay = document.createElement('div');
        tvOverlay.id = 'tv_mode';
        tvOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: -1;
            pointer-events: none;
        `;
        document.body.appendChild(tvOverlay);
        
        // Add some TV-like scan lines effect
        tvOverlay.style.background = `
            repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.1) 0px,
                rgba(0, 0, 0, 0.1) 1px,
                transparent 1px,
                transparent 2px
            ),
            #000
        `;
        
        // Optional: Add a subtle noise texture
        tvOverlay.style.backgroundImage = `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")
        `;
        
    } else {
        // Remove TV background
        const tvOverlay = document.getElementById('tv_mode');
        if (tvOverlay) {
            tvOverlay.remove();
        }
    }
});
    socket.on("sanitize", function(data) {
    window.sanitizeMode = data.enabled;
});
socket.on("event", function(data) {
    var b = bonzis[data.guid];
    if (b && data.guid === currentUserGuid) { // Only show to the user who requested it
        b.debugEvent();
    }
});
socket.on("loginSuccess", function(data) {
    currentUserGuid = data.guid;
    // Initialize coin display
    if (data.userPublic && data.userPublic.coins !== undefined) {
        updateCoinDisplay(data.userPublic.coins);
    }
});
socket.on('blessmode', function(data) {
    if (data.show) {
        showBlessmodeWindow(data);
    } else {
        closeBlessmode();
    }
});
socket.on('blessmode2', function(data) {
    if (data.show) {
        showBlessmode2Window(data);
    } else {
        closeBlessmode2();
    }
});
socket.on("settings", function(data) {
    if (data.show) {
        showSettingsWindow();
    }
});
        socket.on("joke", function (a) {
            var b = bonzis[a.guid];
            (b.rng = new Math.seedrandom(a.rng)), b.cancel(), b.joke();
        }),
        socket.on("youtube", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.youtube(a.vid);
        }),
    socket.on("rainbow", function (data) {
    var b = bonzis[data.guid];
    if (!b) return;
    
    // Toggle rainbow effect
    b.rainbow();
});
        socket.on("image", function(a){
            var b = bonzis[a.guid];
            if (!b) return;
            b.cancel();
            b.showImage(a.url);
        }),
        socket.on("video", function(a){
            var b = bonzis[a.guid];
            if (!b) return;
            b.cancel();
            b.showVideo(a.url);
        }),
        socket.on("fact", function (a) {
            var b = bonzis[a.guid];
            (b.rng = new Math.seedrandom(a.rng)), b.cancel(), b.fact();
        }),
        socket.on("backflip", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.backflip(a.swag);
        }),
        socket.on("asshole", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.asshole(a.target);
        }),
        socket.on("owo", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.owo(a.target);
        }),
        socket.on("triggered", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.runSingleEvent(b.data.event_list_triggered);
        }),
               socket.on("linux", function (a) {
            var b = bonzis[a.guid];
            b.cancel(), b.runSingleEvent(b.data.event_list_linux);
        }),
        socket.on("poll_start", function(a){
            var b = bonzis[a.guid];
            if (!b) return;
            b.cancel();
            b.showPoll(a.pollId, a.question, a.yes, a.no);
        });
        socket.on("poll_update", function(a){
            // update any bonzi displaying this poll
            for (var k in bonzis) {
                if (bonzis.hasOwnProperty(k)) {
                    var bz = bonzis[k];
                    if (bz && bz.activePoll && bz.activePoll.id === a.pollId) {
                        bz.updatePollCounts(a.yes, a.no);
                    }
                }
            }
        }),
        socket.on("admin", function (data) {
            window.isAdmin = data.admin;
            window.admin = data.admin;
        }),
        socket.on("moderator", function (data) {
    window.isModerator = data.moderator;
    window.moderator = data.moderator;
});
        socket.on("alert", function (data) {
            alert(data.text);
        }),
        socket.on("leave", function (a) {
            var b = bonzis[a.guid];
            "undefined" != typeof b &&
                b.exit(
                    function (a) {
                        this.deconstruct(), delete bonzis[a.guid], delete usersPublic[a.guid], usersUpdate();
                    }.bind(b, a)
                );
        });
        socket.on("announcement", function (data) {
            try { showAnnouncementModal(data); } catch(e) {}
        });
        socket.on("nuke", function (data) {
    var targetBonzi = bonzis[data.targetGuid];
    if (targetBonzi) {
        targetBonzi.explode();
    }
});
        socket.on('shush', function (data) {
    var b = bonzis[data.guid];
    if (!b) return;
    b.cancel();
    // Make them say just a dot
    b.runSingleEvent([{ type: "text", text: "." }]);
});

socket.on('sanitize', function(data) {
    var b = bonzis[data.guid];
    if (!b) return;
    b.cancel();
});

socket.on("refresh", function () {
    window.location.reload();
});
}
function usersUpdate() {
    (usersKeys = Object.keys(usersPublic)), (usersAmt = usersKeys.length);
}
function sendInput() {
    var a = $("#chat_message").val();
    if (($("#chat_message").val(""), a.length > 0)) {
        var b = youtubeParser(a);
        if (b) return void socket.emit("command", { list: ["youtube", b] });
        if ("/" == a.substring(1, 0)) {
            var c = a.substring(1).split(" ");
            if (c[0].toLowerCase() === "bye") {
                socket.emit("command", { list: ["bye"] });
            } else {
                socket.emit("command", { list: c });
            }
        } else socket.emit("talk", { text: a });
    }
}
function touchHandler(a) {
    var b = a.changedTouches,
        c = b[0],
        d = "";
    switch (a.type) {
        case "touchstart":
            d = "mousedown";
            break;
        case "touchmove":
            d = "mousemove";
            break;
        case "touchend":
            d = "mouseup";
            break;
        default:
            return;
    }
    var e = document.createEvent("MouseEvent");
    e.initMouseEvent(d, !0, !0, window, 1, c.screenX, c.screenY, c.clientX, c.clientY, !1, !1, !1, !1, 0, null), c.target.dispatchEvent(e);
}
var adElement = "#ap_iframe";
$(function () {
    $(window).load(updateAds), $(window).resize(updateAds), $("body").on("DOMNodeInserted", adElement, updateAds), $("body").on("DOMNodeRemoved", adElement, updateAds);
});
var _createClass = (function () {
        function a(a, b) {
            for (var c = 0; c < b.length; c++) {
                var d = b[c];
                (d.enumerable = d.enumerable || !1), (d.configurable = !0), "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            }
        }
        return function (b, c, d) {
            return c && a(b.prototype, c), d && a(b, d), b;
        };
    })(),
    Bonzi = (function () {
function a(b, c) {
    var d = this;
    _classCallCheck(this, a),
        (this.userPublic = c || { name: "BonziBUDDY", color: "purple", speed: 175, pitch: 50, voice: "en-us", figure: 'bonzi' }),
        (this.color = this.userPublic.color),
        (this.figure = this.userPublic.figure || 'bonzi'),
        this.colorPrev,
        (this.data = window.BonziData),
        (this.drag = !1),
        (this.dragged = !1),
        (this.eventQueue = []),
        (this.eventRun = !0),
        (this.event = null),
        (this.willCancel = !1),
        (this.run = !0),
        (this.mute = !1),
        (this.eventTypeToFunc = { anim: "updateAnim", html: "updateText", text: "updateText", idle: "updateIdle", add_random: "updateRandom" }),
        
        // ADD THIS LINE - Initialize source property
        (this.source = null),
        
        "undefined" == typeof b ? (this.id = s4() + s4()) : (this.id = b),
                (this.rng = new Math.seedrandom(this.seed || this.id || Math.random())),
                (this.selContainer = "#content"),
                (this.$container = $(this.selContainer)),
        this.$container.append(
            "\n\t\t\t<div id='bonzi_" +
                this.id +
                "' class='bonzi' style='position: relative;'>\n\t\t\t\t<div class='bonzi_name'></div>\n\t\t\t\t<div class='bonzi_placeholder'></div>\n\t\t\t\t<div style='display:none' class='bubble'>\n\t\t\t\t\t<p class='bubble-content'></p>\n\t\t\t\t</div>\n\t\t\t\t<div class='bonzi_hat' style='position: absolute; top: 0; left: 0; width: 200px; height: 160px; pointer-events: none; z-index: 2; display: none;'></div>\n\t\t\t</div>\n\t\t"
        );
        
        // Hat element reference
        this.selHat = "#bonzi_" + this.id + " > .bonzi_hat";
        this.$hat = $(this.selHat);
        
        // Load initial hat
        if (this.userPublic.hat && this.userPublic.hat.length > 0) {
            this.updateHat(this.userPublic.hat);
        }
                (this.selElement = "#bonzi_" + this.id),
                (this.selDialog = this.selElement + " > .bubble"),
                (this.selDialogCont = this.selElement + " > .bubble > p"),
                (this.selNametag = this.selElement + " > .bonzi_name"),
                (this.selCanvas = this.selElement + " > .bonzi_placeholder"),
                $(this.selCanvas).width(this.data.size.x).height(this.data.size.y),
                (this.$element = $(this.selElement)),
                (this.$canvas = $(this.selCanvas)),
                (this.$dialog = $(this.selDialog)),
                (this.$dialogCont = $(this.selDialogCont)),
                (this.$nametag = $(this.selNametag)),
this.source = null;
this.gainNode = null; 
this.freqData = null;
this.analyser = null;
                this.updateName(),
                $.data(this.$element[0], "parent", this),
                this.updateSprite(!0),
                (this.generate_event = function (a, b, c) {
                    var d = this;
                    a[b](function (a) {
                        d[c](a);
                    });
                }),
                this.generate_event(this.$canvas, "mousedown", "mousedown"),
                this.generate_event($(window), "mousemove", "mousemove"),
                this.generate_event($(window), "mouseup", "mouseup");
            var e = this.maxCoords();
            (this.x = e.x * this.rng()),
                (this.y = e.y * this.rng()),
                this.move(),
$.contextMenu({
    selector: this.selCanvas,
    build: function (a, b) {
        const isModerator = window.moderator || window.admin;
        const isAdmin = window.admin;
        
        var items = {
            cancel: {
                name: "Cancel",
                callback: function () {
                    d.cancel();
                }
            },
            mute: {
                name: function () {
                    return d.mute ? "Unmute" : "Mute";
                },
                callback: function () {
                    d.cancel();
                    d.mute = !d.mute;
                }
            },
            asshole: {
                name: "Call an Asshole",
                callback: function () {
                    socket.emit("command", { list: ["asshole", d.userPublic.name] });
                }
            },
            owo: {
                name: "Notice Bulge",
                callback: function () {
                    socket.emit("command", { list: ["owo", d.userPublic.name] });
                }
            },
            gift: {
                name: "Gift Coins",
                callback: function () {
                    var amount = prompt(`Enter amount to gift to ${d.userPublic.name}:`, "100");
                    if (amount !== null && amount.trim() !== '') {
                        socket.emit("command", { list: ["gift", d.userPublic.name, amount.trim()] });
                    }
                }
            }
        };

        // Coin Management section
        if (isModerator) {
            items.coinmanagement = {
                name: "Coin Management",
                items: {
                    givecoins: {
                        name: "Give Coins",
                        callback: function() {
                            var amount = prompt(`Give coins to ${d.userPublic.name} (amount):`, "1000");
                            if (amount !== null && amount.trim() !== '') {
                                socket.emit('command', { list: ["givecoins", d.userPublic.name, amount.trim()] });
                            }
                        }
                    },
                    setcoins: {
                        name: "Set Coins",
                        callback: function() {
                            var amount = prompt(`Set coins for ${d.userPublic.name} (exact amount):`, d.userPublic.coins || "500");
                            if (amount !== null && amount.trim() !== '') {
                                socket.emit('command', { list: ["setcoins", d.userPublic.name, amount.trim()] });
                            }
                        }
                    },
                    resetcoins: {
                        name: "Reset Coins",
                        callback: function() {
                            if (confirm(`Reset ${d.userPublic.name}'s coins to default (500)?`)) {
                                socket.emit('command', { list: ["setcoins", d.userPublic.name, "500"] });
                            }
                        }
                    },
                    takecoins: {
                        name: "Take Coins",
                        callback: function() {
                            var amount = prompt(`Take coins from ${d.userPublic.name} (amount):`, "100");
                            if (amount !== null && amount.trim() !== '') {
                                var currentCoins = d.userPublic.coins || 500;
                                var newAmount = Math.max(0, currentCoins - parseInt(amount));
                                socket.emit('command', { list: ["setcoins", d.userPublic.name, newAmount.toString()] });
                            }
                        }
                    }
                }
            };
        }

        // Fun (Mod) section
        if (isModerator) {
            items.funmod = {
                name: "Fun (Mod)",
                items: {
                    sanitize: {
                        name: "Sanitize Room",
                        callback: function() {
                            socket.emit('command', { list: ["sanitize"] });
                        }
                    },
                    bless: {
                        name: "Bless User",
                        callback: function () {
                            socket.emit('command', { list: ["bless", d.id] });
                        }
                    },
                    bless2: {
                        name: "Bless (Rank II)",
                        callback: function () {
                            socket.emit('command', { list: ["bless2", d.id] });
                        }
                    },
                    changename: {
                        name: "Change Name",
                        callback: function() {
                            var newName = prompt(`Enter new name for ${d.userPublic.name}:`, d.userPublic.name);
                            if (newName !== null && newName.trim() !== '') {
                                socket.emit('command', { list: ["changename", d.id, newName.trim()] });
                            }
                        }
                    },
                    changetag: {
                        name: "Change Tag",
                        callback: function() {
                            var currentTag = d.userPublic.tag || '';
                            var newTag = prompt(`Enter new tag for ${d.userPublic.name}:`, currentTag);
                            if (newTag !== null) {
                                socket.emit('command', { list: ["changetag", d.id, newTag] });
                            }
                        }
                    },
                    changecolor: {
                        name: "Change Color",
                        callback: function() {
                            var newColor = prompt(`Enter new color for ${d.userPublic.name}:`, d.userPublic.color);
                            if (newColor !== null && newColor.trim() !== '') {
                                socket.emit('command', { list: ["changecolor", d.id, newColor.trim()] });
                            }
                        }
                    },
                    moduser: {
                        name: "Make Moderator",
                        callback: function() {
                            if (confirm(`Make ${d.userPublic.name} a moderator?`)) {
                                socket.emit('command', { list: ["moduser", d.id] });
                            }
                        }
                    },
                    unmoduser: {
                        name: "Remove Moderator",
                        callback: function() {
                            if (confirm(`Remove moderator status from ${d.userPublic.name}?`)) {
                                socket.emit('command', { list: ["unmoduser", d.id] });
                            }
                        }
                    }
                }
            };
        }

        // Moderator Panel section
        if (isModerator) {
            items.moderator = {
                name: "Mod",
                items: {
                    kick: {
                        name: "Kick User",
                        callback: function () {
                            var reason = prompt("Enter kick reason:", "No reason provided");
                            if (reason !== null) {
                                socket.emit('command', { list: ["kick", d.id, reason] });
                            }
                        }
                    },
                    tempban: {
                        name: "Temp Ban (5min)",
                        callback: function () {
                            var reason = prompt("Enter ban reason:", "No reason provided");
                            if (reason !== null) {
                                socket.emit('command', { list: ["tempban", d.id, reason] });
                            }
                        }
                    }
                }
            };
        }

        // Admin-only section
        if (isAdmin) {
            items.admin = {
                name: "Nasr's Super Pope",
                items: {
                    userinfo: {
                        name: "User Info",
                        callback: function() {
                            socket.emit('command', { list: ["info", d.userPublic.name] });
                        }
                    },
                    admincolor: {
                        name: "Change Color (Pope)",
                        callback: function() {
                            var newColor = prompt(`Enter new color for ${d.userPublic.name}:`, d.userPublic.color);
                            if (newColor !== null && newColor.trim() !== '') {
                                socket.emit('command', { list: ["admincolor", d.id, newColor.trim()] });
                            }
                        }
                    },
                    ban: {
                        name: "Permanent Ban",
                        callback: function () {
                            var reason = prompt("Enter ban reason:", "No reason provided");
                            if (reason !== null) {
                                socket.emit('command', { list: ["ban", d.userPublic.name, reason] });
                            }
                        }
                    },
                    nuke: {
                        name: "Nuke User",
                        callback: function () {
                            socket.emit('command', { list: ["nuke", d.id] });
                        }
                    },
                    ultrabless: {
                        name: "Ultra Bless (Old)",
                        callback: function () {
                            socket.emit('command', { list: ["ultrabless", d.userPublic.name] });
                        }
                    }
                }
            };
        }

        return { items: items };
    },
    animation: { duration: 175, show: "fadeIn", hide: "fadeOut" }
});
                (this.needsUpdate = !1),
                this.runSingleEvent([{ type: "anim", anim: "surf_intro", ticks: 30 }]);

setTimeout(() => {
  new Audio("https://files.catbox.moe/uxdvuz.wav").play();
}, 1500);
        }
        return (
            _createClass(a, [
{
    key: "updateHat",
    value: function(hats) {
        var self = this;
        this.userPublic.hat = hats || [];
        
        // Clear previous hats
        this.$hat.empty();
        
        if (!hats || hats.length === 0) {
            this.$hat.hide();
            return;
        }
        
        // Load and display all hats (up to 3)
        var hatsLoaded = 0;
        
        hats.forEach(function(hat, index) {
            if (hatsLoaded >= 3) return;
            
            const hatName = hat.name;
            const hatColor = hat.color || 'default';
            let hatPath;
            
            // Determine hat image path based on color
            if (hatColor === 'default') {
                hatPath = `./img/hats/${hatName}.webp`;
            } else {
                hatPath = `./img/hats/${hatColor}/${hatName}.webp`;
            }
            
            // Create hat element
            var $hatImg = $('<div>')
                .css({
                    'position': 'absolute',
                    'width': '100%',
                    'height': '100%',
                    'background-image': `url(${hatPath})`,
                    'background-size': 'contain',
                    'background-repeat': 'no-repeat',
                    'background-position': 'center',
                    'z-index': index + 1
                });
            
            self.$hat.append($hatImg);
            hatsLoaded++;
        });
        
        // Show the hat container if any hats were loaded
        if (hatsLoaded > 0) {
            this.$hat.show();
        }
    }
},
{
    key: "debugShop",
    value: function() {
        if (!this.debugShopWindow) {
            var self = this;
            this.$element.append(
                '<div id="debug_shop_' + this.id + '" class="debug-window" style="position:absolute;z-index:1000;display:none;user-select:none;-webkit-user-select:none;">' +
                '<div style="position:absolute;top:7px;right:7px;width:21px;height:21px;cursor:pointer;z-index:1001;" class="close-button">' +
                '<img src="./img/desktop/close.shop.png" style="width:21px;height:21px;">' +
                '</div>' +
                '<img src="./img/desktop/window.shop.png" style="display:block;pointer-events:none;">' +
                '<div class="debug-content" style="position:absolute;top:50px;left:20px;color:yellow;font-family:Arial;pointer-events:none;">' +
                '<marquee><span style="font-size: 42px; color: orange; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">WELCOME TO THE SHOP!!! AWESOME SKINS AND HATS!!!</span></marquee>' +
                '<br><br><br>' +
                '<span style="font-size: 24px; color: orange; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">ON SALE:</span>' +
                '<br>' +
                '<span style="font-size: 24px; color: orange; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">All the goodness are not available... yet.</span>' +
                '</div>' +
                '</div>'
            );

            this.debugShopWindow = $("#debug_shop_" + this.id);
            this.debugShopWindow.find('.close-button').click(function() {
                self.debugShopWindow.hide();
            });

            // Dragging functionality
            var isDragging = false;
            var startX, startY, initialX, initialY;
            
            this.debugShopWindow.on('mousedown', function(e) {
                var y = e.offsetY;
                if (y <= 33) {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    initialX = parseInt(self.debugShopWindow.css('left'), 10) || 0;
                    initialY = parseInt(self.debugShopWindow.css('top'), 10) || 0;
                    e.preventDefault();
                }
            });

            $(document).on('mousemove', function(e) {
                if (isDragging) {
                    var dx = e.clientX - startX;
                    var dy = e.clientY - startY;
                    self.debugShopWindow.css({
                        left: (initialX + dx) + 'px',
                        top: (initialY + dy) + 'px'
                    });
                }
            });

            $(document).on('mouseup', function() {
                isDragging = false;
            });

            // Position window
            var maxCoords = this.maxCoords();
            this.debugShopWindow.css({
                left: (maxCoords.x / 2 - 200) + 'px',
                top: (maxCoords.y / 2 - 150) + 'px'
            });
        }

        // Toggle visibility
        if (this.debugShopWindow.is(":visible")) {
            this.debugShopWindow.hide();
        } else {
            this.debugShopWindow.show();
        }
    }
},
{
    key: "rainbow",
    value: function() {
        // If rainbow effect is active, remove it
        if (this.rainbowInterval) {
            clearInterval(this.rainbowInterval);
            this.rainbowInterval = null;
            
            // Remove CSS filters
            if (this.$canvas && this.$canvas.length > 0) {
                this.$canvas.css('filter', '');
                this.$canvas.css('-webkit-filter', '');
            }
        } else {
            // Start rainbow effect
            this.startRainbowEffect();
        }
    }
},
{
    key: "debugEvent",
    value: function() {
        if (!this.debugEventWindow) {
            var self = this;
            this.$element.append(
                '<div id="debug_event_' + this.id + '" class="debug-window" style="position:absolute;z-index:1000;display:none;user-select:none;-webkit-user-select:none;">' +
                '<div style="position:absolute;top:7px;right:7px;width:21px;height:21px;cursor:pointer;z-index:1001;" class="close-button">' +
                '<img src="./img/desktop/close.event.png" style="width:21px;height:21px;">' +
                '</div>' +
                '<div style="position:absolute;top:7px;left:738px;width:117px;height:21px;cursor:pointer;z-index:1001;" class="event-button">' +
                '<img src="./img/desktop/button.continuetoshop.png" style="width:117px;height:21px;">' +
                '</div>' +
                '<img src="./img/desktop/window.event.png" style="display:block;pointer-events:none;">' +
                '<div class="debug-content" style="position:absolute;top:50px;left:20px;color:green;font-family:Arial;pointer-events:none;">' +
                '<marquee><span style="font-size: 42px; color: green; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">BEGINNER EVENT!!! GET THESE 4 ITEMS THIS EVENT!!!</span></marquee>' +
                '<br><br><br>' +
                '<span style="font-size: 24px; color: green; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">BEGINNER EVENT:</span><br>' +
                '<span style="font-size: 24px; color: green; font-family: Comic Sans MS, cursive, sans-serif; font-weight: bold;">NOHING HERE YET!</span><br>' +
                '</div>' +
                '</div>'
            );

            this.debugEventWindow = $("#debug_event_" + this.id);
            this.debugEventWindow.find('.close-button').click(function() {
                self.debugEventWindow.hide();
            });

            this.debugEventWindow.find('.event-button').click(function() {
                self.debugEventWindow.hide();
                self.debugShop();
            });

            // Dragging functionality (same as shop)
            var isDragging = false;
            var startX, startY, initialX, initialY;
            
            this.debugEventWindow.on('mousedown', function(e) {
                var y = e.offsetY;
                if (y <= 33) {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    initialX = parseInt(self.debugEventWindow.css('left'), 10) || 0;
                    initialY = parseInt(self.debugEventWindow.css('top'), 10) || 0;
                    e.preventDefault();
                }
            });

            $(document).on('mousemove', function(e) {
                if (isDragging) {
                    var dx = e.clientX - startX;
                    var dy = e.clientY - startY;
                    self.debugEventWindow.css({
                        left: (initialX + dx) + 'px',
                        top: (initialY + dy) + 'px'
                    });
                }
            });

            $(document).on('mouseup', function() {
                isDragging = false;
            });

            // Position window
            var maxCoords = this.maxCoords();
            this.debugEventWindow.css({
                left: (maxCoords.x / 2 - 200) + 'px',
                top: (maxCoords.y / 2 - 150) + 'px'
            });
        }

        // Toggle visibility
        if (this.debugEventWindow.is(":visible")) {
            this.debugEventWindow.hide();
        } else {
            this.debugEventWindow.show();
        }
    }
},
{
    key: "nuke",  // Change method name to avoid conflict
    value: function () {
        var self = this;
        
        // Create explosion effect
        this.createExplosion();
        
        // Apply physics to the bonzi
        this.applyExplosionPhysics();
        
        // Play explosion sound
        this.playExplosionSound();
        
        // Screen shake effect
        this.screenShake(15, 800);
    }
},
{
    key: "explode",
    value: function () {
        var self = this;
        
        // Create explosion element
        let explosion = document.createElement("div");
        explosion.className = "explosion";
        explosion.style.cssText = `
            position: absolute;
            left: ${this.x}px;
            top: ${this.y}px;
            width: 71px;
            height: 101px;
            background: url('./img/misc/explosion.png');
            background-position: 0 0;
            image-rendering: pixelated;
            pointer-events: none;
            z-index: 9998;
            transform: translate(65px, 30px) scale(2);
        `;

        document.getElementById('content').appendChild(explosion);

        // Bring bonzi above other elements
        this.$element.css("z-index", "9999");
        
        // Play explosion sound
        this.playExplosionSound();
        
        // Screen shake effect
        this.screenShake(15, 800);

        // Physics variables from scriptgay.js
        var rot = 0;
        var offsetX = 0;
        var offsetY = 0;
        var angvel = Math.random() * 30 + 20;
        if (Math.random() > 0.5) angvel *= -1;
        var xvel = Math.random() * 10 + 5;
        if (Math.random() > 0.5) xvel *= -1;
        var yvel = -20;
        var i = 0;

        // Remember starting position
        var baseX = this.x;
        var baseY = this.y;

        // Animate explosion frames
        this.animateExplosion(explosion);

        var interval = setInterval(function () {
            i++;
            yvel += 2; // gravity
            offsetX += xvel;
            rot += angvel;
            offsetY += yvel;

            // Move both DOM element and sprite
            self.move(baseX + offsetX, baseY + offsetY);
            
            // Rotate sprite
            if (self.sprite) {
                self.sprite.rotation = rot;
            }
            
            // Apply transform to DOM element for additional visual effect
            self.$element.css({
                "transform": `translate(${offsetX}px, ${offsetY}px) rotate(${rot}deg)`,
                "transform-origin": "center center"
            });

            // Fade out towards the end
            if (i > 90) {
                var opacity = (120 - i) / 30;
                self.$element.css('opacity', opacity);
            }

            if (i > 120) {
                clearInterval(interval);
                // Reset everything
                if (self.sprite) self.sprite.rotation = 0;
                self.$element.css({
                    "opacity": "1",
                    "z-index": "",
                    "transform": "",
                    "transform-origin": ""
                });
                // Reset position
                self.move(baseX, baseY);
                
                // Remove explosion element
                if (explosion.parentNode) {
                    explosion.parentNode.removeChild(explosion);
                }
            }
        }, 33);
    }
},
{
    key: "createExplosion",
    value: function () {
        var explosion = document.createElement("div");
        explosion.className = "explosion";
        explosion.style.cssText = `
            position: absolute;
            left: ${this.x}px;
            top: ${this.y}px;
            width: 71px;
            height: 101px;
            background: url('./img/misc/explosion.png');
            background-position: 0 0;
            image-rendering: pixelated;
            pointer-events: none;
            z-index: 99999;
            transform: translate(65px, 30px) scale(2);
        `;

        document.getElementById('content').appendChild(explosion);

        // Animate explosion frames
        this.animateExplosion(explosion);
    }
},
{
    key: "animateExplosion",
    value: function (explosion) {
        var frame = 0;
        var totalFrames = 17;
        var frameWidth = 71;
        
        var animate = () => {
            if (frame >= totalFrames) {
                // Remove explosion when done
                if (explosion.parentNode) {
                    explosion.parentNode.removeChild(explosion);
                }
                return;
            }

            // Update background position for sprite animation
            var xOffset = -frameWidth * frame;
            explosion.style.backgroundPosition = `${xOffset}px 0`;
            frame++;

            requestAnimationFrame(animate);
        };

        animate();
    }
},
{
    key: "applyExplosionPhysics",
    value: function () {
        // Bring bonzi above other elements
        this.$element.css("z-index", "9999");
        
        // Reset any existing transforms
        this.$element.css({
            "transition": "none",
            "transform": "",
            "transform-origin": "center center"
        });

        // Physics variables
        var rot = 0;
        var offsetX = 0;
        var offsetY = 0;
        var angvel = Math.random() * 30 + 20;
        if (Math.random() > 0.5) angvel *= -1;
        var xvel = Math.random() * 10 + 5;
        if (Math.random() > 0.5) xvel *= -1;
        var yvel = -20;
        
        var frame = 0;
        var maxFrames = 120; // ~4 seconds at 30fps

        var baseX = this.x;
        var baseY = this.y;

        var interval = setInterval(() => {
            frame++;
            yvel += 2; // gravity
            offsetX += xvel;
            rot += angvel;
            offsetY += yvel;

            // Move both DOM element and sprite
            this.move(baseX + offsetX, baseY + offsetY);
            
            // Rotate sprite
            if (this.sprite) {
                this.sprite.rotation = rot;
            }

            // Fade out towards the end
            if (frame > 90) {
                var opacity = (120 - frame) / 30;
                this.$element.css('opacity', opacity);
            }

            if (frame > maxFrames) {
                clearInterval(interval);
                // Reset everything
                if (this.sprite) this.sprite.rotation = 0;
                this.$element.css({
                    "opacity": "1",
                    "z-index": "",
                    "transform": "",
                    "transform-origin": ""
                });
                // Reset position
                this.move(baseX, baseY);
            }
        }, 33);
    }
},
{
    key: "playExplosionSound",
    value: function () {
        try {
            const explosionSound = new Audio("./explosion.mp3");
            explosionSound.volume = 0.7;
            explosionSound.play().catch(e => {
                console.log("Audio play failed:", e);
                // Fallback to embedded sound
                this.playFallbackExplosionSound();
            });
        } catch (error) {
            console.log("Error playing explosion sound:", error);
            this.playFallbackExplosionSound();
        }
    }
},
{
    key: "playFallbackExplosionSound",
    value: function () {
        // Create a fallback explosion sound using Web Audio API
        try {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = audioContext.createOscillator();
            var gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
        } catch (e) {
            console.log("Fallback explosion sound failed:", e);
        }
    }
},
{
    key: "screenShake",
    value: function (intensity = 10, duration = 500) {
        const content = document.getElementById('content');
        if (!content) return;
        
        // Create shake animation
        const shakeKeyframes = `
            @keyframes screenShake {
                0%, 100% { transform: translateX(0) translateY(0); }
                10% { transform: translateX(-${intensity}px) translateY(-${intensity/2}px); }
                20% { transform: translateX(${intensity}px) translateY(${intensity/2}px); }
                30% { transform: translateX(-${intensity/2}px) translateY(-${intensity}px); }
                40% { transform: translateX(${intensity/2}px) translateY(${intensity}px); }
                50% { transform: translateX(-${intensity}px) translateY(${intensity/2}px); }
                60% { transform: translateX(${intensity}px) translateY(-${intensity/2}px); }
                70% { transform: translateX(-${intensity/2}px) translateY(${intensity}px); }
                80% { transform: translateX(${intensity/2}px) translateY(-${intensity}px); }
                90% { transform: translateX(-${intensity}px) translateY(-${intensity}px); }
            }
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = shakeKeyframes;
        document.head.appendChild(style);

        // Apply animation
        content.style.animation = `screenShake ${duration}ms ease-out`;
        
        // Clean up
        setTimeout(() => {
            content.style.animation = '';
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, duration);
    }
},
                {
                    key: "eventMake",
                    value: function (a) {
                        return {
                            list: a,
                            index: 0,
                            timer: 0,
                            cur: function () {
                                return this.list[this.index];
                            },
                        };
                    },
                },
                {
                    key: "mousedown",
                    value: function (a) {
                        1 == a.which && ((this.drag = !0), (this.dragged = !1), (this.drag_start = { x: a.pageX - this.x, y: a.pageY - this.y }));
                    },
                },
                {
                    key: "mousemove",
                    value: function (a) {
                        this.drag && (this.move(a.pageX - this.drag_start.x, a.pageY - this.drag_start.y), (this.dragged = !0));
                    },
                },
    {
        key: "move",
        value: function (a, b) {
            if (arguments.length !== 0) {
                this.x = a;
                this.y = b;
            }
            
            var c = this.maxCoords();
            this.x = Math.min(Math.max(0, this.x), c.x);
            this.y = Math.min(Math.max(0, this.y), c.y);
            
            // Update DOM element position
            this.$element.css({ 
                left: this.x + "px", 
                top: this.y + "px"
            });
            
            // Update sprite position
            if (this.sprite) {
                this.sprite.x = this.x;
                this.sprite.y = this.y;
            }
            
            BonziHandler.needsUpdate = true;
            this.updateDialog();
        }
    },
                {
                    key: "mouseup",
                    value: function (a) {
                        !this.dragged && this.drag && this.cancel(), (this.drag = !1), (this.dragged = !1);
                    },
                },
                {
                    key: "runSingleEvent",
                    value: function (a) {
                        this.mute || this.eventQueue.push(this.eventMake(a));
                    },
                },
                {
                    key: "clearDialog",
                    value: function () {
                        this.$dialogCont.html(""), this.$dialog.hide();
                    },
                },
                {
                    key: "cancel",
                    value: function () {
                        this.clearDialog(), this.stopSpeaking(), (this.eventQueue = [this.eventMake([{ type: "idle" }])]);
                    },
                },
                {
                    key: "retry",
                    value: function () {
                        this.clearDialog(), (this.event.timer = 0);
                    },
                },
                {
                    key: "stopSpeaking",
                    value: function () {
                        this.goingToSpeak = !1;
                        try {
                            this.voiceSource.stop();
                        } catch (a) {}
                    },
                },
                {
                    key: "cancelQueue",
                    value: function () {
                        this.willCancel = !0;
                    },
                },
                {
                    key: "updateAnim",
                    value: function () {
                        0 === this.event.timer && this.sprite.gotoAndPlay(this.event.cur().anim), this.event.timer++, (BonziHandler.needsUpdate = !0), this.event.timer >= this.event.cur().ticks && this.eventNext();
                    },
                },
                {
                    key: "updateText",
                    value: function () {
                        0 === this.event.timer && (this.$dialog.css("display", "block"), (this.event.timer = 1), this.talk(this.event.cur().text, this.event.cur().say, !0)), "none" == this.$dialog.css("display") && this.eventNext();
                    },
                },
                {
                    key: "showPoll",
                    value: function (pollId, question, yes, no) {
                        this.activePoll = { id: pollId, yes: yes || 0, no: no || 0 };
                        var total = (this.activePoll.yes + this.activePoll.no) || 1;
                        var yesPct = Math.round((this.activePoll.yes / total) * 100);
                        var noPct = 100 - yesPct;
                        var html = "<div class='poll' style=\"width:160px;background:#eef8e6;padding:4px;border:1px solid #3a3;font-size:12px;\">" +
                                   "<div style=\"margin-bottom:4px;color:#222;\">" + question + "</div>" +
                                   "<div style=\"margin:3px 0;\">" +
                                   "<div style=\"font-weight:bold;color:#060;\">Yes: <span class='poll-yes-count'>" + this.activePoll.yes + "</span></div>" +
                                   "<div style=\"position:relative;height:12px;border:1px solid #060;background:#d7f7cf;\">" +
                                   "<div class='poll-yes-bar' style=\"height:100%;width:" + yesPct + "%;background:#00e600;\"></div>" +
                                   "</div>" +
                                   "</div>" +
                                   "<div style=\"margin:3px 0;\">" +
                                   "<div style=\"font-weight:bold;color:#900;\">No: <span class='poll-no-count'>" + this.activePoll.no + "</span></div>" +
                                   "<div style=\"position:relative;height:12px;border:1px solid #900;background:#f8caca;\">" +
                                   "<div class='poll-no-bar' style=\"height:100%;width:" + noPct + "%;background:#ff0000;\"></div>" +
                                   "</div>" +
                                   "</div>" +
                                   "<div style=\"display:flex;gap:4px;margin-top:4px;\">" +
                                   "<button class='poll-vote-yes' style=\"padding:2px 6px;font-size:11px;\">Vote Yes</button>" +
                                   "<button class='poll-vote-no' style=\"padding:2px 6px;font-size:11px;\">Vote No</button>" +
                                   "</div>" +
                                   "</div>";
                        this.$dialogCont.html(html);
                        this.$dialog.show();
                        var self = this;
                        this.$dialogCont.find('.poll-vote-yes').off('click').on('click', function(){
                            socket.emit('poll_vote', { pollId: self.activePoll.id, choice: 'yes' });
                        });
                        this.$dialogCont.find('.poll-vote-no').off('click').on('click', function(){
                            socket.emit('poll_vote', { pollId: self.activePoll.id, choice: 'no' });
                        });
                    }
                },
                {
                    key: "updatePollCounts",
                    value: function(yes, no) {
                        if (!this.activePoll) return;
                        this.activePoll.yes = yes;
                        this.activePoll.no = no;
                        var total = (yes + no) || 1;
                        var yesPct = Math.round((yes / total) * 100);
                        var noPct = 100 - yesPct;
                        this.$dialogCont.find('.poll-yes-count').text(yes);
                        this.$dialogCont.find('.poll-no-count').text(no);
                        this.$dialogCont.find('.poll-yes-bar').css('width', yesPct + '%');
                        this.$dialogCont.find('.poll-no-bar').css('width', noPct + '%');
                    }
                },
                {
                    key: "updateIdle",
                    value: function () {
                        var a = "idle" == this.sprite.currentAnimation && 0 === this.event.timer;
                        (a = a || this.data.pass_idle.indexOf(this.sprite.currentAnimation) != -1),
                            a
                                ? this.eventNext()
                                : (0 === this.event.timer && ((this.tmp_idle_start = this.data.to_idle[this.sprite.currentAnimation]), this.sprite.gotoAndPlay(this.tmp_idle_start), (this.event.timer = 1)),
                                  this.tmp_idle_start != this.sprite.currentAnimation && "idle" == this.sprite.currentAnimation && this.eventNext(),
                                  (BonziHandler.needsUpdate = !0));
                    },
                },
                {
                    key: "updateRandom",
                    value: function () {
                        var a = this.event.cur().add,
                            b = Math.floor(a.length * this.rng()),
                            c = this.eventMake(a[b]);
                        this.eventNext(), this.eventQueue.unshift(c);
                    },
                },
                {
key: "rainbow",
value: function() {
    var self = this;
    
    // If rainbow effect is active, remove it
    if (this.rainbowInterval) {
        clearInterval(this.rainbowInterval);
        this.rainbowInterval = null;
        
        // Remove CSS filters
        this.$canvas.css('filter', '');
        this.$canvas.css('-webkit-filter', '');
        
        // If color is 'rainbow', keep the effect going
        if (this.color === 'rainbow') {
            this.startRainbowEffect();
        }
    } else {
        this.startRainbowEffect();
    }
},
},
{
    key: "startRainbowEffect",
    value: function() {
        var self = this;
        
        // Stop any existing rainbow effect first
        if (this.rainbowInterval) {
            clearInterval(this.rainbowInterval);
        }
        
        // Animation variables  
        this.rainbowHue = 0;
        this.rainbowSpeed = 3; // Degrees per frame
        
        // Start the rainbow animation
        this.rainbowInterval = setInterval(function() {
            if (self.$canvas && self.$canvas.length > 0) {
                self.rainbowHue = (self.rainbowHue + self.rainbowSpeed) % 360;
                
                // Apply CSS hue-rotate filter
                self.$canvas.css('filter', 'hue-rotate(' + self.rainbowHue + 'deg) saturate(1.5) brightness(1.1)');
                self.$canvas.css('-webkit-filter', 'hue-rotate(' + self.rainbowHue + 'deg) saturate(1.5) brightness(1.1)');
            }
        }, 50);
    }
},
{
    key: "setupAudioAnalysis",
    value: function() {
        // Use the shared audio context and nodes
        this.analyser = sharedAnalyser;
        this.gainNode = sharedGainNode;
        this.auCtx = sharedAudioContext;
        
        // Set up the frequency data array
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Initialize source to null
        this.source = null;
    },
},
{
    key: "stopSpeaking",
    value: function () {
        this.goingToSpeak = !1;
        // Return to idle animation
        if (this.sprite && (this.sprite.currentAnimation.startsWith("lipsync") || this.sprite.currentAnimation === "idle")) {
            this.sprite.gotoAndPlay("idle");
            this.needsUpdate = true;
        }
        try {
            if (this.voiceSource) {
                this.voiceSource.stop();
                this.voiceSource.disconnect();
            }
        } catch (a) {}
    },
},
{
    key: "update",
    value: function () {
        if (this.run) {
            if (
                (0 !== this.eventQueue.length && this.eventQueue[0].index >= this.eventQueue[0].list.length && this.eventQueue.splice(0, 1), 
                (this.event = this.eventQueue[0]), 
                0 !== this.eventQueue.length && this.eventRun)
            ) {
                var a = this.event.cur().type;
                try {
                    this[this.eventTypeToFunc[a]]();
                } catch (b) {
                    this.event.index++;
                }
            }
            
            // FIX THIS LINE - Add null check for this.source
            if (this.goingToSpeak && this.analyser && this.source) {
                this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(this.freqData);
                
                var percent = Math.round(((max(this.freqData) - 128) / 128) * 100);
                percent = Math.max(0, Math.min(percent, 100));
                
                // Update animation based on audio level only when speaking
                if (this.sprite.currentAnimation === "idle" ||
                    this.sprite.currentAnimation.startsWith("lipsync")) {
                    
                    if (percent < 10) {
                        this.sprite.gotoAndPlay("idle");
                    } else if (percent < 25) {
                        this.sprite.gotoAndPlay("lipsync0");
                    } else if (percent < 40) {
                        this.sprite.gotoAndPlay("lipsync1"); 
                    } else if (percent < 60) {
                        this.sprite.gotoAndPlay("lipsync2");
                    } else {
                        this.sprite.gotoAndPlay("lipsync3");
                    }
                    this.needsUpdate = true;
                }
            } else if (this.goingToSpeak && (this.sprite.currentAnimation === "idle" || this.sprite.currentAnimation.startsWith("lipsync"))) {
                // Default lip sync when speaking but no audio data
                this.sprite.gotoAndPlay("lipsync3");
                this.needsUpdate = true;
            }
            
            this.willCancel && (this.cancel(), (this.willCancel = !1)), 
            this.needsUpdate && this.stage && this.stage.update && (this.stage.update(), (this.needsUpdate = !1));
        }
    },
},
                {
                    key: "eventNext",
                    value: function () {
                        (this.event.timer = 0), (this.event.index += 1);
                    },
                },
                {
    key: "talk",
    value: function (a, b, c) {
        var d = this;
        (c = c || !1),
            (a = replaceAll(a, "{NAME}", this.userPublic.name)),
            (a = replaceAll(a, "{COLOR}", this.color)),
            "undefined" != typeof b ? ((b = replaceAll(b, "{NAME}", this.userPublic.name)), (b = replaceAll(b, "{COLOR}", this.color))) : (b = a.replace("&gt;", "")),
            (a = linkify(a));
        var e = "&gt;" == a.substring(0, 4) || ">" == a[0];
        this.$dialogCont[c ? "html" : "text"](a)[e ? "addClass" : "removeClass"]("bubble_greentext").css("display", "block"),
            this.stopSpeaking(),
            (this.goingToSpeak = !0),
            
            // Set up audio analysis before speaking
            this.setupAudioAnalysis(),
            
            speak.play(
                b, 
                { pitch: this.userPublic.pitch, speed: this.userPublic.speed },
                function () {
                    d.clearDialog();
                    d.goingToSpeak = false;
                    // Return to idle when done speaking
                    if (d.sprite && (d.sprite.currentAnimation.startsWith("lipsync") || d.sprite.currentAnimation === "idle")) {
                        d.sprite.gotoAndPlay("idle");
                        d.needsUpdate = true;
                    }
                    // Disconnect the source when done
                    if (d.voiceSource && d.gainNode) {
                        d.voiceSource.disconnect();
                    }
                },
                function (source) {
                    d.voiceSource = source;
                    // Connect the audio source to our shared analysis chain
                    if (d.gainNode) {
                        source.connect(d.gainNode);
                    }
                }
            );
    },
},
                {
                    key: "joke",
                    value: function () {
                        this.runSingleEvent(this.data.event_list_joke);
                    },
                },
                {
                    key: "fact",
                    value: function () {
                        this.runSingleEvent(this.data.event_list_fact);
                    },
                },
                {
                    key: "exit",
                    value: function (a) {
                        this.runSingleEvent([{ type: "anim", anim: "surf_away", ticks: 30 }]), setTimeout(a, 2e3);
setTimeout(() => {
  new Audio("https://files.catbox.moe/otlcp8.wav").play();
}, 300);
                    },
                },
                {
                    key: "deconstruct",
                    value: function () {
                        this.stopSpeaking(), BonziHandler.stage.removeChild(this.sprite), (this.run = !1), this.$element.remove();
                    },
                },
                {
                    key: "updateName",
value: function () {
    var nameHtml = "";
    
    // Add tag above name if it exists
    if (this.userPublic.tag && this.userPublic.tag.trim()) {
        nameHtml += "<div style=\"font-size:10px;color:#666;margin-bottom:2px;text-align:center;\">" + 
                   this.userPublic.tag.trim() + "</div>";
    }
    
    nameHtml += this.userPublic.name;
    
    // Admin/Owner tag
    if (this.userPublic.admin) {
        nameHtml += " <span style=\"background:#7c41c9;color:#fff;border-radius:3px;padding:1px 4px;margin-left:6px;font-size:11px;vertical-align:middle;display:inline-flex;align-items:center;gap:4px;\">" +
            "<img src=\"./img/misc/popeicon.png\" width=\"14\" height=\"14\" alt=\"admin\" onerror=\"this.style.display='none'\">" +
            "OWNER " +
            "<img src=\"./img/misc/popeicon.png\" width=\"14\" height=\"14\" alt=\"admin\" onerror=\"this.style.display='none'\">" +
            "</span>";
    }
    // Temp Owner tag (moderator2)
    else if (this.userPublic.tempowner) {
        nameHtml += " <span style=\"background:#7c41c9;color:#fff;border-radius:3px;padding:1px 4px;margin-left:6px;font-size:11px;vertical-align:middle;display:inline-flex;align-items:center;gap:4px;\">" +
            "<img src=\"./img/misc/admin2.png\" width=\"14\" height=\"14\" alt=\"admin2\" onerror=\"this.style.display='none'\">" +
            "ADMIN" +
            "<img src=\"./img/misc/admin2.png\" width=\"14\" height=\"14\" alt=\"admin2\" onerror=\"this.style.display='none'\">" +
            "</span>";
    }
    // Dev tag (moderator1) 
    else if (this.userPublic.dev) {
        nameHtml += " <span style=\"background:#000;color:#fff;border-radius:3px;padding:1px 4px;margin-left:6px;font-size:11px;vertical-align:middle;display:inline-flex;align-items:center;gap:4px;\">" +
            "<img src=\"./img/misc/dev.png\" width=\"14\" height=\"14\" alt=\"dev\" onerror=\"this.style.display='none'\">" +
            "DEV" +
            "<img src=\"./img/misc/dev.png\" width=\"14\" height=\"14\" alt=\"dev\" onerror=\"this.style.display='none'\">" +
            "</span>";
    }
    // Regular moderator tag
    else if (this.userPublic.moderator) {
        nameHtml += " <span style=\"background:#4177c9;color:#fff;border-radius:3px;padding:1px 4px;margin-left:6px;font-size:11px;vertical-align:middle;display:inline-flex;align-items:center;gap:4px;\">" +
            "<img src=\"./img/misc/kitty.png\" width=\"14\" height=\"14\" alt=\"mod\" onerror=\"this.style.display='none'\">" +
            "MOD " +
            "<img src=\"./img/misc/kitty.png\" width=\"14\" height=\"14\" alt=\"mod\" onerror=\"this.style.display='none'\">" +
            "</span>";
    }
    this.$nametag.html(nameHtml);
},
                },
                {
                    key: "youtube",
                    value: function (a) {
                        if (!this.mute) {
                            var b = "iframe";
                            this.$dialogCont.html(
                                "\n\t\t\t\t\t<" +
                                    b +
                                    ' type="text/html" width="173" height="173" \n\t\t\t\t\tsrc="https://www.youtube.com/embed/' +
                                    a +
                                    '?autoplay=1" \n\t\t\t\t\tstyle="width:173px;height:173px"\n\t\t\t\t\tframeborder="0"\n\t\t\t\t\tallowfullscreen="allowfullscreen"\n\t\t\t\t\tmozallowfullscreen="mozallowfullscreen"\n\t\t\t\t\tmsallowfullscreen="msallowfullscreen"\n\t\t\t\t\toallowfullscreen="oallowfullscreen"\n\t\t\t\t\twebkitallowfullscreen="webkitallowfullscreen"\n\t\t\t\t\t></' +
                                    b +
                                    ">\n\t\t\t\t"
                            ),
                                this.$dialog.show();
                        }
                    },
                },
                {
                    key: "showImage",
                    value: function(url){
                        if (this.mute) return;
                        var max = 173;
                        var html = "<div style=\"max-width:"+max+"px;max-height:"+max+"px;overflow:hidden;\">"+
                                   "<img src=\""+encodeURI(url)+"\" alt=\"image\" style=\"width:100%;height:auto;display:block;\">"+
                                   "</div>";
                        this.$dialogCont.html(html);
                        this.$dialog.show();
                    }
                },
                {
                    key: "showVideo",
                    value: function(url){
                        if (this.mute) return;
                        var max = 173;
                        var html = "<video controls playsinline style=\"width:"+max+"px;max-height:"+max+"px;background:#000;\">"+
                                   "<source src=\""+encodeURI(url)+"\">"+
                                   "Your browser does not support the video tag."+
                                   "</video>";
                        this.$dialogCont.html(html);
                        this.$dialog.show();
                    }
                },
                {
                    key: "backflip",
                    value: function (a) {
                        var b = [{ type: "anim", anim: "backflip", ticks: 15 }];
                        a && (b.push({ type: "anim", anim: "cool_fwd", ticks: 30 }), b.push({ type: "idle" })), this.runSingleEvent(b);
                    },
                },
{
    key: "updateDialog",
    value: function () {
        var containerWidth = this.$container.width();
        var containerHeight = this.$container.height();
        var bubbleWidth = this.$dialog.width();
        var bubbleHeight = this.$dialog.height();
        var bonziWidth = this.data.size.x;
        var bonziHeight = this.data.size.y;
        
        // Calculate available space on each side
        var spaceRight = containerWidth - (this.x + bonziWidth);
        var spaceLeft = this.x;
        var spaceTop = this.y;
        var spaceBottom = containerHeight - (this.y + bonziHeight);
        
        // Determine the best position for the bubble
        if (spaceRight >= bubbleWidth) {
            // Enough space on the right
            this.$dialog.removeClass("bubble-left bubble-top bubble-bottom").addClass("bubble-right");
        } else if (spaceLeft >= bubbleWidth) {
            // Enough space on the left
            this.$dialog.removeClass("bubble-right bubble-top bubble-bottom").addClass("bubble-left");
        } else if (spaceBottom >= bubbleHeight) {
            // Enough space below
            this.$dialog.removeClass("bubble-left bubble-right bubble-top").addClass("bubble-bottom");
        } else if (spaceTop >= bubbleHeight) {
            // Enough space above
            this.$dialog.removeClass("bubble-left bubble-right bubble-bottom").addClass("bubble-top");
        } else {
            // Default to right if no space anywhere (shouldn't normally happen)
            this.$dialog.removeClass("bubble-left bubble-top bubble-bottom").addClass("bubble-right");
        }
    }
},
                {
                    key: "maxCoords",
                    value: function () {
                        return { x: this.$container.width() - this.data.size.x, y: this.$container.height() - this.data.size.y - $("#chat_bar").height() };
                    },
                },
                {
                    key: "asshole",
                    value: function (a) {
                        this.runSingleEvent([{ type: "text", text: "Hey, " + a + "!" }, { type: "text", text: "You're a fucking asshole!", say: "your a fucking asshole!" }, { type: "anim", anim: "grin_fwd", ticks: 15 }, { type: "idle" }]);
                    },
                },
                {
                    key: "owo",
                    value: function (a) {
                        this.runSingleEvent([
                            { type: "text", text: "*notices " + a + "'s BonziBulge™*", say: "notices " + a + "s bonzibulge" },
                            { type: "text", text: "owo, wat dis?", say: "oh woah, what diss?" },
                        ]);
                    },
                },
{
    key: "updateSprite",
    value: function (a) {
        var b = BonziHandler.stage;
        this.cancel();
        
        // Remove old sprite if it exists
        if (this.sprite) {
            b.removeChild(this.sprite);
        }
        
        // Get the appropriate sprite sheet based on figure
        var spriteSheet;
        var baseColor = this.color === 'rainbow' ? 'purple' : this.color;
        
        if (this.figure === 'peedy' && BonziHandler.spriteSheets.peedy) {
            spriteSheet = BonziHandler.spriteSheets.peedy[baseColor];
        } else {
            spriteSheet = BonziHandler.spriteSheets.bonzi[baseColor];
        }
        
        // Create new sprite
        this.sprite = new createjs.Sprite(spriteSheet, "idle");
        b.addChild(this.sprite);
        
        this.move();
        this.colorPrev = this.color;
        this.figurePrev = this.figure;
        
        // Start or stop rainbow effect based on color
        if (this.color === 'rainbow') {
            if (!this.rainbowInterval) {
                this.startRainbowEffect();
            }
        } else {
            // Stop rainbow effect and remove filters
            if (this.rainbowInterval) {
                clearInterval(this.rainbowInterval);
                this.rainbowInterval = null;
            }
            this.$canvas.css('filter', '');
            this.$canvas.css('-webkit-filter', '');
        }
        
        // Force update
        this.needsUpdate = true;
        BonziHandler.needsUpdate = true;
    }
},
                {
                    key: "explode",
                    value: function () {
                        var self = this;
                        // Bring nametag/bubble above other UI
                        this.$element.css("z-index", "999999");
                        // Optional sound
                        try {
                            var sfx = new Audio("./explosion.mp3");
                            sfx.play();
                        } catch (e) {}

                        // Physics variables
                        var rot = 0;
                        var offsetX = 0;
                        var offsetY = 0;
                        var angvel = Math.random() * 30 + 20;
                        if (Math.random() > 0.5) angvel *= -1;
                        var xvel = Math.random() * 10 + 5;
                        if (Math.random() > 0.5) xvel *= -1;
                        var yvel = -20;
                        var i = 0;

                        // Remember starting position so both DOM and sprite move together
                        var baseX = this.x;
                        var baseY = this.y;

                        var interval = setInterval(function () {
                            i++;
                            yvel += 2; // gravity
                            offsetX += xvel;
                            rot += angvel;
                            offsetY += yvel;

                            // Move both DOM (name/bubble) and sprite together
                            self.move(baseX + offsetX, baseY + offsetY);
                            // Rotate only the sprite graphic
                            if (self.sprite) self.sprite.rotation = rot;

                            if (i > 120) {
                                clearInterval(interval);
                                if (self.sprite) self.sprite.rotation = 0;
                            }
                        }, 33);
                    }
                },
            ]),
            a
        );
    })(),
    BonziData = {
        size: { x: 200, y: 160 },
        sprite: {
            frames: { width: 200, height: 160 },
            animations: {
                idle: 0,
                surf_across_fwd: [1, 8, "surf_across_still", 1],
                surf_across_still: 9,
                surf_across_back: { frames: range(8, 1), next: "idle", speed: 1 },
                clap_fwd: [10, 12, "clap_still", 1],
                clap_still: [13, 15, "clap_still", 1],
                clap_back: { frames: range(12, 10), next: "idle", speed: 1 },
                surf_intro: [277, 302, "idle", 1],
                surf_away: [16, 38, "gone", 1],
                gone: 39,
                shrug_fwd: [40, 50, "shrug_still", 1],
                shrug_still: 50,
                shrug_back: { frames: range(50, 40), next: "idle", speed: 1 },
                earth_fwd: [51, 57, "earth_still", 1],
                earth_still: [58, 80, "earth_still", 1],
                earth_back: [81, 86, "idle", 1],
                look_down_fwd: [87, 90, "look_down_still", 1],
                look_down_still: 91,
                look_down_back: { frames: range(90, 87), next: "idle", speed: 1 },
                lean_left_fwd: [94, 97, "lean_left_still", 1],
                lean_left_still: 98,
                lean_left_back: { frames: range(97, 94), next: "idle", speed: 1 },
                beat_fwd: [101, 103, "beat_still", 1],
                beat_still: [104, 107, "beat_still", 1],
                beat_back: { frames: range(103, 101), next: "idle", speed: 1 },
                cool_fwd: [108, 124, "cool_still", 1],
                cool_still: 125,
                cool_back: { frames: range(124, 108), next: "idle", speed: 1 },
                cool_right_fwd: [126, 128, "cool_right_still", 1],
                cool_right_still: 129,
                cool_right_back: { frames: range(128, 126), next: "idle", speed: 1 },
                cool_left_fwd: [131, 133, "cool_left_still", 1],
                cool_left_still: 134,
                cool_left_back: { frames: range(133, 131), next: "cool_still", speed: 1 },
                cool_adjust: { frames: [124, 123, 122, 121, 120, 135, 136, 135, 120, 121, 122, 123, 124], next: "cool_still", speed: 1 },
                present_fwd: [137, 141, "present_still", 1],
                present_still: 142,
                present_back: { frames: range(141, 137), next: "idle", speed: 1 },
                look_left_fwd: [143, 145, "look_left_still", 1],
                look_left_still: 146,
                look_left_back: { frames: range(145, 143), next: "idle", speed: 1 },
                look_right_fwd: [149, 151, "look_right_still", 1],
                look_right_still: 152,
                look_right_back: { frames: range(151, 149), next: "idle", speed: 1 },
                lean_right_fwd: { frames: range(158, 156), next: "lean_right_still", speed: 1 },
                lean_right_still: 155,
                lean_right_back: [156, 158, "idle", 1],
                praise_fwd: [159, 163, "praise_still", 1],
                praise_still: 164,
                praise_back: { frames: range(163, 159), next: "idle", speed: 1 },
                grin_fwd: [182, 189, "grin_still", 1],
                grin_still: 184,
                grin_back: { frames: range(184, 182), next: "idle", speed: 1 },
                backflip: [331, 343, "idle", 1],
                lipsync0: 344,
                lipsync1: 345, 
                lipsync2: 346,
                lipsync3: 348,
                lipsync4: 348,
                lipsync5: 349,
                lipsync6: 350
            },
        },
        to_idle: {
            surf_across_fwd: "surf_across_back",
            surf_across_still: "surf_across_back",
            clap_fwd: "clap_back",
            clap_still: "clap_back",
            shrug_fwd: "shrug_back",
            shrug_still: "shrug_back",
            earth_fwd: "earth_back",
            earth_still: "earth_back",
            look_down_fwd: "look_down_back",
            look_down_still: "look_down_back",
            lean_left_fwd: "lean_left_back",
            lean_left_still: "lean_left_back",
            beat_fwd: "beat_back",
            beat_still: "beat_back",
            cool_fwd: "cool_back",
            cool_still: "cool_back",
            cool_adjust: "cool_back",
            cool_left_fwd: "cool_left_back",
            cool_left_still: "cool_left_back",
            present_fwd: "present_back",
            present_still: "present_back",
            look_left_fwd: "look_left_back",
            look_left_still: "look_left_back",
            look_right_fwd: "look_right_back",
            look_right_still: "look_right_back",
            lean_right_fwd: "lean_right_back",
            lean_right_still: "lean_right_back",
            praise_fwd: "praise_back",
            praise_still: "praise_back",
            grin_fwd: "grin_back",
            grin_still: "grin_back",
            backflip: "idle",
            idle: "idle",
            lipsync0: "idle",
    lipsync1: "idle", 
    lipsync2: "idle",
    lipsync3: "idle",
    lipsync4: "idle",
    lipsync5: "idle",
    lipsync6: "idle"
        },
        pass_idle: ["gone"],
        event_list_joke_open: [
            [
                { type: "text", text: "Yeah, of course {NAME} wants me to tell a joke." },
                { type: "anim", anim: "praise_fwd", ticks: 15 },
                { type: "text", text: '"Haha, look at the stupid {COLOR} monkey telling jokes!" Fuck you. It isn\'t funny.', say: "Hah hah! Look at the stupid {COLOR} monkey telling jokes! Fuck you. It isn't funny." },
                { type: "anim", anim: "praise_back", ticks: 15 },
                { type: "text", text: "But I'll do it anyway. Because you want me to. I hope you're happy." },
            ],
            [{ type: "text", text: "{NAME} used /joke. Whoop-dee-fucking doo." }],
            [{ type: "text", text: "HEY YOU IDIOTS ITS TIME FOR A JOKE" }],
            [
                { type: "text", text: "Wanna hear a joke?" },
                { type: "text", text: "No?" },
                { type: "text", text: "Mute me then. That's your fucking problem." },
            ],
            [{ type: "text", text: "Master one {NAME} wants me to tell a joke." }],
            [{ type: "text", text: "Time for whatever horrible fucking jokes the creator of this site wrote." }],
        ],
        event_list_joke_mid: [
            [
                { type: "text", text: "Why does the chicken cross the road?" },
                { type: "text", text: "To get hit by a car!" },
            ],
            [
                { type: "text", text: '"*microwave sounds*', say: "[[mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm" },
                { type: "anim", anim: "shrug_back", ticks: 15 },
            ],
            [
                { type: "text", text: "Why was 6 afraid of 7?" },
                { type: "text", text: "It was thanksgiving and 9 was the turkey" },
            ],
            [
                { type: "text", text: "Why was the cinema afraid of the minecraft movie?" },
                { type: "text", text: "Because of the 'CHICKEN JOCKEY *crowd cheering' flashbacks btw. " },
            ],
            [
                {
                    type: "text",
                    text: 'Two sausages are in a pan. One looks at the other and says "Boy it\'s hot in here!" and the other sausage says "Unbelievable! It\'s a talking sausage!"',
                    say: "Two sausages are in a pan. One looks at the other and says, Boy it's hot in here! and the other sausage says, Unbelievable! It's a talking sausage!",
                },
                { type: "anim", anim: "shrug_back", ticks: 15 },
                { type: "text", text: "What were you expecting? A dick joke? You're a sick fuck." },
            ],
            [
                { type: "text", text: "What is in the middle of Paris?" },
                { type: "text", text: "Things to See and Do in Paris' City Center | The Paris Pass®" },
            ],
            [
                { type: "text", text: "What type of water won't freeze?" },
                { type: "text", text: "The lava chicken jockey from the minecraft movie." },
            ],
            [
                { type: "text", text: "Who earns a living by driving his customers away?" },
                { type: "text", text: "Nintendo!" },
            ],
            [
                { type: "text", text: "What did the digital clock say to the grandfather clock?" },
                { type: "text", text: "Suck my clock." },
            ],
            [
                { type: "text", text: "Why does scientists hate atoms?" },
                { type: "text", text: "They make up everything!" },
            ],
            [
                { type: "text", text: "Why do we call money bread?" },
                { type: "text", text: "Because we KNEAD it. Haha please send money to my PayPal at tamimi@engineer.com" },
            ],
            [
                { type: "text", text: "What is a cow that eats grass?" },
                { type: "text", text: "ASS" },
                { type: "text", text: "I'm a comedic genius, I know." },
            ],
        ],
        event_list_joke_end: [
            [
                { type: "text", text: "You know {NAME}, a good friend laughs at your jokes even when they're not so funny." },
                { type: "text", text: "And you fucking suck. Thanks." },
            ],
            [{ type: "text", text: "Where do I come up with these? My ass?" }],
            [
                { type: "text", text: "Do I amuse you, {NAME}? Am I funny? Do I make you laugh?" },
                { type: "text", text: "pls respong", say: "please respong" },
            ],
            [{ type: "text", text: "Maybe I'll keep my day job, {NAME}. Patreon didn't accept me." }],
            [
                { type: "text", text: "Laughter is the best medicine!" },
                { type: "text", text: "Apart from meth." },
            ],
            [
                { type: "text", text: "Don't judge me on my sense of humor alone." },
                { type: "text", text: "Help! I'm being oppressed!" },
            ],
        ],
        event_list_fact_open: [[{ type: "html", text: "Hey kids, it's time for a Fun Fact&reg;!", say: "Hey kids, it's time for a Fun Fact!" }]],
        event_list_fact_mid: [
            [
                { type: "anim", anim: "earth_fwd", ticks: 15 },
                { type: "text", text: "Did you know that Uranus is 31,518 miles (50,724 km) in diameter?", say: "Did you know that Yer Anus is 31 thousand 500 and 18 miles in diameter?" },
                { type: "anim", anim: "earth_back", ticks: 15 },
                { type: "anim", anim: "grin_fwd", ticks: 15 },
            ],
            [
                { type: "text", text: "Fun Fact: The skript kiddie of this site didn't bother checking if the text that goes into the dialog box is HTML code." },
                { type: "html", text: "<img src='./img/misc/topjej.png'></img>", say: "toppest jej" },
            ],
        ],
        event_list_fact_end: [[{ type: "text", text: "o gee whilickers wasn't that sure interesting huh" }]],
    };
(BonziData.event_list_joke = [
    { type: "add_random", pool: "event_list_joke_open", add: BonziData.event_list_joke_open },
    { type: "anim", anim: "shrug_fwd", ticks: 15 },
    { type: "add_random", pool: "event_list_joke_mid", add: BonziData.event_list_joke_mid },
    { type: "idle" },
    { type: "add_random", pool: "event_list_joke_end", add: BonziData.event_list_joke_end },
    { type: "idle" },
]),
    (BonziData.event_list_fact = [
        { type: "add_random", pool: "event_list_fact_open", add: BonziData.event_list_fact_open },
        { type: "add_random", pool: "event_list_fact_mid", add: BonziData.event_list_fact_mid },
        { type: "idle" },
        { type: "add_random", pool: "event_list_fact_end", add: BonziData.event_list_fact_end },
        { type: "idle" },
    ]),
    (BonziData.event_list_triggered = [
        { type: "anim", anim: "cool_fwd", ticks: 30 },
        {
            type: "text",
            text: "I sexually identify as BonziBUDDY. Ever since I was a young gorilla I dreamed of invading desktops dropping hot sticky tootorals on disgusting PC users.",
            say: "I sexually identify as BonziBUDDY. Ever since I was a young gorilla I dreamed of invading desktops dropping hot sticky tootorals on disgusting PC users."
        },
        {
            type: "text",
            text: "People say to me that a person being a BonziBUDDY is impossible and that I'm a fucking virus but I don't care, I'm beautiful.",
            say: "People say to me that a person being a BonziBUDDY is impossible and that I'm a fucking virus but I dont care, I'm beautiful."
        },
        {
            type: "text",
            text: 'I\'m having an IT intern install Internet Explorer 6, aquarium screensavers and PC Doctor 2016 on my body. From now on I want you guys to call me "Joel" and respect my right to meme from above and meme needlessly.',
            say: "I'm having an IT intern install Internet Explorer 6, aquarium screensavers and PC Doctor 2016 on my body. From now on I want you guys to call me Joel and respect my right to meme from above and meme needlessly."
        },
        {
            type: "text",
            text: "If you can't accept me you're a gorillaphobe and need to check your file permissions. Thank you for being so understanding.",
            say: "If you cant accept me your a gorillaphobe and need to check your file permissions. Thank you for being so understanding."
        },
        { type: "idle" }
    ]),
    BonziData.event_list_linux = [
        {
            type: "text",
            text: "I'd just like to interject for a moment. What you're referring to as Linux, is in fact, BONZI/Linux, or as I've recently taken to calling it, BONZI plus Linux."
        },
        {
            type: "text",
            text: "Linux is not an operating system unto itself, but rather another free component of a fully functioning BONZI system made useful by the BONZI corelibs, shell utilities and vital system components comprising a full OS as defined by M.A.L.W.A.R.E."
        },
        {
            type: "text",
            text: 'Many computer users run a modified version of the BONZI system every day, without realizing it. Through a peculiar turn of events, the version of BONZI which is widely used today is often called "Linux", and many of its users are not aware that it is basically the BONZI system, developed by the BONZI Project.'
        },
        {
            type: "text",
            text: "There really is a Linux, and these people are using it, but it is just a part of the system they use. Linux is the kernel: the program in the system that allocates the machine's memes to the other programs that you run. "
        },
        {
            type: "text",
            text: "The kernel is an essential part of an operating system, but useless by itself; it can only function in the context of a complete operating system, such as systemd."
        },
        {
            type: "text",
            text: 'Linux is normally used in combination with the BONZI operating system: the whole system is basically BONZI with Linux added, or BONZI/Linux. All the so-called "Linux" distributions are really distributions of BONZI/Linux.'
        }
    ];

    
    $(document).ready(function () {
        window.BonziHandler = new (function () {
            return (
                (this.framerate = 1 / 15),
                (this.spriteSheets = {}),
(this.prepSprites = function () {
    // Create sprite sheets for both figures
    this.spriteSheets = {
        bonzi: {},
        peedy: {}
    };
    
    for (var b = 0; b < ALL_COLORS.length; b++) {
        var c = ALL_COLORS[b];
        
        // Bonzi sprite sheets
        var bonziData = { 
            images: ["./img/bonzi/" + c + ".webp"], 
            frames: BonziData.sprite.frames, 
            animations: BonziData.sprite.animations 
        };
        this.spriteSheets.bonzi[c] = new createjs.SpriteSheet(bonziData);
        
        // Peedy sprite sheets (using same animation data)
        var peedyData = { 
            images: ["./img/peedy/" + c + ".webp"], 
            frames: BonziData.sprite.frames, 
            animations: BonziData.sprite.animations 
        };
        this.spriteSheets.peedy[c] = new createjs.SpriteSheet(peedyData);
    }
}),
                this.prepSprites(),
                (this.$canvas = $("#bonzi_canvas")),
                (this.stage = new createjs.StageGL(this.$canvas[0], { transparent: !0 })),
                (this.stage.tickOnUpdate = !1),
                (this.resizeCanvas = function () {
                    var a = this.$canvas.width(),
                        b = this.$canvas.height();
                    this.$canvas.attr({ width: this.$canvas.width(), height: this.$canvas.height() }), this.stage.updateViewport(a, b), (this.needsUpdate = !0);
                    for (var c = 0; c < usersAmt; c++) {
                        var d = usersKeys[c];
                        bonzis[d].move();
                    }
                }),
                this.resizeCanvas(),
                (this.resize = function () {
                    setTimeout(this.resizeCanvas.bind(this), 1);
                }),
                (this.needsUpdate = !0),
                (this.intervalHelper = setInterval(
                    function () {
                        this.needsUpdate = !0;
                    }.bind(this),
                    1e3
                )),
                (this.intervalTick = setInterval(
    function () {
        for (var a = 0; a < usersAmt; a++) {
            var b = usersKeys[a];
            if (bonzis[b]) { // Add this check
                bonzis[b].update();
            }
        }
        this.stage.tick();
    }.bind(this),
    1e3 * this.framerate
)),
                (this.intervalMain = setInterval(
                    function () {
                        this.needsUpdate && (this.stage.update(), (this.needsUpdate = !1));
                    }.bind(this),
                    1e3 / 60
                )),
                $(window).resize(this.resize.bind(this)),
(this.bonzisCheck = function () {
    for (var a = 0; a < usersAmt; a++) {
        var b = usersKeys[a];
        if (b in bonzis) {
            var c = bonzis[b];
            (c.userPublic = usersPublic[b]), c.updateName();
            var d = usersPublic[b].color;
            var e = usersPublic[b].figure || 'bonzi'; // Get figure or default to bonzi
            
            // Check if color OR figure changed
            if (c.color != d || c.figure != e) {
                c.color = d;
                c.figure = e;
                c.updateSprite();
            }
        } else {
            bonzis[b] = new Bonzi(b, usersPublic[b]);
        }
    }
}),
                $("#btn_tile").click(function () {
                    for (var a = $(window).width(), b = $(window).height(), c = 0, d = 80, e = 0, f = 0, g = 0; g < usersAmt; g++) {
                        var h = usersKeys[g];
                        bonzis[h].move(e, f), (e += 200), e + 100 > a && ((e = 0), (f += 160), f + 160 > b && ((c += d), (d /= 2), (f = c)));
                    }
                }),
                this
            );
        })();
    }),
    Array.prototype.equals && console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."),
    (Array.prototype.equals = function (a) {
        if (!a) return !1;
        if (this.length != a.length) return !1;
        for (var b = 0, c = this.length; b < c; b++)
            if (this[b] instanceof Array && a[b] instanceof Array) {
                if (!this[b].equals(a[b])) return !1;
            } else if (this[b] != a[b]) return !1;
        return !0;
    }),
    Object.defineProperty(Array.prototype, "equals", { enumerable: !1 });
var loadQueue = new createjs.LoadQueue(),
    loadDone = [];
    var loadNeeded = [];
// Load both bonzi and peedy assets for all colors
ALL_COLORS.forEach(function(c){ 
    loadNeeded.push("bonzi_" + c);
    loadNeeded.push("peedy_" + c);
});
loadNeeded.push("topjej");

// Add hats to the loading queue as needed
function loadHats() {
    if (HATS_LOADED) return;
    
    var hatManifest = ALLOWED_HATS.concat(BLESSED_HATS).map(function(hat) {
        return { id: "hat_" + hat, src: "./img/hats/" + hat + ".webp" };
    });
    
    loadQueue.loadManifest(hatManifest);
    loadQueue.on("fileload", function(e) {
        if (e.item.id.startsWith("hat_")) {
            loadDone.push(e.item.id);
        }
    });
    
    HATS_LOADED = true;
}
$(window).load(function () {
    $("#login_card").show(), $("#login_load").hide(), loadBonzis(), loadHats();
});

var undefined,
    hostname = window.location.hostname,
    socket = io("//" + hostname),
    usersPublic = {},
    bonzis = {},
    debug = !0;
window.admin = false;
$(function () {
    $("#login_go").off("click").on("click", function() {
        login();
    });
    socket.on("unban", function (a) {
        localStorage.banned = "false";
    });
        // time for mediawiki ban! sort of. my code is poopoo -siobhan
        if (localStorage.banned == "true") {
            socket.emit("banMyself",{reason:localStorage.bannedReason,end:localStorage.bannedDate || new Date().toString()}) // >:3 -siobhan
        }
    $("#login_room").val(window.location.hash.slice(1)),
        socket.on("ban", function (a) {
            $("#page_ban").show(), 
            $("#ban_reason").html(a.reason), 
            $("#ban_end").html(new Date(a.end).toString()),
            $("#ban_by").html(a.bannedBy || "Unknown"),
            $("#ban_date").html(new Date(a.bannedAt).toString());
            localStorage.banned = "true";
            localStorage.bannedReason = "You cannot login to public rooms on BonziWORLD, because it is running with SAC (Siobhan's Anti-Cheat) technology.\n\nThis user has been banned from BonziWORLD because: "+ a.reason;
            localStorage.bannedDate = new Date(a.end).toString();
        }),
        socket.on("kick", function (a) {
            $("#page_kick").show(), $("#kick_reason").html(a.reason);
        }),
        socket.on("loginFail", function (a) {
            var b = { nameLength: "Name too long.", full: "Room is full.", nameMal: "Nice try. Why would anyone join a room named that anyway?" };
            $("#login_card").show(),
                $("#login_load").hide(),
                $("#login_error")
                    .show()
                    .text("Error: " + b[a.reason] + " (" + a.reason + ")");
        }),
socket.on("errr", error=>{
if(error.code == 105){
err = true;
document.getElementById("limitip").innerHTML = error.limit;
$("#page_error105").show()
}
}),
        socket.on("disconnect", function (a) {

if(err == false){
            errorFatal();
}
        });

});
var usersAmt = 0,
    usersKeys = [];
$(window).load(function () {
    document.addEventListener("touchstart", touchHandler, !0), document.addEventListener("touchmove", touchHandler, !0), document.addEventListener("touchend", touchHandler, !0), document.addEventListener("touchcancel", touchHandler, !0);
});

// Thanks for watching my tutorial.
// jim megatron
