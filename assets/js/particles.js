/**
 * Neon Abyss: Core Defense
 * GitHub: https://github.com/RISEN-B/Neon-Abyss-Core-Defense
 *
 * Copyright (C) 2026  RISEN-B
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * 粒子系统类 - 爆炸、特效等视觉效果
 */

class Particle {
    constructor(x, y, color, velocity) {
        this.x = x; 
        this.y = y; 
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.friction = 0.96;
        this.life = 1.0;
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life -= 0.02;
        this.alpha = Math.max(0, this.life);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, random(1.5, 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * 浮动文字类 - 显示伤害值、升级提示等
 */

class FloatingText {
    constructor(x, y, text, color, isUltraCrit = false) {
        this.x = x; 
        this.y = y; 
        this.text = text;
        this.color = color || '#fff';
        this.alpha = 1;
        this.velocity = -1;
        
        this.isUltraCrit = isUltraCrit;
        if (isUltraCrit) {
            this.velocity = 0;
            this.lifeTime = 120;
            this.rainbowHue = 0;
        }
    }

    update() {
        if (this.isUltraCrit) {
            this.lifeTime--;
            this.rainbowHue = (this.rainbowHue + 5) % 360;
            if (this.lifeTime < 30) {
                this.alpha = this.lifeTime / 30;
            }
        } else {
            this.y += this.velocity;
            this.alpha -= 0.02;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        if (this.isUltraCrit) {
            const rainbowColor = `hsl(${this.rainbowHue}, 100%, 60%)`;
            ctx.fillStyle = rainbowColor;
            ctx.font = 'bold 24px Orbitron';
            ctx.shadowColor = rainbowColor;
            ctx.shadowBlur = 20;
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 14px Orbitron';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.fillText(this.text, this.x, this.y);
        }
        
        ctx.restore();
    }
}

/**
 * 背景粒子类 - 营造氛围的流星效果
 */

class BackgroundParticle {
    constructor() { 
        this.reset(); 
        this.y = random(0, canvas.height); 
    }
    
    reset() {
        this.x = random(0, canvas.width);
        this.y = -10;
        this.size = random(1, 3);
        this.speed = random(3, 6);
        this.opacity = random(0.1, 0.3);
        this.color = random(0, 1) > 0.9 ? '#00ffcc' : '#ff0055';
    }
    
    update() { 
        this.y += this.speed + (difficultyMultiplier * 1.5); 
        if (this.y > canvas.height) this.reset(); 
    }
    
    draw() {
        ctx.fillStyle = `rgba(${this.color === '#00ffcc' ? '0, 255, 204' : '255, 0, 85'}, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size * 4);
    }
}
