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
 * 玩家类 - 控制主角的所有行为
 * 包括移动、射击、道具拾取和升级
 */

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#00ffcc';
        this.speed = 6.5;
        this.hp = 100;
        this.maxHp = 100;
        this.angle = 0;
        this.shootTimer = 0;
        this.pickupRange = 80; 
        this.invulnerable = 0;

        // Weapon Stats - 所有属性独立累加,不互相替换
        this.shotCount = 1;           // 子弹数量(散弹)
        this.bulletSizeLevel = 0;     // 子弹大小等级(0-69,共70级)
        this.shootRate = 12;          // 射速(越小越快)
        this.baseDamage = 10;         // 基础伤害（固定不变）
        this.powerupCount = 0;        // 吃到的道具总数（每个道具+1最终伤害）
        this.laserLevel = 0;          // 激光等级(0-69,影响颜色和威力)
        this.velocity = 20;           // 子弹速度
        this.orbitBulletCount = 0;    // 吃到的ORBIT道具数量（每个+1旋转子弹伤害）
        
        // 环绕子弹系统
        this.orbitBullets = [];       // 环绕子弹数组 [{angle, distance, damage}]
    }
    
    /**
     * 根据子弹大小等级计算实际像素值
     * @returns {number} 子弹半径(像素)
     */
    get bulletSize() {
        const maxPx = Math.floor(this.radius * LIMITS.MAX_BULLET_SIZE_RATIO);
        const minPx = 5;
        const range = maxPx - minPx;
        
        // 70个等级，从minPx线性增长到maxPx
        const level = Math.min(this.bulletSizeLevel, 69);
        return minPx + Math.floor((level / 69) * range);
    }

    update() {
        // 演示模式下的AI控制
        if (isDemoMode) {
            this.demoAIControl();
        } else {
            // 正常模式的玩家控制
            let dx = 0, dy = 0;
            if (keys.w) dy -= this.speed;
            if (keys.s) dy += this.speed;
            if (keys.a) dx -= this.speed;
            if (keys.d) dx += this.speed;
            if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

            this.x += dx;
            this.y += dy;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

            this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

            if (this.shootTimer > 0) this.shootTimer--;
            
            if (mouse.isDown && this.shootTimer <= 0) {
                this.shoot();
                audioManager.playShoot();
                this.shootTimer = this.shootRate;
            }
        }

        if (this.invulnerable > 0) this.invulnerable--;
        this.handlePickups();
    }

    /**
     * 演示模式AI控制逻辑 - 优化版 v2
     * 优先级：躲避危险(敌人+子弹) > 拾取道具 > 攻击敌人 > 保持中心位置
     */
    demoAIControl() {
        // 1. 扫描周围环境
        const nearbyEnemies = [];
        const nearbyBullets = [];
        const nearbyPowerups = [];
        let nearestEnemy = null;
        let minEnemyDist = Infinity;
        
        // 扫描敌人
        enemies.forEach(enemy => {
            const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
            if (dist < minEnemyDist) {
                minEnemyDist = dist;
                nearestEnemy = enemy;
            }
            // 记录危险区域内的敌人
            if (dist < 200) {
                nearbyEnemies.push({ enemy, dist });
            }
        });
        
        // 扫描敌人子弹（新增）
        enemyProjectiles.forEach(bullet => {
            const dist = getDistance(this.x, this.y, bullet.x, bullet.y);
            // 检测即将到来的子弹（考虑子弹速度）
            const predictedDist = dist - 10; // 预测下一帧的距离
            if (predictedDist < 80) { // 子弹威胁范围
                nearbyBullets.push({ bullet, dist: predictedDist });
            }
        });
        
        // 扫描道具（扩大检测范围）
        powerups.forEach(powerup => {
            const dist = getDistance(this.x, this.y, powerup.x, powerup.y);
            if (dist < this.pickupRange + 100) { // 扩大到180像素
                nearbyPowerups.push({ powerup, dist });
            }
        });
        
        // 2. 计算移动向量
        let moveX = 0;
        let moveY = 0;
        let priority = 'idle';
        
        // 优先级1: 紧急躲避敌人子弹（最高优先级）
        if (nearbyBullets.length > 0) {
            priority = 'evade_bullets';
            nearbyBullets.forEach(threat => {
                const angle = Math.atan2(this.y - threat.bullet.y, this.x - threat.bullet.x);
                const urgency = (80 - threat.dist) / 80; // 越近越紧急
                moveX += Math.cos(angle) * urgency * 4;
                moveY += Math.sin(angle) * urgency * 4;
            });
        }
        // 优先级2: 紧急躲避敌人（<100像素）
        else {
            const criticalThreats = nearbyEnemies.filter(e => e.dist < 100);
            if (criticalThreats.length > 0) {
                priority = 'evade_critical';
                criticalThreats.forEach(threat => {
                    const angle = Math.atan2(this.y - threat.enemy.y, this.x - threat.enemy.x);
                    const urgency = (100 - threat.dist) / 100;
                    moveX += Math.cos(angle) * urgency * 3;
                    moveY += Math.sin(angle) * urgency * 3;
                });
            }
            // 优先级3: 一般躲避敌人（100-200像素）
            else if (nearbyEnemies.length > 0) {
                priority = 'evade_normal';
                nearbyEnemies.forEach(threat => {
                    const angle = Math.atan2(this.y - threat.enemy.y, this.x - threat.enemy.x);
                    const weight = 1 / (threat.dist * threat.dist);
                    moveX += Math.cos(angle) * weight * 100;
                    moveY += Math.sin(angle) * weight * 100;
                });
            }
            // 优先级4: 拾取道具
            else if (nearbyPowerups.length > 0) {
                priority = 'pickup';
                // 选择最近的道具
                nearbyPowerups.sort((a, b) => a.dist - b.dist);
                const target = nearbyPowerups[0].powerup;
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                moveX = Math.cos(angle);
                moveY = Math.sin(angle);
            }
            // 优先级5: 向中心靠拢
            else {
                priority = 'center';
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const distToCenter = getDistance(this.x, this.y, centerX, centerY);
                
                if (distToCenter > 80) {
                    const angle = Math.atan2(centerY - this.y, centerX - this.x);
                    moveX = Math.cos(angle) * 0.5;
                    moveY = Math.sin(angle) * 0.5;
                }
            }
        }
        
        // 3. 应用移动（平滑处理）
        if (moveX !== 0 || moveY !== 0) {
            // 归一化并应用速度
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            if (len > 0) {
                moveX = (moveX / len) * this.speed;
                moveY = (moveY / len) * this.speed;
                
                this.x += moveX;
                this.y += moveY;
                
                // 边界限制
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
            }
        }
        
        // 4. 瞄准和射击逻辑
        if (nearestEnemy && minEnemyDist < 400) {
            // 瞄准最近的敌人
            this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            
            // 自动射击
            if (this.shootTimer > 0) this.shootTimer--;
            
            if (this.shootTimer <= 0) {
                this.shoot();
                audioManager.playShoot();
                this.shootTimer = this.shootRate;
            }
        } else {
            // 没有威胁时缓慢旋转观察四周
            this.angle += 0.02;
        }
        
        // 调试信息（可选，控制台查看AI决策）
        // console.log('AI:', priority, '| Enemies:', nearbyEnemies.length, '| Bullets:', nearbyBullets.length, '| Powerups:', nearbyPowerups.length);
    }

    // 核心射击逻辑
    shoot() {
        const startAngle = this.angle;
        const count = this.shotCount;
        const realLaserLevel = this.laserLevel;
        
        // 计算飞船头部的偏移量
        // SVG大小为radius*3.5，飞船头部距离中心约 radius*1.75
        // 我们使用 radius*2.0 确保子弹从头部前方射出
        const shipNoseOffset = this.radius * 2.0;
        
        if (count > 1) {
            // 散弹模式:扇形扩散
            const totalSpread = Math.PI / 2;
            const step = totalSpread / count;
            
            for(let i = 0; i < count; i++) {
                const spreadOffset = (i * step) - (totalSpread / 2) + (step / 2);
                const randomSpread = (Math.random() - 0.5) * 0.17;
                const bulletAngle = startAngle + spreadOffset + randomSpread;
                
                // 子弹从飞船头部射出
                const offsetX = Math.cos(bulletAngle) * shipNoseOffset;
                const offsetY = Math.sin(bulletAngle) * shipNoseOffset;
                
                if (projectiles.length < MAX_BULLETS) {
                    projectiles.push(new Projectile(
                        this.x + offsetX, 
                        this.y + offsetY, 
                        bulletAngle,
                        this,
                        realLaserLevel
                    ));
                }
            }
        } else {
            // 单发模式:直线射击
            const randomSpread = (Math.random() - 0.5) * 0.087;
            const bulletAngle = startAngle + randomSpread;
            
            // 子弹从飞船头部射出
            const offsetX = Math.cos(bulletAngle) * shipNoseOffset;
            const offsetY = Math.sin(bulletAngle) * shipNoseOffset;
            
            if (projectiles.length < MAX_BULLETS) {
                projectiles.push(new Projectile(
                    this.x + offsetX, 
                    this.y + offsetY, 
                    bulletAngle,
                    this,
                    realLaserLevel
                ));
            }
        }
        
        // 后坐力视觉效果 - 也从头部位置
        this.angle += 0.05; 
        createExplosion(
            this.x + Math.cos(this.angle) * shipNoseOffset, 
            this.y + Math.sin(this.angle) * shipNoseOffset, 
            getLaserColor(this.laserLevel), 
            2
        );
    }

    handlePickups() {
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            const dist = getDistance(this.x, this.y, p.x, p.y);
            
            if (dist < this.pickupRange) {
                p.x += (this.x - p.x) * 0.15;
                p.y += (this.y - p.y) * 0.15;
                
                if (dist < this.radius + p.radius) {
                    try {
                        this.applyPowerup(p);
                        healthTextEl.innerText = `${Math.floor(this.hp)} / ${this.maxHp}`;
                    } catch (e) {
                        console.error("Powerup error:", e);
                    }
                    powerups.splice(i, 1);
                }
            }
        }
    }

    upgrade(type) {
        let oldName = this.getWeaponName();
        
        if (type === 'COUNT') {
            if (this.shotCount < LIMITS.MAX_BULLETS_COUNT) {
                this.shotCount++;
            }
        } else if (type === 'SIZE') {
            // 子弹大小等级上限69级（共70级：0-69）
            if (this.bulletSizeLevel < 69) {
                this.bulletSizeLevel++;
            }
        } else if (type === 'DAMAGE') {
            this.laserLevel++;
        } else if (type === 'RATE') {
            if (this.shootRate > LIMITS.MIN_SHOOT_RATE) {
                this.shootRate--;
            }
        }

        floatingTexts.push(new FloatingText(this.x, this.y - 30, "UPGRADED!", this.currentColor));
        createExplosion(this.x, this.y, this.currentColor, 15);
        audioManager.playUpgrade();
        this.updateWeaponUI(oldName);
    }

    get currentColor() {
        return getLaserColor(this.laserLevel);
    }

    getWeaponName() {
        const parts = [];
        
        if (this.laserLevel > 0) {
            parts.push("LASER");
        } else {
            parts.push("PISTOL");
        }
        
        if (this.shotCount > 1) {
            parts.push("SPREAD");
        }
        
        if (this.shootRate < 12) {
            parts.push("FAST");
        }
        
        if (this.bulletSizeLevel > 0) {
            parts.push("BIG");
        }
        
        return parts.join(" ");
    }

    updateWeaponUI(oldName) {
        const currentName = this.getWeaponName();
        const color = this.currentColor;
        weaponNameEl.innerText = currentName;
        weaponNameEl.style.color = color;
        multValEl.innerText = `LVL ${this.laserLevel} | COUNT ${this.shotCount}`;
        multValEl.style.color = color;
        
        const calculatedDamage = Math.floor(this.baseDamage * (1 + this.laserLevel * 0.8));
        const totalDamage = calculatedDamage + this.powerupCount;
        damageValEl.innerText = totalDamage;
        damageValEl.style.color = color;
        
        healthTextEl.innerText = `${Math.floor(this.hp)} / ${this.maxHp}`;
    }

    applyPowerup(p) {
        if (!p || !p.type) return; 
        
        // 每吃一个道具（包括血包），攻击力+1
        this.powerupCount += 1;
        totalPowerupsCollected++;
        powerupsValEl.innerText = totalPowerupsCollected;
        
        // 检查成就
        checkAchievements();
        
        if (p.type === 'HEALTH') {
            this.maxHp += 1;
            this.hp = Math.min(this.maxHp, this.hp + 25);
            healthBarEl.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
            healthTextEl.innerText = `${Math.floor(this.hp)} / ${this.maxHp}`;
            audioManager.playHeal();
            floatingTexts.push(new FloatingText(this.x, this.y - 20, "+25 HP", "#00ff00"));
            createExplosion(this.x, this.y, '#00ff00', 8);
        } else if (p.type === 'COUNT') {
            this.upgrade('COUNT');
        } else if (p.type === 'SIZE') {
            this.upgrade('SIZE');
        } else if (p.type === 'DAMAGE') {
            this.upgrade('DAMAGE');
        } else if (p.type === 'RATE') {
            this.upgrade('RATE');
        } else if (p.type === 'ORBIT') {
            this.addOrbitBullet();
        }
    }
    
    addOrbitBullet() {
        const maxOrbitBullets = 50;
        if (this.orbitBullets.length >= maxOrbitBullets) {
            floatingTexts.push(new FloatingText(this.x, this.y - 30, "ORBIT MAX!", "#FF0000"));
            return;
        }
        
        // 增加ORBIT道具计数
        this.orbitBulletCount++;
        
        const count = this.orbitBullets.length;
        const angle = (Math.PI * 2 / Math.max(count + 1, 1)) * count;
        
        const maxDistance = 120;
        const maxRadius = 10;
        
        // 新的伤害计算公式：基础伤害的10% + ORBIT道具数量
        const totalDamage = Math.floor(this.baseDamage * (1 + this.laserLevel * 0.8)) + this.powerupCount;
        const orbitDamage = Math.max(1, Math.floor(totalDamage / 10)) + this.orbitBulletCount;
        
        this.orbitBullets.push({
            angle: angle,
            distance: Math.min(50 + count * 5, maxDistance),
            damage: orbitDamage,
            radius: Math.min(6 + count * 0.3, maxRadius),
            damageCooldown: 0  // 伤害冷却计时器（帧数）
        });
        
        audioManager.playUpgrade();
        floatingTexts.push(new FloatingText(this.x, this.y - 30, `ORBIT ${this.orbitBullets.length}`, "#00FFFF"));
        createExplosion(this.x, this.y, '#00FFFF', 10);
    }

    draw() {
        // 绘制护盾效果（无敌时）
        if (this.invulnerable > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 护盾光环
            const shieldAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            const gradient = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius * 2.5);
            gradient.addColorStop(0, `rgba(0, 255, 204, ${shieldAlpha})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 204, ${shieldAlpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 护盾边缘
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 204, ${shieldAlpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffcc';
            ctx.stroke();
            
            ctx.restore();
        }
        
        // 绘制玩家本体（受无敌状态影响）
        if (!(this.invulnerable > 0 && Math.floor(Date.now() / 50) % 2 === 0)) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // SVG飞船默认朝上（-Y方向），需要旋转+90度使其朝右（+X方向），再加上玩家的瞄准角度
            ctx.rotate(this.angle + Math.PI / 2);

            // 绘制SVG飞船图像 - 增大大小
            const svgSize = this.radius * 3.5; // 增大为半径的3.5倍
            const offsetX = -svgSize / 2;
            const offsetY = -svgSize / 2;
            
            // 应用激光等级的颜色效果
            ctx.shadowBlur = 15 + (this.laserLevel * 0.5);
            ctx.shadowColor = getLaserColor(this.laserLevel);
            
            // 绘制SVG图像-使用离屏画布缓存避免Safari滤镜白边
            if (playerSvg.complete) {
                if (!this._svgCache) {
                    const cacheSize = Math.ceil(svgSize);
                    this._svgCache = document.createElement('canvas');
                    this._svgCache.width = cacheSize;
                    this._svgCache.height = cacheSize;
                    this._svgCacheSize = svgSize;
                    const cacheCtx = this._svgCache.getContext('2d');
                    cacheCtx.drawImage(playerSvg, 0, 0, svgSize, svgSize);
                }
                ctx.drawImage(this._svgCache, offsetX, offsetY, this._svgCacheSize, this._svgCacheSize);
            } else {
                // 如果SVG未加载完成，使用备用圆形
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = getLaserColor(this.laserLevel);
                ctx.fill();
            }
            
            // 绘制拾取范围圆圈
            ctx.beginPath();
            ctx.arc(0, 0, this.pickupRange, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }
        
        // 绘制环绕子弹（不受无敌状态影响，始终显示）
        this.orbitBullets.forEach((bullet, index) => {
            bullet.angle += 0.03 + (index * 0.005);
            
            const x = this.x + Math.cos(bullet.angle) * bullet.distance;
            const y = this.y + Math.sin(bullet.angle) * bullet.distance;
            
            ctx.beginPath();
            ctx.arc(x, y, bullet.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00FFFF';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00FFFF';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, y, bullet.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        });
    }
}