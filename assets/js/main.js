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
 * 游戏初始化和事件处理
 */

// 全局变量声明
let gameRunning = false;
let isPaused = false;
let isDemoMode = false; // 演示模式标志
let score = 0;
let frameCount = 0;
let difficultyMultiplier = 1;
let animationFrameId = null;
let enemiesKilled = 0;
let nextEnemyIsSpecial = null;

// 游戏统计
let gameSeconds = 0;
let totalPowerupsCollected = 0;
let currentWave = 1;
let waveKills = 0;
let waveThreshold = 10;
let waveTimeoutId = null;

// FPS计算
let lastTime = performance.now();
let fps = 60;
let frameCount_fps = 0;

// 最高分系统
let highScore = parseInt(localStorage.getItem('neonDefenseHighScore')) || 0;

// 成就系统
const achievements = {
    KILL_100: { name: 'Centurion', desc: 'Kill 100 enemies', unlocked: false, check: () => enemiesKilled >= 100 },
    KILL_500: { name: 'Warlord', desc: 'Kill 500 enemies', unlocked: false, check: () => enemiesKilled >= 500 },
    KILL_1000: { name: 'Apex Predator', desc: 'Kill 1000 enemies', unlocked: false, check: () => enemiesKilled >= 1000 },
    WAVE_5: { name: 'Survivor', desc: 'Reach Wave 5', unlocked: false, check: () => currentWave >= 5 },
    WAVE_10: { name: 'Veteran', desc: 'Reach Wave 10', unlocked: false, check: () => currentWave >= 10 },
    WAVE_20: { name: 'Legend', desc: 'Reach Wave 20', unlocked: false, check: () => currentWave >= 20 },
    LEVEL_30: { name: 'Armed', desc: 'Reach Weapon Level 30', unlocked: false, check: () => player && player.laserLevel >= 30 },
    LEVEL_50: { name: 'Overpowered', desc: 'Reach Weapon Level 50', unlocked: false, check: () => player && player.laserLevel >= 50 },
    LEVEL_70: { name: 'Maximum Power', desc: 'Reach Weapon Level 70', unlocked: false, check: () => player && player.laserLevel >= 70 },
    SCORE_5000: { name: 'High Score', desc: 'Score 5000 points', unlocked: false, check: () => score >= 5000 },
    SCORE_10000: { name: 'Top Scorer', desc: 'Score 10000 points', unlocked: false, check: () => score >= 10000 },
    SCORE_20000: { name: 'Master', desc: 'Score 20000 points', unlocked: false, check: () => score >= 20000 },
    POWERUP_50: { name: 'Collector', desc: 'Collect 50 powerups', unlocked: false, check: () => totalPowerupsCollected >= 50 },
    POWERUP_100: { name: 'Hoarder', desc: 'Collect 100 powerups', unlocked: false, check: () => totalPowerupsCollected >= 100 }
};

// 设置
let settings = {
    masterVolume: 70,
    bgmVolume: 50,
    sfxVolume: 80,
    showFps: true
};

// SVG资源
const playerSvg = new Image();
playerSvg.src = 'assets/svg/player.svg';

// 敌人SVG资源 - Normal敌人多个配色版本
const enemyNormalSvgs = [
    'assets/svg/enemy-normal.svg',      // 紫色（默认）
    'assets/svg/enemy-normal-pink.svg', // 粉色
    'assets/svg/enemy-normal-blue.svg', // 蓝色
    'assets/svg/enemy-normal-cyan.svg'  // 青色
];
const enemyNormalSvgImages = enemyNormalSvgs.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Shooter和Giant使用固定配色
const enemyShooterSvg = new Image();
enemyShooterSvg.src = 'assets/svg/enemy-shooter.svg';

const enemyGiantSvg = new Image();
enemyGiantSvg.src = 'assets/svg/enemy-giant.svg';

// 输入状态
const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, isDown: false };

