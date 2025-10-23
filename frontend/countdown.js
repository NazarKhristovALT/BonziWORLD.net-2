// countdown.js - Global Countdown Timer with Visual Effects
"use strict";

class CountdownTimer {
    constructor() {
        this.totalSeconds = 0 * 0 * 30; // 24 hours in seconds
        this.interval = null;
        this.isRunning = false;
        this.timerElement = null;
        this.debrisElements = [];
        this.shakeIntensity = 0;
        this.maxShakeIntensity = 20;
        
        this.init();
    }

    init() {
        this.createTimerElement();
        this.startTimer();
        this.applyContextMenuStyles();
    }

    createTimerElement() {
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'global_countdown';
        this.timerElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-family: "Comic Sans MS", cursive, sans-serif;
            font-size: 50px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 10000;
            pointer-events: none;
            text-align: center;
            background: rgba(69, 32, 102, 0.7);
            padding: 10px 20px;
            border-radius: 10px;
            border: 3px solid #9062AF;
        `;
        
        this.updateDisplay();
        document.body.appendChild(this.timerElement);
    }

    startTimer() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.isRunning = true;
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        if (this.totalSeconds <= 0) {
            this.endTimer();
            return;
        }

        this.totalSeconds--;
        this.updateDisplay();
        this.updateEffects();
    }

    updateDisplay() {
        const hours = Math.floor(this.totalSeconds / 3600);
        const minutes = Math.floor((this.totalSeconds % 3600) / 60);
        const seconds = this.totalSeconds % 60;

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerElement.textContent = timeString;

        // Change color based on time remaining
        if (this.totalSeconds < 3600) { // Less than 1 hour
            this.timerElement.style.color = '#ff6b6b';
            this.timerElement.style.textShadow = '2px 2px 4px rgba(255,0,0,0.5)';
        } else if (this.totalSeconds < 7200) { // Less than 2 hours
            this.timerElement.style.color = '#ffa500';
        }
    }

    updateEffects() {
        const progress = 1 - (this.totalSeconds / (24 * 60 * 60));
        
        // Calculate shake intensity based on time remaining
        this.shakeIntensity = progress * this.maxShakeIntensity;
        
        // Start debris effect when less than 30 minutes remain
        if (this.totalSeconds < 1800 && this.totalSeconds % 5 === 0) {
            this.createDebris();
        }

        this.applyShake();
    }

    applyShake() {
        if (this.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            
            document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            
            // Reset transform after a short delay to create shake effect
            setTimeout(() => {
                document.body.style.transform = 'translate(0, 0)';
            }, 50);
        }
    }

    createDebris() {
        const debrisCount = Math.floor(this.shakeIntensity / 2) + 1;
        
        for (let i = 0; i < debrisCount; i++) {
            const debris = document.createElement('div');
            debris.className = 'debris';
            debris.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                background-image: url('./img/debris.png');
                background-size: contain;
                background-repeat: no-repeat;
                pointer-events: none;
                z-index: 9999;
                top: ${Math.random() * 100}px;
                left: ${Math.random() * window.innerWidth}px;
                transform: rotate(${Math.random() * 360}deg);
            `;

            document.body.appendChild(debris);
            this.debrisElements.push(debris);

            // Animate debris falling with rotation and trail
            this.animateDebris(debris);
        }

