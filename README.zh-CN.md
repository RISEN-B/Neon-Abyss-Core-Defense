# 霓虹绝境：核心防御

<p align="center">
  <a href="README.md">English</a> | 中文
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-GPLv3-blue.svg" alt="License: GPL v3">
  <img src="https://img.shields.io/badge/vanilla-js-yellow.svg" alt="Vanilla JavaScript">
  <img src="https://img.shields.io/badge/platform-web-brightgreen.svg" alt="Platform: Web">
</p>

<p align="center">
  <b>霓虹绝境：核心防御</b> — 一款使用原生 JavaScript 和 HTML5 Canvas 构建的赛博朋克风格俯视角街机射击游戏。
</p>

---

## 概览

霓虹绝境：核心防御是一款设定在霓虹赛博朋克世界中的快节奏 2D 弹幕防御游戏。你将操控一艘先进战斗飞船，抵御一波波不断变强的敌人。击杀敌人、收集道具、通过 **70 级激光等级** 升级武器，尽可能生存更长时间。

**零依赖。无需构建工具。无需 npm install。打开即玩。**

## 游戏玩法

### 操作

| 按键 | 动作 |
|------|------|
| `W` `A` `S` `D` | 移动飞船 |
| **按住** 鼠标 | 向光标方向自动射击 |
| `ESC` | 暂停 / 继续 |

### 特性

- **70 级激光升级系统** — 武器经历 7 个颜色层级（灰 → 白 → 绿 → 蓝 → 紫 → 橙 → 红），每层包含 10 个饱和度子级，动态提升伤害与视觉效果。
- **多发射击** — 从单发扩展到最多 8 发同时散射的扇形弹幕。
- **子弹大小成长** — 70 个等级的子弹体积渐进增大。
- **环绕子弹系统** — 最多 50 个旋转弹丸围绕飞船运行，对接近的敌人造成持续伤害。
- **暴击系统** — 5 级暴击（2×、4×、6×、8×、10× 伤害），伴随逐渐升级的视觉特效，包括屏幕震动、金色爆炸以及彩虹究极暴击浮动文字。
- **3 种敌人类型** — 普通追踪者、会反击的射手、以及每击杀 100 个敌人后数量递增登场的巨型敌人。
- **6 种道具类型** — 生命恢复、子弹数量、子弹大小、伤害（激光等级）、射速、环绕子弹。
- **屏幕震动与粒子特效** — 爆炸、拖尾、受击反馈。
- **程序化音频** — 所有音效和背景音乐均通过 Web Audio API 实时生成——无需音频文件。
- **演示模式** — 观看 AI 自动操控飞船，具备躲避、瞄准和拾取道具的逻辑。
- **自动暂停** — 浏览器窗口失去焦点时游戏自动暂停。

## 快速开始

### 在线游玩

直接在浏览器中打开游戏——无需服务器。

1. 克隆仓库：
   ```bash
   git clone https://github.com/RISEN-B/Neon-Abyss-Core-Defense.git
   ```
2. 用任意现代浏览器打开 `index.html`。
3. 点击 **"Initialize System"** 开始游戏，或点击 **"Demo Mode"** 观看 AI 自动演示。

> 也可以使用任意静态 HTTP 服务器托管：
> ```bash
> python3 -m http.server 8000
> # 然后访问 http://localhost:8000
> ```

### 浏览器兼容性

支持所有支持 Web Audio API 的现代浏览器（Chrome、Firefox、Safari、Edge）。

## 项目结构

```
Neon-Abyss-Core-Defense/
├── index.html                    # 主入口文件
├── LICENSE                       # GNU GPL v3 许可证
├── README.md                     # 英文说明文档
├── README.zh-CN.md               # 中文说明文档
└── assets/
    ├── css/
    │   ├── base.css              # 全局重置与布局
    │   ├── cursor.css            # 自定义准星光标
    │   ├── hud.css               # 分数、血量条、武器显示
    │   ├── game-states.css       # 暂停菜单、游戏结束覆盖层
    │   └── start-screen.css      # 标题画面（发光动画）
    ├── js/
    │   ├── config.js             # 游戏常量与激光颜色系统
    │   ├── audio-manager.js      # 程序化音频引擎（Web Audio API）
    │   ├── player.js             # 玩家类（移动、射击、升级、演示 AI）
    │   ├── projectile.js         # 子弹类（含暴击系统）
    │   ├── enemy.js              # 敌人类（普通、射手、巨型）
    │   ├── powerup.js            # 道具类（6 种类型）
    │   ├── particles.js          # 粒子、浮动文字、背景粒子类
    │   ├── utils.js              # 工具函数（生成、爆炸、游戏状态）
    │   ├── game-loop.js          # 主循环（60fps）与碰撞检测
    │   └── main.js               # 初始化、事件监听、状态管理
    └── svg/
        ├── player.svg            # 玩家飞船精灵
        ├── enemy-normal*.svg     # 普通敌人精灵（4 种配色）
        ├── enemy-shooter.svg     # 射手敌人精灵
        └── enemy-giant.svg       # 巨型敌人精灵
```

## 架构

游戏通过单一的 `requestAnimationFrame` 循环（[game-loop.js](assets/js/game-loop.js)）以约 60 FPS 运行。每一帧：

1. 使用半透明覆盖层清空画布，产生运动拖尾效果
2. 按顺序更新与绘制：背景粒子 → 玩家 → 子弹 → 敌人 → 道具 → 环绕子弹 → 爆炸粒子 → 敌人子弹 → 浮动伤害文字
3. 处理所有实体对之间的碰撞检测
4. 根据分数动态调整难度（`difficultyMultiplier`）

所有游戏音频均通过 Web Audio API 的 `OscillatorNode` 和 `GainNode` 在运行时合成——不加载任何外部音频文件。

## 升级与成长

| 道具 | 符号 | 效果 |
|------|------|------|
| **生命恢复** | `+` | +25 HP、+1 最大 HP、+1 永久伤害 |
| **子弹数量** | `<<>` | +1 单次射击子弹数（最多 8） |
| **子弹大小** | `O>` | +1 子弹大小等级（70 级） |
| **伤害** | `>>>` | +1 激光等级（70 级，影响颜色与伤害） |
| **射速** | `SSS` | -1 射击冷却帧数（最低 6） |
| **环绕子弹** | `◎` | +1 环绕子弹（最多 50） |

拾取的每个道具（包括生命恢复）都会通过 `powerupCount` 属性永久增加基础伤害 +1。

## 许可证

霓虹绝境：核心防御是基于 **GNU General Public License v3.0** 许可的自由软件。完整文本请参阅 [LICENSE](LICENSE)。

```
Copyright (C) 2026  RISEN-B

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
```

## 作者

**RISEN-B** — [GitHub](https://github.com/RISEN-B)

---

<p align="center">
  <sub>Built with ❤️ and vanilla JavaScript. No frameworks were harmed in the making of this game.</sub>
</p>