// 游戏实体数组
let player;
let projectiles = [];
let enemyProjectiles = [];
let enemies = [];
let particles = [];
let bgParticles = [];
let powerups = [];
let floatingTexts = [];

// 屏幕震动
let shakeIntensity = 0;

// DOM元素引用
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreValEl = document.getElementById('scoreVal');
const highscoreValEl = document.getElementById('highscoreVal');
const multValEl = document.getElementById('multVal');
const damageValEl = document.getElementById('damageVal');
const healthBarEl = document.getElementById('healthBar');
const healthTextEl = document.getElementById('healthText');
const weaponNameEl = document.getElementById('weaponName');
const gameOverEl = document.getElementById('gameOverMsg');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const resetBtn = document.getElementById('resetBtn');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const demoBtn = document.getElementById('demoBtn'); // 演示模式按钮
const cursor = document.getElementById('cursor');

// 新增DOM元素
const killsValEl = document.getElementById('killsVal');
const timeValEl = document.getElementById('timeVal');
const powerupsValEl = document.getElementById('powerupsVal');
const fpsValEl = document.getElementById('fpsVal');
const finalScoreEl = document.getElementById('finalScore');
const finalKillsEl = document.getElementById('finalKills');
const finalTimeEl = document.getElementById('finalTime');
const newRecordEl = document.getElementById('newRecord');
const achievementPopup = document.getElementById('achievementPopup');
const achievementTitle = document.getElementById('achievementTitle');
const achievementDesc = document.getElementById('achievementDesc');
const waveAnnouncement = document.getElementById('waveAnnouncement');
const waveText = document.getElementById('waveText');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const volumeSlider = document.getElementById('volumeSlider');
const bgmSlider = document.getElementById('bgmSlider');
const sfxSlider = document.getElementById('sfxSlider');
const volumeValue = document.getElementById('volumeValue');
const bgmValue = document.getElementById('bgmValue');
const sfxValue = document.getElementById('sfxValue');
const showFpsCheck = document.getElementById('showFpsCheck');

// 音频管理器实例
const audioManager = new AudioManager();

// --- 事件监听器 ---

window.addEventListener('keydown', (e) => {
    // 演示模式下只允许ESC键退出
    if (isDemoMode) {
        if (e.key === 'Escape') {
            exitDemoMode();
        }
        return; // 演示模式下忽略其他按键
    }
    
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape') {
        if (settingsOverlay.classList.contains('active')) {
            closeSettings();
        } else {
            togglePause();
        }
    }
});

window.addEventListener('keyup', (e) => {
    // 演示模式下忽略所有按键释放事件
    if (isDemoMode) return;
    
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousemove', (e) => {
    // 演示模式下禁用鼠标移动控制
    if (isDemoMode) return;
    
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

window.addEventListener('mousedown', (e) => {
    // 演示模式下禁用鼠标点击
    if (isDemoMode) return;
    
    if (e.button === 0) {
        mouse.isDown = true;
        console.log('MouseDown - GameRunning:', gameRunning, 'IsPaused:', isPaused);
    }
});

window.addEventListener('mouseup', (e) => {
    // 演示模式下禁用鼠标释放
    if (isDemoMode) return;
    
    if (e.button === 0) {
        mouse.isDown = false;
    }
});

window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('resize', resize);

// 窗口焦点监听 - 失焦时自动暂停并重置按键状态
window.addEventListener('blur', () => {
    if (gameRunning && !isPaused) {
        // 重置所有按键状态
        Object.keys(keys).forEach(key => keys[key] = false);
        // 自动暂停游戏
        togglePause();
        console.log('Window blurred - Game auto-paused, keys reset');
    }
});

// 按钮悬停音效
const allButtons = document.querySelectorAll('button');
allButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        audioManager.playButtonHover();
    });
});

resumeBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    resumeGame();
});

settingsBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    openSettings();
});

resetBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    restartGame();
});

closeSettingsBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    closeSettings();
});

