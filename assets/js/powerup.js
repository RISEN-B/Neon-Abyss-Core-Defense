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
 * 道具类 - 可拾取的强化物品
 */

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; 
        this.radius = 12; 
        this.angle = 0;
        this.spinSpeed = 0.05;
        
        // 道具生命周期：30秒（1800帧@60FPS）
        this.lifeTime = 1800;
        this.maxLifeTime = 1800;
        this.alpha = 1;
        
        if (type === 'HEALTH') { 
            this.color = '#00ff00'; 
            this.symbol = '+'; 
        } else if (type === 'COUNT') { 
            this.color = '#00ffcc'; 
            this.symbol = '<<>'; 
        } else if (type === 'SIZE') { 
            this.color = '#ffaa00'; 
            this.symbol = 'O>'; 
        } else if (type === 'DAMAGE') { 
            this.color = '#ff0055'; 
            this.symbol = '>>>'; 
        } else if (type === 'RATE') { 
            this.color = '#cc00ff'; 
            this.symbol = 'SSS'; 
        } else if (type === 'ORBIT') {
            this.color = '#00FFFF';
            this.symbol = '◎';
        } else {
            this.color = '#fff';
            this.symbol = '?';
        }
    }

    update() { 
        this.angle += this.spinSpeed;
        this.lifeTime--;
        
        if (this.lifeTime < 300) {
            this.alpha = this.lifeTime / 300;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.restore();
    }
}
