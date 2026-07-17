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
 * 音频管理器 - 使用Web Audio API生成音效
 * 负责所有游戏音效和背景音乐
 */

class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.isMuted = false;
        this.bgmOscillators = [];
        this.initialized = false;
        this.masterVolume = 0.7;
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.8;
    }

    // 初始化音频上下文(需要用户交互后调用)
    init() {
        if (this.initialized) return;
        
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量节点
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.masterVolume * 0.3;
            this.masterGain.connect(this.audioCtx.destination);
            
            // 创建BGM音量节点
            this.bgmGain = this.audioCtx.createGain();
            this.bgmGain.gain.value = this.bgmVolume * 0.1;
            this.bgmGain.connect(this.masterGain);
            
            // 创建SFX音量节点
            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.gain.value = this.sfxVolume * 0.4;
            this.sfxGain.connect(this.masterGain);
            
            this.initialized = true;
            
            // 预创建射击音效缓冲区,减少延迟
            this.preloadShootSound();
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }
    
    // 确保音频上下文处于运行状态
    ensureRunning() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    
    // 预加载射击音效(创建可复用的节点)
    preloadShootSound() {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);
        gain.gain.value = 0; // 静音预热
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.01);
    }

    // 设置主音量 (0-1)
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume * 0.3;
        }
    }

    // 设置BGM音量 (0-1)
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.bgmVolume * 0.1;
        }
    }

    // 设置SFX音量 (0-1)
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume * 0.4;
        }
    }

    // 设置主音量（旧方法，保持兼容）
    setVolume(volume) {
        this.setMasterVolume(volume);
    }

    // 静音切换
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume * 0.3;
        }
        return this.isMuted;
    }

    // 射击音效(短促的电子音)
    playShoot() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'square';
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // 消灭敌人音效(爆炸声)
    playEnemyDeath() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const now = this.audioCtx.currentTime;
        const bufferSize = this.audioCtx.sampleRate * 0.2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
    }

    // 武器升级音效(上升音调)
    playUpgrade() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'sine';
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.15);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.3);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // 加血音效(清脆的叮当声)
    playHeal() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const frequencies = [523.25, 659.25, 783.99]; // C大调和弦
        const now = this.audioCtx.currentTime;
        
        frequencies.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + (index * 0.08);
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }

    // Game Over音效(下降的悲剧音)
    playGameOver() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'sawtooth';
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 1);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        
        osc.start(now);
        osc.stop(now + 1);
    }

    // 背景音乐(简单的循环旋律)
    startBGM() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        this.stopBGM();
        
        const melody = [
            { freq: 261.63, duration: 0.4 }, // C4
            { freq: 329.63, duration: 0.4 }, // E4
            { freq: 392.00, duration: 0.4 }, // G4
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 392.00, duration: 0.4 }, // G4
            { freq: 329.63, duration: 0.4 }, // E4
        ];
        
        let currentTime = this.audioCtx.currentTime;
        
        const playLoop = () => {
            if (!this.initialized || this.isMuted) return;
            
            melody.forEach(note => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(this.bgmGain);
                
                osc.type = 'triangle';
                osc.frequency.value = note.freq;
                
                gain.gain.setValueAtTime(0.08, currentTime);
                gain.gain.linearRampToValueAtTime(0, currentTime + note.duration);
                
                osc.start(currentTime);
                osc.stop(currentTime + note.duration);
                
                this.bgmOscillators.push(osc);
                currentTime += note.duration;
            });
            
            const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
            setTimeout(playLoop, totalDuration * 1000);
        };
        
        playLoop();
    }

    stopBGM() {
        this.bgmOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.bgmOscillators = [];
    }

    // 玩家受伤音效(低频冲击声)
    playPlayerHurt() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'sawtooth';
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 按钮按下音效
    playButtonClick() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'sine';
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 鼠标悬停音效
    playButtonHover() {
        if (!this.initialized || this.isMuted) return;
        this.ensureRunning();
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = 'sine';
        const now = this.audioCtx.currentTime;
        osc.frequency.value = 600;
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
}