volumeSlider.addEventListener('input', (e) => {
    settings.masterVolume = parseInt(e.target.value);
    volumeValue.textContent = settings.masterVolume + '%';
    audioManager.setMasterVolume(settings.masterVolume / 100);
    saveSettings();
});

bgmSlider.addEventListener('input', (e) => {
    settings.bgmVolume = parseInt(e.target.value);
    bgmValue.textContent = settings.bgmVolume + '%';
    audioManager.setBGMVolume(settings.bgmVolume / 100);
    saveSettings();
});

sfxSlider.addEventListener('input', (e) => {
    settings.sfxVolume = parseInt(e.target.value);
    sfxValue.textContent = settings.sfxVolume + '%';
    audioManager.setSFXVolume(settings.sfxVolume / 100);
    saveSettings();
});

showFpsCheck.addEventListener('change', (e) => {
    settings.showFps = e.target.checked;
    document.querySelector('.fps-display').style.display = settings.showFps ? 'block' : 'none';
    saveSettings();
});

startBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    
    // 初始化音频系统
    audioManager.init();
    
    startGame(false); // 正常模式
});

// 演示模式按钮
demoBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    
    // 初始化音频系统
    audioManager.init();
    
    startGame(true); // 演示模式
});

/**
 * 启动游戏
 * @param {boolean} demoMode - 是否为演示模式
 */
function startGame(demoMode = false) {
    isDemoMode = demoMode;
    
    // 重置游戏状态
    player = new Player(canvas.width / 2, canvas.height / 2);
    projectiles = [];
    enemyProjectiles = [];
    enemies = [];
    particles = [];
    powerups = [];
    floatingTexts = [];
    score = 0;
    enemiesKilled = 0;
    nextEnemyIsSpecial = null;
    frameCount = 0;
    difficultyMultiplier = 1;
    shakeIntensity = 0;
    gameRunning = true;
    isPaused = false;
    
    // 重置统计
    gameSeconds = 0;
    totalPowerupsCollected = 0;
    currentWave = 1;
    waveKills = 0;
    waveThreshold = 10;
    
    // 重置成就检查
    Object.keys(achievements).forEach(key => {
        achievements[key].unlocked = false;
    });
    
    // 更新UI
    scoreValEl.innerText = '0';
    highscoreValEl.innerText = highScore;
    healthBarEl.style.width = '100%';
    healthTextEl.innerText = `${player.hp} / ${player.maxHp}`;
    weaponNameEl.innerText = "PISTOL";
    multValEl.innerText = "LVL 0 | COUNT 1";
    multValEl.style.color = getLaserColor(0);
    damageValEl.innerText = "10";
    damageValEl.style.color = getLaserColor(0);
    
    // 重置统计面板
    killsValEl.innerText = '0';
    timeValEl.innerText = '00:00';
    powerupsValEl.innerText = '0';
    
    startScreen.classList.add('hidden');
    gameOverEl.style.opacity = 0;
    gameOverEl.classList.add('hidden');
    
    // 显示波次提示
    showWaveAnnouncement(currentWave);
    
    // 如果是演示模式，隐藏鼠标光标
    if (isDemoMode) {
        cursor.style.display = 'none';
        console.log('Demo Mode Started - Press ESC to exit');
    } else {
        cursor.style.display = 'block';
    }
    
    // 启动背景音乐
    audioManager.startBGM();
    
    animate();
}

/**
 * 退出演示模式
 */
function exitDemoMode() {
    console.log('Exiting Demo Mode');
    
    // 停止游戏
    gameRunning = false;
    isDemoMode = false;
    
    // 取消动画帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // 停止BGM
    audioManager.stopBGM();
    
    // 显示标题页面
    startScreen.classList.remove('hidden');
    cursor.style.display = 'block';
    clearWaveAnnouncement();
    
    // 清空游戏实体
    enemies = [];
    projectiles = [];
    enemyProjectiles = [];
    particles = [];
    powerups = [];
    floatingTexts = [];
}

// 页面加载时初始化画布尺寸（确保游戏启动前画布尺寸正确）
resize();

