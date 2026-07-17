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
 * 游戏主循环 - 核心游戏逻辑
 */

function animate() {
    if (!gameRunning || isPaused) return;
    
    ctx.fillStyle = 'rgba(2, 2, 5, 0.4)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let shakeX = 0, shakeY = 0;
    if (shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.5) shakeIntensity = 0;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 更新背景
    bgParticles.forEach(p => { p.update(); p.draw(); });

    // 更新玩家
    player.update();
    player.draw();

    // 更新子弹
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw();
        if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) {
            projectiles.splice(i, 1);
        }
    }

    // 更新敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();

        // 敌人与玩家碰撞
        if (getDistance(player.x, player.y, enemy.x, enemy.y) < player.radius + enemy.radius) {
            if (player.invulnerable <= 0) {
                player.hp -= 15;
                player.invulnerable = 40;
                triggerShake(15);
                createExplosion(player.x, player.y, '#ff0000', 20);
                
                if (enemy.type !== 'giant') {
                    enemies.splice(i, 1);
                }
                
                healthBarEl.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
                healthTextEl.innerText = `${Math.floor(player.hp)} / ${player.maxHp}`;
                audioManager.playPlayerHurt();
                if (player.hp <= 0) gameOver();
            }
        }

        // 子弹与敌人碰撞
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const proj = projectiles[j];
            if (getDistance(proj.x, proj.y, enemy.x, enemy.y) < proj.radius + enemy.radius) {
                enemy.hp -= proj.damage;
                
                const explosionCount = proj.isCrit ? 8 : 2;
                createExplosion(enemy.x, enemy.y, '#fff', explosionCount); 
                
                let damageColor = '#FFFFFF';
                let damageText = Math.floor(proj.damage).toString();
                let isUltraCrit = false;
                
                if (proj.isCrit) {
                    if (proj.critMultiplier >= 10) {
                        isUltraCrit = true;
                        triggerShake(10);
                        createExplosion(enemy.x, enemy.y, '#FFD700', 15);
                    } else if (proj.critMultiplier >= 8) {
                        damageColor = '#FF0000';
                        triggerShake(5);
                    } else if (proj.critMultiplier >= 6) {
                        damageColor = '#FFD700';
                        triggerShake(5);
                    } else if (proj.critMultiplier >= 4) {
                        damageColor = '#FFD700';
                    } else {
                        damageColor = '#FFA500';
                    }
                }

                floatingTexts.push(new FloatingText(
                    enemy.x + (Math.random() - 0.5) * 20, 
                    enemy.y - 10, 
                    damageText, 
                    damageColor,
                    isUltraCrit
                ));
                
                if (enemy.hp <= 0) {
                    score += 10;
                    enemiesKilled++;
                    scoreValEl.innerText = score;
                    
                    // 特殊敌人生成标记（仅用于单次触发）
                    if (enemiesKilled % 100 === 0) {
                        nextEnemyIsSpecial = 'giant';
                    } else if (enemiesKilled % 10 === 0) {
                        nextEnemyIsSpecial = 'shooter';
                    }
                    
                    spawnPowerup(enemy.x, enemy.y);
                    createExplosion(enemy.x, enemy.y, enemy.color, 10);
                    triggerShake(3);
                    audioManager.playEnemyDeath();
                    enemies.splice(i, 1);
                    projectiles.splice(j, 1);
                    break;
                } else {
                    projectiles.splice(j, 1);
                }
            }
        }
    }

    // 更新道具
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();
        powerups[i].draw();
        if (powerups[i].lifeTime <= 0) {
            powerups.splice(i, 1);
        }
    }

    // 环绕子弹碰撞检测
    player.orbitBullets.forEach((bullet, bulletIndex) => {
        // 更新伤害冷却计时器
        if (bullet.damageCooldown > 0) {
            bullet.damageCooldown--;
        }
        
        const bulletX = player.x + Math.cos(bullet.angle) * bullet.distance;
        const bulletY = player.y + Math.sin(bullet.angle) * bullet.distance;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dist = getDistance(bulletX, bulletY, enemy.x, enemy.y);
            
            if (dist < bullet.radius + enemy.radius && bullet.damageCooldown <= 0) {
                enemy.hp -= bullet.damage;
                
                // 设置伤害冷却为30帧（约0.5秒@60FPS）
                bullet.damageCooldown = 30;
                
                const damageText = Math.floor(bullet.damage).toString();
                floatingTexts.push(new FloatingText(
                    enemy.x + (Math.random() - 0.5) * 20, 
                    enemy.y - 10, 
                    damageText, 
                    '#00FFFF'
                ));
                
                createExplosion(bulletX, bulletY, '#00FFFF', 5);
                
                if (enemy.hp <= 0) {
                    score += 10;
                    enemiesKilled++;
                    scoreValEl.innerText = score;
                    
                    if (enemiesKilled % 100 === 0) {
                        nextEnemyIsSpecial = 'giant';
                    } else if (enemiesKilled % 10 === 0) {
                        nextEnemyIsSpecial = 'shooter';
                    }
                    
                    spawnPowerup(enemy.x, enemy.y);
                    createExplosion(enemy.x, enemy.y, enemy.color, 10);
                    triggerShake(3);
                    audioManager.playEnemyDeath();
                    enemies.splice(i, 1);
                }
                
                break;
            }
        }
    });

    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // 更新敌人子弹
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const ep = enemyProjectiles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.life--;
        
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
        ctx.fillStyle = ep.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ep.color;
        ctx.fill();
        
        if (getDistance(ep.x, ep.y, player.x, player.y) < ep.radius + player.radius) {
            if (player.invulnerable <= 0) {
                player.hp -= 10;
                player.invulnerable = 40;
                triggerShake(10);
                createExplosion(player.x, player.y, '#ff0000', 15);
                healthBarEl.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
                healthTextEl.innerText = `${Math.floor(player.hp)} / ${player.maxHp}`;
                audioManager.playPlayerHurt();
                if (player.hp <= 0) gameOver();
            }
            enemyProjectiles.splice(i, 1);
            continue;
        }
        
        if (ep.life <= 0 || 
            ep.x < -50 || ep.x > canvas.width + 50 || 
            ep.y < -50 || ep.y > canvas.height + 50) {
            enemyProjectiles.splice(i, 1);
        }
    }

    // 更新浮动文字
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].draw();
        if (floatingTexts[i].alpha <= 0) floatingTexts.splice(i, 1);
    }

    // 难度调整
    difficultyMultiplier = 1 + Math.floor(score / 250);
    const spawnRate = Math.max(15, 60 - Math.floor(score / 40));
    if (frameCount % spawnRate === 0) spawnEnemy();

    frameCount++;
    ctx.restore();
    
    animationFrameId = requestAnimationFrame(animate);
}
