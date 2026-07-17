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
 * 敌人类 - 包含普通、射击和巨大三种敌人类型
 */

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        if (type === 'giant') {
            this.radius = (18 + Math.random() * 10) * 2;
            this.color = '#FF0000';
            this.hp = this.radius * 2.5 * difficultyMultiplier * 20;
            this.maxHp = this.hp;
            this.speed = 1.0;
            this.svgImage = enemyGiantSvg;
        } else if (type === 'shooter') {
            this.radius = 18 + Math.random() * 10;
            this.color = '#FFAA00';
            this.hp = this.radius * 2.5 * difficultyMultiplier;
            this.maxHp = this.hp;
            this.speed = 1.5;
            this.shootTimer = 0;
            this.shootInterval = 60;
            this.svgImage = enemyShooterSvg;
        } else {
            this.radius = 18 + Math.random() * 10; 
            // 随机颜色：紫色到粉色范围
            const hue = (300 + Math.random() * 60) % 360;
            this.color = `hsl(${hue}, 100%, 50%)`;
            this.hp = this.radius * 2.5 * difficultyMultiplier;
            this.maxHp = this.hp;
            this.speed = 1.2 + Math.random() * 1.0 + (difficultyMultiplier * 0.15);
            
            // 随机选择一个配色版本的SVG
            const randomIndex = Math.floor(Math.random() * enemyNormalSvgImages.length);
            this.svgImage = enemyNormalSvgImages[randomIndex];
        }
        
        if (this.type !== 'giant') {
            this.speed = Math.min(this.speed, 5.5);
        }
        
        this.angle = 0;
        this.spinSpeed = Math.random() * 0.1 - 0.05;
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.angle += this.spinSpeed;
        
        if (this.type === 'shooter') {
            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval) {
                this.shoot();
                this.shootTimer = 0;
            }
        }
    }
    
    shoot() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        enemyProjectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            radius: 6,
            color: '#FFAA00',
            life: 180
        });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // 计算SVG绘制尺寸（根据敌人半径动态调整）
        let svgSize;
        if (this.type === 'giant') {
            svgSize = this.radius * 2.2; // 巨大敌人稍小一点，因为SVG本身较大
        } else {
            svgSize = this.radius * 2.5;
        }
        
        const offsetX = -svgSize / 2;
        const offsetY = -svgSize / 2;
        
        // 使用离屏画布缓存SVG渲染结果，避免Safari滤镜合成白边问题
        if (this.svgImage && this.svgImage.complete) {
            if (!this._svgCache) {
                this._svgCache = document.createElement('canvas');
                this._svgCache.width = Math.ceil(svgSize);
                this._svgCache.height = Math.ceil(svgSize);
                this._svgCacheSize = svgSize;
                const cacheCtx = this._svgCache.getContext('2d');
                cacheCtx.drawImage(this.svgImage, 0, 0, svgSize, svgSize);
            }
            ctx.drawImage(this._svgCache, offsetX, offsetY, this._svgCacheSize, this._svgCacheSize);
        } else {
            // 降级方案：如果SVG未加载，使用原来的多边形绘制
            ctx.beginPath();
            const sides = this.type === 'giant' ? 8 : 6;
            for (let i = 0; i < sides; i++) {
                const a = (i * 2 * Math.PI) / sides;
                ctx.lineTo(this.radius * Math.cos(a), this.radius * Math.sin(a));
            }
            ctx.closePath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.stroke();
        }
        
        // 恢复旋转以绘制不旋转的血量文字
        ctx.restore();
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 在敌人中心显示血量（黑色背景上显示白色数字）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(10, this.radius * 0.5)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000000';
        ctx.fillText(Math.floor(this.hp), 0, 0);
        
        // 血条（保持在敌人上方）
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(-20, -this.radius - 8, 40, 4);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(-20, -this.radius - 8, 40 * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }
}
