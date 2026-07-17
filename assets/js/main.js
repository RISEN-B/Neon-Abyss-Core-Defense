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
const multValEl = document.getElementById('multVal');
const damageValEl = document.getElementById('damageVal');
const healthBarEl = document.getElementById('healthBar');
const healthTextEl = document.getElementById('healthText');
const weaponNameEl = document.getElementById('weaponName');
const gameOverEl = document.getElementById('gameOverMsg');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const demoBtn = document.getElementById('demoBtn'); // 演示模式按钮
const cursor = document.getElementById('cursor');

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
    if (e.key === 'Escape') togglePause();
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

resetBtn.addEventListener('click', () => {
    audioManager.playButtonClick();
    restartGame();
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
    
    // 更新UI
    scoreValEl.innerText = '0';
    healthBarEl.style.width = '100%';
    healthTextEl.innerText = `${player.hp} / ${player.maxHp}`;
    weaponNameEl.innerText = "PISTOL";
    multValEl.innerText = "LVL 0 | COUNT 1";
    multValEl.style.color = getLaserColor(0);
    damageValEl.innerText = "10";
    damageValEl.style.color = getLaserColor(0);
    
    startScreen.classList.add('hidden');
    gameOverEl.style.opacity = 0;
    gameOverEl.classList.add('hidden');
    
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
