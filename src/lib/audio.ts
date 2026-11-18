// Background Music Engine: Alternating 2-track soundtrack player with seamless loop & synth fallback
// Track 1 <-> Track 2 alternating continuously

class BackgroundMusicEngine {
  private playlist = ['/audio/track-1.mp3', '/audio/track-2.mp3']
  private currentTrackIndex = 0
  private audioA: HTMLAudioElement | null = null
  private audioB: HTMLAudioElement | null = null
  private activeAudio: HTMLAudioElement | null = null
  private isPlaying = false
  private isMuted = false
  private volume = 0.5
  private listeners: Set<(playing: boolean, trackIndex: number) => void> = new Set()
  private customUrl: string | null = null
  private ctx: AudioContext | null = null
  private timer: number | null = null

  // Melodic fallback synth (warm nostalgic chimes)
  private melody: Array<{ note: number; dur: number; delay: number }> = [
    { note: 523.25, dur: 0.8, delay: 0 },
    { note: 659.25, dur: 0.8, delay: 400 },
    { note: 783.99, dur: 1.2, delay: 800 },
    { note: 880.00, dur: 1.0, delay: 1400 },
    { note: 783.99, dur: 1.4, delay: 1900 },
    { note: 659.25, dur: 1.0, delay: 2600 },
    { note: 587.33, dur: 1.4, delay: 3100 },
    { note: 523.25, dur: 0.8, delay: 3900 },
    { note: 587.33, dur: 0.8, delay: 4300 },
    { note: 659.25, dur: 1.2, delay: 4700 },
    { note: 523.25, dur: 1.4, delay: 5300 },
    { note: 440.00, dur: 1.6, delay: 6000 },
    { note: 523.25, dur: 2.0, delay: 6800 },
    { note: 659.25, dur: 0.8, delay: 8000 },
    { note: 783.99, dur: 0.8, delay: 8400 },
    { note: 880.00, dur: 1.0, delay: 8800 },
    { note: 1046.50, dur: 1.5, delay: 9300 },
    { note: 880.00, dur: 1.0, delay: 10100 },
    { note: 783.99, dur: 1.2, delay: 10600 },
    { note: 659.25, dur: 1.8, delay: 11200 },
    { note: 587.33, dur: 0.8, delay: 12200 },
    { note: 659.25, dur: 0.8, delay: 12600 },
    { note: 783.99, dur: 1.0, delay: 13000 },
    { note: 587.33, dur: 1.2, delay: 13500 },
    { note: 523.25, dur: 2.5, delay: 14200 },
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

  public subscribe(fn: (playing: boolean, trackIndex: number) => void) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isPlaying, this.currentTrackIndex))
  }

  private initAudioElements() {
    if (typeof window === 'undefined') return
    if (!this.audioA) {
      this.audioA = new Audio(this.playlist[0])
      this.audioA.preload = 'auto'
      this.audioA.addEventListener('ended', () => this.handleTrackEnded(0))
    }
    if (!this.audioB) {
      this.audioB = new Audio(this.playlist[1])
      this.audioB.preload = 'auto'
      this.audioB.addEventListener('ended', () => this.handleTrackEnded(1))
    }
  }

  private handleTrackEnded(endedIndex: number) {
    if (!this.isPlaying) return

    // When track 0 (track-1) finishes -> automatically plays track 1 (track-2)
    // When track 1 (track-2) finishes -> automatically plays track 0 (track-1)
    const nextIndex = (endedIndex + 1) % this.playlist.length
    this.currentTrackIndex = nextIndex

    const nextAudio = nextIndex === 0 ? this.audioA : this.audioB
    if (nextAudio) {
      this.activeAudio = nextAudio
      nextAudio.currentTime = 0
      nextAudio.volume = this.isMuted ? 0 : this.volume
      nextAudio.play().catch(err => {
        console.warn('Auto alternating playback error:', err)
      })
    }
    this.notify()
  }

  public nextTrack() {
    if (this.activeAudio) {
      this.activeAudio.pause()
      this.activeAudio.currentTime = 0
    }
    this.handleTrackEnded(this.currentTrackIndex)
  }

  public async play(): Promise<boolean> {
    if (this.isPlaying) return true
    this.initAudioElements()

    if (this.customUrl) {
      if (!this.audioA) this.audioA = new Audio(this.customUrl)
      this.audioA.src = this.customUrl
      this.audioA.loop = true
      this.audioA.volume = this.isMuted ? 0 : this.volume
      this.activeAudio = this.audioA
      try {
        await this.audioA.play()
        this.isPlaying = true
        this.notify()
        return true
      } catch {
        // Fallback
      }
    }

    const currentAudio = this.currentTrackIndex === 0 ? this.audioA : this.audioB
    if (currentAudio) {
      this.activeAudio = currentAudio
      currentAudio.volume = this.isMuted ? 0 : this.volume
      try {
        await currentAudio.play()
        this.isPlaying = true
        this.notify()
        return true
      } catch (err) {
        console.warn('Audio playback error, falling back to ambient synth:', err)
      }
    }

    this.initContext()
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
    if (this.audioA) this.audioA.pause()
    if (this.audioB) this.audioB.pause()
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
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
    const eff = this.isMuted ? 0 : this.volume
    if (this.audioA) this.audioA.volume = eff
    if (this.audioB) this.audioB.volume = eff
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_muted', muted.toString())
    }
    const eff = muted ? 0 : this.volume
    if (this.audioA) this.audioA.volume = eff
    if (this.audioB) this.audioB.volume = eff
  }

  public getCurrentTrack(): number {
    return this.currentTrackIndex
  }

  public getVolume() { return this.volume }
  public getIsMuted() { return this.isMuted }
  public getIsPlaying() { return this.isPlaying }

  public setCustomAudioUrl(url: string | null) {
    this.customUrl = url
    if (this.audioA) {
      this.audioA.pause()
      this.audioA = null
    }
    if (this.audioB) {
      this.audioB.pause()
      this.audioB = null
    }
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
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    const overtone = this.ctx.createOscillator()
    const overGain = this.ctx.createGain()
    overtone.type = 'sine'
    overtone.frequency.setValueAtTime(freq * 2.01, now)

    const masterGain = this.isMuted ? 0 : this.volume * 0.18
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
}

export const musicEngine = new BackgroundMusicEngine()
