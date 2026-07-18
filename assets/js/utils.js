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
 * 游戏工具函数
 * 包含所有辅助函数和系统功能
 */

// 调整画布大小
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(bgParticles.length === 0) initBackground();
}

// 初始化背景粒子
function initBackground() {
    bgParticles = [];
    for (let i = 0; i < 80; i++) bgParticles.push(new BackgroundParticle());
}

// 生成敌人
function spawnEnemy() {
    let x, y;
    
    // 处理特殊敌人生成
    if (nextEnemyIsSpecial) {
        const specialType = nextEnemyIsSpecial;
        nextEnemyIsSpecial = null;
        
        if (specialType === 'giant') {
            // 巨大敌人：根据击杀数决定数量（每100个击杀+1个，最多10个）
            const giantCount = Math.min(Math.floor(enemiesKilled / 100), 10);
            console.log(`Spawning ${giantCount} giant enemy/enemies (killed: ${enemiesKilled})`);
            
            for (let i = 0; i < giantCount; i++) {
                // 在屏幕边缘随机位置生成
                if (Math.random() < 0.5) {
                    x = Math.random() < 0.5 ? -30 : canvas.width + 30;
                    y = Math.random() * canvas.height;
                } else {
                    x = Math.random() * canvas.width;
                    y = Math.random() < 0.5 ? -30 : canvas.height + 30;
                }
                enemies.push(new Enemy(x, y, 'giant'));
            }
            return;
        } else if (specialType === 'shooter') {
            // 射手敌人：随机生成1-5个
            const shooterCount = Math.floor(Math.random() * 5) + 1;
            console.log(`Spawning ${shooterCount} shooter enemy/enemies`);
            
            for (let i = 0; i < shooterCount; i++) {
                // 在屏幕边缘随机位置生成
                if (Math.random() < 0.5) {
                    x = Math.random() < 0.5 ? -30 : canvas.width + 30;
                    y = Math.random() * canvas.height;
                } else {
                    x = Math.random() * canvas.width;
                    y = Math.random() < 0.5 ? -30 : canvas.height + 30;
                }
                enemies.push(new Enemy(x, y, 'shooter'));
            }
            return;
        }
    }
    
    // 普通敌人生成
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -30 : canvas.width + 30;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -30 : canvas.height + 30;
    }
    
    enemies.push(new Enemy(x, y, 'normal'));
}

// 生成道具
function spawnPowerup(x, y) {
    const isUpgrade = Math.random() > 0.4;
    if (!isUpgrade) {
        powerups.push(new Powerup(x, y, 'HEALTH'));
    } else {
        const types = ['COUNT', 'SIZE', 'DAMAGE', 'RATE', 'ORBIT'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push(new Powerup(x, y, type));
    }
}

// 创建爆炸效果
function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        }));
    }
}

// 计算两点距离
function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// 随机数生成
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// HEX转RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
}

// 触发屏幕震动
function triggerShake(intensity) {
    shakeIntensity = intensity;
}

// 切换暂停状态
function togglePause() {
    console.log('TogglePause called - Before:', 'gameRunning:', gameRunning, 'isPaused:', isPaused);
    if (!gameRunning) return;
    isPaused = !isPaused;
    console.log('TogglePause - After:', 'isPaused:', isPaused);
    if (isPaused) {
        pauseOverlay.classList.add('active');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        clearWaveAnnouncement();
        // 演示模式暂停时显示鼠标，方便操作暂停菜单
        if (isDemoMode) {
            cursor.style.display = 'block';
        }
        console.log('Game paused, animation cancelled');
    } else {
        pauseOverlay.classList.remove('active');
        animate();
        // 演示模式恢复时重新隐藏鼠标
        if (isDemoMode) {
            cursor.style.display = 'none';
        }
        console.log('Game resumed, animation restarted');
    }
}

// 恢复游戏
function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    pauseOverlay.classList.remove('active');
    animate();
    if (isDemoMode) {
        cursor.style.display = 'none';
    }
}

// 重新开始游戏
function restartGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // 重置演示模式状态
    isDemoMode = false;
    cursor.style.display = 'block';
    
    startScreen.classList.remove('hidden');
    gameOverEl.style.opacity = 0;
    gameOverEl.classList.add('hidden');
    pauseOverlay.classList.remove('active');
    isPaused = false;
    gameRunning = false;
    clearWaveAnnouncement();
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    isPaused = false;
    
    // 重置演示模式状态
    const wasDemoMode = isDemoMode;
    isDemoMode = false;
    cursor.style.display = 'block';
    
    shakeIntensity = 0;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    clearWaveAnnouncement();
    
    audioManager.playGameOver();
    audioManager.stopBGM();
    
    // 计算游戏时长
    const minutes = Math.floor(gameSeconds / 60).toString().padStart(2, '0');
    const seconds = (gameSeconds % 60).toString().padStart(2, '0');
    const timeStr = `${minutes}:${seconds}`;
    
    // 检查是否打破最高分记录
    const isNewRecord = score > highScore;
    if (isNewRecord) {
        highScore = score;
        localStorage.setItem('neonDefenseHighScore', highScore);
        highscoreValEl.innerText = highScore;
    }
    
    // 更新游戏结束界面统计
    finalScoreEl.textContent = score;
    finalKillsEl.textContent = enemiesKilled;
    finalTimeEl.textContent = timeStr;
    
    if (isNewRecord) {
        newRecordEl.style.display = 'block';
    } else {
        newRecordEl.style.display = 'none';
    }
    
    ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    gameOverEl.style.opacity = 1;
    gameOverEl.classList.remove('hidden');
    setTimeout(() => {
        startScreen.classList.remove('hidden');
        startBtn.innerText = "REBOOT SYSTEM";
        
        // 如果之前是演示模式，恢复按钮文字
        if (wasDemoMode) {
            startBtn.innerText = "Initialize System";
        }
    }, 3000);
}