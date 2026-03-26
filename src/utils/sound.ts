// ===== 音效管理器 - 使用 Web Audio API 合成音效 =====

import type { SoundType } from '@/types'

/**
 * 音效管理器
 * 所有音效完全由 OscillatorNode + GainNode 合成，无需加载外部音频文件
 */
class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled = true
  private volume = 0.7

  /** 初始化 AudioContext（需要在用户交互后调用） */
  init(): void {
    if (this.audioContext) return
    try {
      this.audioContext = new AudioContext()
    } catch {
      console.warn('[SoundManager] 无法创建 AudioContext')
    }
  }

  /** 确保 AudioContext 处于运行状态 */
  private async ensureContext(): Promise<AudioContext | null> {
    if (!this.audioContext) this.init()
    if (!this.audioContext) return null
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    return this.audioContext
  }

  /** 创建增益节点并连接到目标 */
  private createGain(
    ctx: AudioContext,
    volume: number,
    destination?: AudioNode
  ): GainNode {
    const gain = ctx.createGain()
    gain.gain.value = volume * this.volume
    gain.connect(destination ?? ctx.destination)
    return gain
  }

  /** 播放一个振荡音 */
  private playTone(
    ctx: AudioContext,
    options: {
      type: OscillatorType
      frequency: number
      startTime: number
      duration: number
      volume?: number
      frequencyEnd?: number
      destination?: AudioNode
    }
  ): void {
    const {
      type,
      frequency,
      startTime,
      duration,
      volume = 0.3,
      frequencyEnd,
      destination,
    } = options

    const osc = ctx.createOscillator()
    const gain = this.createGain(ctx, volume, destination)

    osc.type = type
    osc.frequency.setValueAtTime(frequency, startTime)
    if (frequencyEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(frequencyEnd, startTime + duration)
    }

    // 淡出防止爆音
    gain.gain.setValueAtTime(volume * this.volume, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  // ===== 各音效合成方法 =====

  /** chip_place: 短促的高频叮声 */
  private synthChipPlace(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1200,
      startTime: t,
      duration: 0.08,
      volume: 0.25,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1800,
      startTime: t + 0.01,
      duration: 0.06,
      volume: 0.15,
    })
  }

  /** chip_collect: 快速上升音调 */
  private synthChipCollect(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sine',
      frequency: 800,
      frequencyEnd: 2000,
      startTime: t,
      duration: 0.15,
      volume: 0.25,
    })
    this.playTone(ctx, {
      type: 'triangle',
      frequency: 1000,
      frequencyEnd: 2400,
      startTime: t + 0.02,
      duration: 0.12,
      volume: 0.15,
    })
  }

  /** card_flip: 啪的一声 */
  private synthCardFlip(ctx: AudioContext, t: number): void {
    // 使用白噪声模拟啪声
    const bufferSize = ctx.sampleRate * 0.04
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = this.createGain(ctx, 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    source.connect(gain)
    source.start(t)

    // 配合一个短促高频音
    this.playTone(ctx, {
      type: 'square',
      frequency: 2500,
      startTime: t,
      duration: 0.03,
      volume: 0.08,
    })
  }

  /** bell: 叮铃声 */
  private synthBell(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sine',
      frequency: 830,
      startTime: t,
      duration: 0.4,
      volume: 0.3,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1245,
      startTime: t,
      duration: 0.3,
      volume: 0.15,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1660,
      startTime: t,
      duration: 0.2,
      volume: 0.08,
    })
  }

  /** fold: 低沉的嗡声 */
  private synthFold(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sawtooth',
      frequency: 200,
      frequencyEnd: 120,
      startTime: t,
      duration: 0.2,
      volume: 0.2,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 150,
      frequencyEnd: 80,
      startTime: t,
      duration: 0.25,
      volume: 0.15,
    })
  }

  /** all_in: 戏剧性的上升音调 */
  private synthAllIn(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sawtooth',
      frequency: 300,
      frequencyEnd: 900,
      startTime: t,
      duration: 0.3,
      volume: 0.2,
    })
    this.playTone(ctx, {
      type: 'square',
      frequency: 450,
      frequencyEnd: 1200,
      startTime: t + 0.05,
      duration: 0.3,
      volume: 0.1,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1200,
      startTime: t + 0.3,
      duration: 0.15,
      volume: 0.25,
    })
  }

  /** win: 欢快的上升旋律 */
  private synthWin(ctx: AudioContext, t: number): void {
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      this.playTone(ctx, {
        type: 'sine',
        frequency: freq,
        startTime: t + i * 0.12,
        duration: 0.18,
        volume: 0.25,
      })
      this.playTone(ctx, {
        type: 'triangle',
        frequency: freq * 1.5,
        startTime: t + i * 0.12,
        duration: 0.12,
        volume: 0.08,
      })
    })
  }

  /** lose: 下降音调 */
  private synthLose(ctx: AudioContext, t: number): void {
    const notes = [400, 350, 300, 220]
    notes.forEach((freq, i) => {
      this.playTone(ctx, {
        type: 'sine',
        frequency: freq,
        startTime: t + i * 0.15,
        duration: 0.2,
        volume: 0.2,
      })
    })
  }

  /** tick: 短促的嘀声 */
  private synthTick(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1000,
      startTime: t,
      duration: 0.03,
      volume: 0.15,
    })
  }

  /** click: 微弱的点击声 */
  private synthClick(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'square',
      frequency: 1500,
      startTime: t,
      duration: 0.015,
      volume: 0.1,
    })
  }

  /** notification: 两段式提示音 */
  private synthNotification(ctx: AudioContext, t: number): void {
    this.playTone(ctx, {
      type: 'sine',
      frequency: 880,
      startTime: t,
      duration: 0.12,
      volume: 0.25,
    })
    this.playTone(ctx, {
      type: 'sine',
      frequency: 1100,
      startTime: t + 0.15,
      duration: 0.12,
      volume: 0.25,
    })
  }

  /** 音效合成派发表 */
  private readonly synthMap: Record<
    SoundType,
    (ctx: AudioContext, t: number) => void
  > = {
    chip_place: (ctx, t) => this.synthChipPlace(ctx, t),
    chip_collect: (ctx, t) => this.synthChipCollect(ctx, t),
    card_flip: (ctx, t) => this.synthCardFlip(ctx, t),
    bell: (ctx, t) => this.synthBell(ctx, t),
    fold: (ctx, t) => this.synthFold(ctx, t),
    all_in: (ctx, t) => this.synthAllIn(ctx, t),
    win: (ctx, t) => this.synthWin(ctx, t),
    lose: (ctx, t) => this.synthLose(ctx, t),
    tick: (ctx, t) => this.synthTick(ctx, t),
    click: (ctx, t) => this.synthClick(ctx, t),
    notification: (ctx, t) => this.synthNotification(ctx, t),
  }

  /** 播放指定音效 */
  async play(type: SoundType): Promise<void> {
    if (!this.enabled) return

    const ctx = await this.ensureContext()
    if (!ctx) return

    try {
      const synth = this.synthMap[type]
      if (synth) {
        synth(ctx, ctx.currentTime)
      }
    } catch (err) {
      console.warn(`[SoundManager] 播放音效失败: ${type}`, err)
    }
  }

  /** 设置音效开关 */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /** 设置音量（0-1） */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }
}

/** 音效管理器单例 */
export const soundManager = new SoundManager()

/** 快捷播放函数 */
export const playSound = (type: SoundType): void => {
  soundManager.play(type)
}
