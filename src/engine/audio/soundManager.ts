/**
 * 纯前端 Web Audio 合成音效管理器 (Zero External Assets)
 * 基于原生 Web Audio API，无需引入外部 MP3/WAV 文件。
 * 具备测试环境与 SSR 安全降级能力。
 */

class SoundManager {
  private ctx: AudioContext | null = null
  private muted: boolean = false
  private activeSpinTimers: number[] = []

  constructor() {
    try {
      this.muted = globalThis.localStorage?.getItem('wol_sound_muted') === 'true'
    } catch {
      this.muted = false
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null
    if (typeof window === 'undefined') return null

    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtxClass) return null

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtxClass()
      } catch {
        return null
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    return this.ctx
  }

  public isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
    this.stopWheelSpin()
    try {
      globalThis.localStorage?.setItem('wol_sound_muted', String(muted))
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  /**
   * 转盘指针拨过单格扇区的清脆机械咔哒声 (Mechanical Tick)
   */
  public playTick(pitchShift = 1.0): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // 短促的高频指数衰减，模拟木质/金属指针弹片划过齿轮的打击质感
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1400 * pitchShift, now)
      osc.frequency.exponentialRampToValueAtTime(320 * pitchShift, now + 0.018)

      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.02)
    } catch {
      // 容错处理
    }
  }

  /**
   * 模拟转盘随物理减速旋转时的连续动态咔哒声
   */
  public startWheelSpin(durationMs: number = 2400): void {
    this.stopWheelSpin()
    if (this.muted) return

    const totalTicks = Math.min(28, Math.max(8, Math.floor(durationMs / 90)))

    // 基于转盘缓动曲线动态计算每个 Tick 的时间点
    for (let i = 0; i < totalTicks; i++) {
      const progress = i / totalTicks
      // 早期转速极快（间隔密），后期指数衰减（间隔拉长）
      const delay = Math.pow(progress, 2.2) * durationMs

      const timerId = Number(globalThis.setTimeout(() => {
        // 后期随着减速，咔哒声音高略微降低，增强沉重阻尼咬合感
        const pitch = 1.15 - progress * 0.35
        this.playTick(pitch)
      }, delay))

      this.activeSpinTimers.push(timerId)
    }

    // 终止计时器
    const endTimer = Number(globalThis.setTimeout(() => {
      this.stopWheelSpin()
    }, durationMs + 50))
    this.activeSpinTimers.push(endTimer)
  }

  public stopWheelSpin(): void {
    for (const timer of this.activeSpinTimers) {
      globalThis.clearTimeout(timer)
    }
    this.activeSpinTimers = []
  }

  /**
   * 命中稀有/大吉/机缘扇区时的清脆金石鸣钟音 (Opportunity Chime)
   */
  public playOpportunity(): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [880, 1320, 1760] // A5, E6, A6 和弦

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.04)

        const start = now + idx * 0.04
        gain.gain.setValueAtTime(0.18 / (idx + 1), start)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(start)
        osc.stop(start + 0.65)
      })
    } catch {}
  }

  /**
   * 命中危机/血光大劫时的低沉警示音 (Crisis Drone)
   */
  public playCrisis(): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.4)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.5)
    } catch {}
  }

  /**
   * UI 通用清脆确认/点击音
   */
  public playClick(): void {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.03)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.04)
    } catch {}
  }
}

export const soundManager = new SoundManager()
