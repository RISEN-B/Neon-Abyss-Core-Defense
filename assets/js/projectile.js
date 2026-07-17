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
 * 子弹类 - 玩家发射的投射物
 */

class Projectile {
    constructor(x, y, angle, playerStats, realLaserLevel) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = playerStats.bulletSize; 
        this.color = getLaserColor(realLaserLevel);
        
        // 计算伤害：(基础伤害 × 激光等级倍率) + 道具数量
        let calculatedDamage = playerStats.baseDamage * (1 + realLaserLevel * 0.8);
        
        // 1. 先应用浮动系数：±15% 随机波动
        const fluctuation = 0.85 + Math.random() * 0.3;
        calculatedDamage *= fluctuation;
        
        // 2. 暴击系统
        const critRoll = Math.random();
        let critMultiplier = 1;
        let isCrit = false;
        
        if (critRoll < 0.02) {
            critMultiplier = 10;
            isCrit = true;
        } else if (critRoll < 0.06) {
            critMultiplier = 8;
            isCrit = true;
        } else if (critRoll < 0.12) {
            critMultiplier = 6;
            isCrit = true;
        } else if (critRoll < 0.20) {
            critMultiplier = 4;
            isCrit = true;
        } else if (critRoll < 0.32) {
            critMultiplier = 2;
            isCrit = true;
        }
        
        calculatedDamage *= critMultiplier;
        calculatedDamage += playerStats.powerupCount;
        
        this.damage = Math.floor(calculatedDamage);
        this.isCrit = isCrit;
        this.critMultiplier = critMultiplier;
            
        this.velocity = {
            x: Math.cos(angle) * playerStats.velocity,
            y: Math.sin(angle) * playerStats.velocity
        };
        this.life = 120;
        this.trail = [];
    }

    update() {
        this.trail.push({x: this.x, y: this.y, alpha: 1});
        if (this.trail.length > 6) this.trail.shift();
        else this.trail[0].alpha -= 0.15;

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
    }

    draw() {
        this.trail.forEach(t => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(this.color)}, ${t.alpha * 0.5})`;
            ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
    }
}
