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
 * 游戏配置常量
 * 包含所有游戏参数、限制和颜色定义
 */

// 武器限制
const LIMITS = {
    MAX_BULLETS_COUNT: 8,        // 最大子弹数量
    MAX_BULLET_SIZE_RATIO: 0.60, // 子弹大小相对于玩家半径的最大比例
    MIN_SHOOT_RATE: 6            // 最小射击间隔帧数
};

// 系统限制
const MAX_BULLETS = 400;         // 子弹总数上限
const MAX_PARTICLES = 150;       // 粒子总数上限
const MAX_FLOATING_TEXTS = 30;   // 浮动文字上限

// 激光基础颜色映射 (7个主等级)
const LASER_BASE_COLORS = [
    '#888888',  // 0: 灰
    '#FFFFFF',  // 1: 白
    '#00FF00',  // 2: 绿
    '#00D2FF',  // 3: 蓝
    '#CC00FF',  // 4: 紫
    '#FFAA00',  // 5: 橙
    '#FF0055'   // 6: 红
];

/**
 * 根据激光等级获取颜色（支持70个等级）
 * @param {number} laserLevel - 激光等级 (0-69)
 * @returns {string} 十六进制颜色值
 */
function getLaserColor(laserLevel) {
    // 确保输入是有效数字
    if (typeof laserLevel !== 'number' || isNaN(laserLevel)) {
        return '#888888';
    }
    
    if (laserLevel < 0) return LASER_BASE_COLORS[0];
    
    // 70级及以上固定为纯红色
    if (laserLevel >= 70) {
        return '#FF0055';
    }
    
    // 每个主等级分为10个饱和度色阶
    const baseIndex = Math.floor(laserLevel / 10); // 0-6
    const saturationStep = laserLevel % 10; // 0-9
    
    const baseColor = LASER_BASE_COLORS[baseIndex];
    
    // 对于白色和灰色，直接返回（无法调整饱和度）
    if (baseColor === '#FFFFFF' || baseColor === '#888888') {
        return baseColor;
    }
    
    // 将十六进制转换为RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // 计算饱和度：从低饱和(30%)到原色(100%)
    const saturation = 0.3 + (saturationStep / 9) * 0.7;
    
    // 应用饱和度：向灰色(128,128,128)插值
    const gray = 128;
    const newR = Math.max(0, Math.min(255, Math.round(gray + (r - gray) * saturation)));
    const newG = Math.max(0, Math.min(255, Math.round(gray + (g - gray) * saturation)));
    const newB = Math.max(0, Math.min(255, Math.round(gray + (b - gray) * saturation)));
    
    // 转换回十六进制，确保两位数
    const hexR = newR.toString(16).padStart(2, '0');
    const hexG = newG.toString(16).padStart(2, '0');
    const hexB = newB.toString(16).padStart(2, '0');
    
    return `#${hexR}${hexG}${hexB}`.toUpperCase();
}

/**
 * 根据激光等级获取显示索引（用于UI等需要简化的场景）
 * @param {number} laserLevel - 激光等级 (0-69)
 * @returns {number} 基础颜色索引 (0-6)
 */
function getLaserBaseIndex(laserLevel) {
    return Math.min(Math.floor(laserLevel / 10), 6);
}
