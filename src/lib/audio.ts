// Audio Engine: Vintage Music Box / Acoustic Lullaby synthesizer & Audio element controller
// 100% original, copyright-free, zero-external-network requirement, with graceful fallback.

class MusicBoxEngine {
  private ctx: AudioContext | null = null
  private isPlaying = false
  private isMuted = false
  private volume = 0.5
  private step = 0
  private timer: number | null = null
  private audioEl: HTMLAudioElement | null = null
  private customUrl: string | null = null
  private listeners: Set<(playing: boolean) => void> = new Set()

  // Gentle, warm nostalgic pentatonic music box melody inspired by school days & gratitude
  // Frequencies in Hz for a relaxing, warm musical chime
  private melody: Array<{ note: number; dur: number; delay: number }> = [
    // Phrase 1: Warm greeting
    { note: 523.25, dur: 0.8, delay: 0 },    // C5
    { note: 659.25, dur: 0.8, delay: 400 },  // E5
    { note: 783.99, dur: 1.2, delay: 800 },  // G5
    { note: 880.00, dur: 1.0, delay: 1400 }, // A5
    { note: 783.99, dur: 1.4, delay: 1900 }, // G5
    { note: 659.25, dur: 1.0, delay: 2600 }, // E5
    { note: 587.33, dur: 1.4, delay: 3100 }, // D5

    // Phrase 2: Tender gratitude
    { note: 523.25, dur: 0.8, delay: 3900 }, // C5
    { note: 587.33, dur: 0.8, delay: 4300 }, // D5
    { note: 659.25, dur: 1.2, delay: 4700 }, // E5
    { note: 523.25, dur: 1.4, delay: 5300 }, // C5
    { note: 440.00, dur: 1.6, delay: 6000 }, // A4
    { note: 523.25, dur: 2.0, delay: 6800 }, // C5

    // Phrase 3: Ascending memory
    { note: 659.25, dur: 0.8, delay: 8000 }, // E5
    { note: 783.99, dur: 0.8, delay: 8400 }, // G5
    { note: 880.00, dur: 1.0, delay: 8800 }, // A5
    { note: 1046.50, dur: 1.5, delay: 9300 }, // C6
    { note: 880.00, dur: 1.0, delay: 10100 }, // A5
    { note: 783.99, dur: 1.2, delay: 10600 }, // G5
    { note: 659.25, dur: 1.8, delay: 11200 }, // E5

    // Phrase 4: Peaceful resolution
    { note: 587.33, dur: 0.8, delay: 12200 }, // D5
    { note: 659.25, dur: 0.8, delay: 12600 }, // E5
    { note: 783.99, dur: 1.0, delay: 1300 }, // G5
    { note: 587.33, dur: 1.2, delay: 13500 }, // D5
    { note: 523.25, dur: 2.5, delay: 14200 }, // C5
  ]
  private loopDuration = 16000

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('music_vol')
      if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.5
      const savedMute = localStorage.getItem('music_muted')
      if (savedMute !== null) this.isMuted = savedMute === 'true'
    }
  }

  public subscribe(fn: (playing: boolean) => void) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isPlaying))
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  private playTone(freq: number, duration: number, when: number) {
    if (!this.ctx) return
    const now = when
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    // Bell/music box harmonic structure: subtle sine with soft harmonic overtone
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    // Secondary overtone for warm metallic chime timbre
    const overtone = this.ctx.createOscillator()
    const overGain = this.ctx.createGain()
    overtone.type = 'sine'
    overtone.frequency.setValueAtTime(freq * 2.01, now)

    const masterGain = this.isMuted ? 0 : this.volume * 0.18

    // Envelope: quick attack, natural exponential bell decay
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(masterGain, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    overGain.gain.setValueAtTime(0.0001, now)
    overGain.gain.linearRampToValueAtTime(masterGain * 0.35, now + 0.015)
    overGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6)

    osc.connect(gain)
    overtone.connect(overGain)
    gain.connect(this.ctx.destination)
    overGain.connect(this.ctx.destination)

    osc.start(now)
    overtone.start(now)
    osc.stop(now + duration + 0.1)
    overtone.stop(now + duration * 0.6 + 0.1)
  }

  private scheduleLoop() {
    if (!this.isPlaying || !this.ctx) return
    const now = this.ctx.currentTime

    this.melody.forEach(item => {
      this.playTone(item.note, item.dur, now + item.delay / 1000)
    })

    this.timer = window.setTimeout(() => {
      if (this.isPlaying) this.scheduleLoop()
    }, this.loopDuration)
  }

  public setCustomAudioUrl(url: string | null) {
    this.customUrl = url
    if (this.audioEl) {
      this.audioEl.pause()
      this.audioEl = null
    }
  }

  public async play(): Promise<boolean> {
    if (this.isPlaying) return true
    this.initContext()

    if (this.customUrl) {
      if (!this.audioEl) {
        this.audioEl = new Audio(this.customUrl)
        this.audioEl.loop = true
      }
      this.audioEl.volume = this.isMuted ? 0 : this.volume
      try {
        await this.audioEl.play()
        this.isPlaying = true
        this.notify()
        return true
      } catch {
        // Fallback to synth if custom url fails
      }
    }

    if (this.ctx) {
      this.isPlaying = true
      this.scheduleLoop()
      this.notify()
      return true
    }
    return false
  }

  public pause() {
    this.isPlaying = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.audioEl) {
      this.audioEl.pause()
    }
    this.notify()
  }

  public toggle(): Promise<boolean> | void {
    if (this.isPlaying) {
      this.pause()
    } else {
      return this.play()
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_vol', this.volume.toString())
    }
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.volume
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_muted', muted.toString())
    }
    if (this.audioEl) {
      this.audioEl.volume = muted ? 0 : this.volume
    }
  }

  public getVolume() { return this.volume }
  public getIsMuted() { return this.isMuted }
  public getIsPlaying() { return this.isPlaying }
}

export const musicEngine = new MusicBoxEngine()