        // Clean up old debris
        this.cleanupDebris();
    }

    animateDebris(debris) {
        const startX = parseFloat(debris.style.left);
        const startY = parseFloat(debris.style.top);
        const rotationSpeed = (Math.random() * 10) + 5;
        const fallSpeed = (Math.random() * 5) + 2;
        const horizontalDrift = (Math.random() - 0.5) * 4;
        
        let rotation = 0;
        let opacity = 1;
        const trailInterval = 100; // ms between trail particles

        const fallInterval = setInterval(() => {
            const currentY = parseFloat(debris.style.top) || startY;
            const currentX = parseFloat(debris.style.left) || startX;
            
            rotation += rotationSpeed;
            opacity -= 0.02;
            
            debris.style.top = (currentY + fallSpeed) + 'px';
            debris.style.left = (currentX + horizontalDrift) + 'px';
            debris.style.transform = `rotate(${rotation}deg)`;
            debris.style.opacity = opacity;
            
            // Create trail effect occasionally
            if (Math.random() < 0.3) {
                this.createTrail(currentX, currentY, opacity);
            }

            // Remove debris when it goes off screen or becomes invisible
            if (currentY > window.innerHeight || opacity <= 0) {
                clearInterval(fallInterval);
                if (debris.parentNode) {
                    debris.parentNode.removeChild(debris);
                }
                this.debrisElements = this.debrisElements.filter(d => d !== debris);
            }
        }, 50);
    }

    createTrail(x, y, opacity) {
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, ${opacity * 0.5});
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            top: ${y}px;
            left: ${x}px;
        `;

        document.body.appendChild(trail);

        // Fade out trail
        setTimeout(() => {
            trail.style.transition = 'opacity 1s ease';
            trail.style.opacity = '0';
            setTimeout(() => {
                if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                }
            }, 1000);
        }, 100);
    }

    cleanupDebris() {
        // Keep only recent debris elements
        if (this.debrisElements.length > 50) {
            const toRemove = this.debrisElements.splice(0, 20);
            toRemove.forEach(debris => {
                if (debris.parentNode) {
                    debris.parentNode.removeChild(debris);
                }
            });
        }
    }

    applyContextMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .context-menu-list {
                background: #452066 !important;
                border: 2px solid #9062AF !important;
                animation: alarm-pulse 1s infinite alternate;
            }
            
            .context-menu-item {
                background-color: #452066 !important;
                color: white !important;
            }
            
            .context-menu-item.context-menu-hover {
                background-color: #9062AF !important;
                color: white !important;
            }
            
            .context-menu-item.context-menu-disabled {
                background-color: #352056 !important;
                color: #aaa !important;
            }
            
            @keyframes alarm-pulse {
                0% {
                    box-shadow: 0 0 5px #9062AF;
                }
                100% {
                    box-shadow: 0 0 20px #9062AF, 0 0 30px #ff6b6b;
                }
            }
            
            .debris {
                transition: transform 0.1s linear, opacity 0.5s ease;
            }
        `;
        document.head.appendChild(style);
    }

    endTimer() {
        clearInterval(this.interval);
        this.isRunning = false;
        
        // Final effects
        this.timerElement.textContent = '00:00:00';
        this.timerElement.style.color = '#ff0000';
        this.timerElement.style.animation = 'final-flash 0.5s infinite alternate';
        
        // Add final flash animation
        const finalStyle = document.createElement('style');
        finalStyle.textContent = `
            @keyframes final-flash {
                0% { background-color: rgba(255, 0, 0, 0.7); }
                100% { background-color: rgba(255, 0, 0, 0.3); }
            }
        `;
        document.head.appendChild(finalStyle);
        
        // Create massive debris shower
        for (let i = 0; i < 50; i++) {
            setTimeout(() => this.createDebris(), i * 100);
        }
        
        // Intense shaking
        this.shakeIntensity = this.maxShakeIntensity * 2;
        setInterval(() => this.applyShake(), 100);
    }

    // Public methods to control the timer
    setTime(hours, minutes, seconds) {
        this.totalSeconds = hours * 3600 + minutes * 60 + seconds;
        this.updateDisplay();
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.interval);
            this.isRunning = false;
        }
    }

    resume() {
        if (!this.isRunning) {
            this.startTimer();
        }
    }

    reset() {
        this.pause();
        this.totalSeconds = 24 * 60 * 60;
        this.shakeIntensity = 0;
        this.updateDisplay();
        document.body.style.transform = 'translate(0, 0)';
        
        // Remove all debris
        this.debrisElements.forEach(debris => {
            if (debris.parentNode) {
                debris.parentNode.removeChild(debris);
            }
        });
        this.debrisElements = [];
    }
}

// Initialize the countdown timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.countdownTimer = new CountdownTimer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CountdownTimer;
}