// 加载设置
loadSettings();

// 显示最高分
highscoreValEl.innerText = highScore;

/**
 * 显示波次提示
 */
function showWaveAnnouncement(wave) {
    waveText.textContent = `WAVE ${wave}`;
    waveAnnouncement.classList.add('show');

    if (waveTimeoutId) clearTimeout(waveTimeoutId);
    waveTimeoutId = setTimeout(() => {
        waveAnnouncement.classList.remove('show');
        waveTimeoutId = null;
    }, 2000);
}

function clearWaveAnnouncement() {
    if (waveTimeoutId) {
        clearTimeout(waveTimeoutId);
        waveTimeoutId = null;
    }
    waveAnnouncement.classList.remove('show');
}

/**
 * 检查并解锁成就
 */
function checkAchievements() {
    Object.keys(achievements).forEach(key => {
        const achievement = achievements[key];
        if (!achievement.unlocked && achievement.check()) {
            achievement.unlocked = true;
            showAchievement(achievement.name, achievement.desc);
        }
    });
}

/**
 * 显示成就弹窗
 */
function showAchievement(title, desc) {
    achievementTitle.textContent = title;
    achievementDesc.textContent = desc;
    achievementPopup.classList.add('show');
    
    // 播放成就音效
    audioManager.playUpgrade();
    
    setTimeout(() => {
        achievementPopup.classList.remove('show');
    }, 4000);
}

/**
 * 更新游戏时间显示
 */
function updateGameTime() {
    gameSeconds++;
    const minutes = Math.floor(gameSeconds / 60).toString().padStart(2, '0');
    const seconds = (gameSeconds % 60).toString().padStart(2, '0');
    timeValEl.textContent = `${minutes}:${seconds}`;
}

/**
 * 更新FPS显示
 */
function updateFPS() {
    const now = performance.now();
    frameCount_fps++;
    
    if (now - lastTime >= 1000) {
        fps = Math.round((frameCount_fps * 1000) / (now - lastTime));
        fpsValEl.textContent = fps;
        frameCount_fps = 0;
        lastTime = now;
    }
}

/**
 * 检查波次进度
 */
function checkWaveProgress() {
    waveKills++;
    
    if (waveKills >= waveThreshold) {
        currentWave++;
        waveKills = 0;
        waveThreshold = Math.floor(10 + currentWave * 2);
        showWaveAnnouncement(currentWave);
        
        // 波次奖励：增加难度但给予短暂休息
        difficultyMultiplier = 1 + (currentWave - 1) * 0.1;
    }
}

/**
 * 打开设置界面
 */
function openSettings() {
    settingsOverlay.classList.add('active');
    
    // 更新滑块位置
    volumeSlider.value = settings.masterVolume;
    bgmSlider.value = settings.bgmVolume;
    sfxSlider.value = settings.sfxVolume;
    showFpsCheck.checked = settings.showFps;
    
    volumeValue.textContent = settings.masterVolume + '%';
    bgmValue.textContent = settings.bgmVolume + '%';
    sfxValue.textContent = settings.sfxVolume + '%';
}

/**
 * 关闭设置界面
 */
function closeSettings() {
    settingsOverlay.classList.remove('active');
}

/**
 * 保存设置到localStorage
 */
function saveSettings() {
    localStorage.setItem('neonDefenseSettings', JSON.stringify(settings));
}

/**
 * 从localStorage加载设置
 */
function loadSettings() {
    const saved = localStorage.getItem('neonDefenseSettings');
    if (saved) {
        settings = JSON.parse(saved);
        
        // 应用设置
        audioManager.setMasterVolume(settings.masterVolume / 100);
        audioManager.setBGMVolume(settings.bgmVolume / 100);
        audioManager.setSFXVolume(settings.sfxVolume / 100);
        
        if (!settings.showFps) {
            document.querySelector('.fps-display').style.display = 'none';
        }
    }
}

/**
 * 格式化时间
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}