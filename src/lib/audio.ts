// Background Music Engine: Alternating 2-track soundtrack player
// Plays Track 1 <-> Track 2 in an infinite alternating loop across Intro and Main Site

const getTrackUrl = (filename: string): string => {
  const base = import.meta.env.BASE_URL || '/'
  const cleanBase = base.endsWith('/') ? base : base + '/'
  return `${cleanBase}audio/${filename}`
}

class BackgroundMusicEngine {
  private playlist: string[] = [
    getTrackUrl('track-1.mp3'),
    getTrackUrl('track-2.mp3')
  ]
  private currentTrackIndex = 0
  private audioA: HTMLAudioElement | null = null
  private audioB: HTMLAudioElement | null = null
  private activeAudio: HTMLAudioElement | null = null
  private isPlaying = false
  private isMuted = false
  private volume = 0.5
  private listeners: Set<(playing: boolean, trackIndex: number, muted: boolean) => void> = new Set()
  private customUrl: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('music_vol')
      if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.5
      const savedMute = localStorage.getItem('music_muted')
      if (savedMute !== null) this.isMuted = savedMute === 'true'
    }
  }

  public subscribe(fn: (playing: boolean, trackIndex: number, muted: boolean) => void) {
    this.listeners.add(fn)
    // Initial call
    fn(this.isPlaying, this.currentTrackIndex, this.isMuted)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isPlaying, this.currentTrackIndex, this.isMuted))
  }

  private initAudioElements() {
    if (typeof window === 'undefined') return

    if (!this.audioA) {
      this.audioA = new Audio(this.playlist[0])
      this.audioA.preload = 'auto'
      this.audioA.addEventListener('ended', () => this.handleTrackEnded(0))
      this.audioA.addEventListener('error', (e) => {
        console.warn('Track 1 audio load error:', this.playlist[0], e)
      })
    }
    if (!this.audioB) {
      this.audioB = new Audio(this.playlist[1])
      this.audioB.preload = 'auto'
      this.audioB.addEventListener('ended', () => this.handleTrackEnded(1))
      this.audioB.addEventListener('error', (e) => {
        console.warn('Track 2 audio load error:', this.playlist[1], e)
      })
    }
  }

  private handleTrackEnded(endedIndex: number) {
    if (!this.isPlaying) return

    // Alternating switch:
    // When track 0 (track-1) finishes -> immediately play track 1 (track-2)
    // When track 1 (track-2) finishes -> immediately play track 0 (track-1)
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
      } catch (err) {
        console.warn('Custom audio playback error:', err)
        return false
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
        console.warn('Track playback prevented by browser autoplay policy until user gesture:', err)
        return false
      }
    }
    return false
  }

  public pause() {
    this.isPlaying = false
    if (this.audioA) this.audioA.pause()
    if (this.audioB) this.audioB.pause()
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
    this.notify()
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted)
    return this.isMuted
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
}

export const musicEngine = new BackgroundMusicEngine()
