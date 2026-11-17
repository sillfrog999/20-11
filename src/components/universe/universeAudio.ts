// Universe Audio Synthesizer via Web Audio API
// Zero external files, zero latency, pure ambient cinematic cosmic textures

class UniverseAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private droneGain: GainNode | null = null
  private isMuted: boolean = false
  private isStarted: boolean = false
  private droneOscillators: OscillatorNode[] = []
  private chimeTimer: number | null = null

  // Chords in key of D# minor / F# Major (Dreamy cosmic Lydian)
  private readonly CHORD_FREQS = [
    [155.56, 185.00, 233.08, 277.18, 370.00], // D#m7 (D#3, F#3, A#3, C#4, F#4)
    [146.83, 185.00, 220.00, 293.66, 370.00], // Bsus2
    [174.61, 220.00, 261.63, 329.63, 392.00], // F#maj7
    [130.81, 164.81, 196.00, 246.94, 329.63]  // G#m7
  ]
  private chordIndex = 0

  private initContext() {
    if (this.ctx) return
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new AudioContextClass()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime)
    this.masterGain.connect(this.ctx.destination)

    this.droneGain = this.ctx.createGain()
    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime)
    this.droneGain.connect(this.masterGain)
  }

  public async start(): Promise<void> {
    if (this.isStarted) return
    this.initContext()
    if (!this.ctx) return

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    this.isStarted = true
    this.startAmbientDrone()
    this.startGentleChimes()
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.droneGain) return

    // Warm multi-voice cosmic drone with gentle filter
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(320, this.ctx.currentTime)
    filter.connect(this.droneGain)

    // Base drone frequencies (sub + warm fifth + octave)
    const baseFreqs = [58.27, 87.31, 116.54, 174.61] // Bb1, F2, Bb2, F3

    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null
      const voiceGain = this.ctx.createGain()

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

      // Slight detune for lush spatial chorus
      osc.detune.setValueAtTime((idx - 1.5) * 6, this.ctx.currentTime)

      voiceGain.gain.setValueAtTime(0.12 / baseFreqs.length, this.ctx.currentTime)

      if (panner) {
        panner.pan.setValueAtTime((idx / (baseFreqs.length - 1)) * 1.4 - 0.7, this.ctx.currentTime)
        osc.connect(voiceGain)
        voiceGain.connect(panner)
        panner.connect(filter)
      } else {
        osc.connect(voiceGain)
        voiceGain.connect(filter)
      }

      osc.start()
      this.droneOscillators.push(osc)
    })

    // Fade in drone smoothly
    this.droneGain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 3.5)
  }

  private startGentleChimes() {
    // Periodically play soft crystalline bells evoking starlight
    const playNext = () => {
      if (!this.isStarted) return
      const delay = 1800 + Math.random() * 2600
      this.chimeTimer = window.setTimeout(() => {
        this.playStarlightNote()
        playNext()
      }, delay)
    }
    playNext()
  }

  public playStarlightNote(customFreq?: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return

    const notes = [466.16, 523.25, 587.33, 698.46, 783.99, 932.33, 1046.50] // Bb Pentatonic
    const freq = customFreq || notes[Math.floor(Math.random() * notes.length)]

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(freq, this.ctx.currentTime)
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime)

    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 2.5)
  }

  public playGoldenStarBloom() {
    if (!this.ctx || !this.masterGain || this.isMuted) return
    const now = this.ctx.currentTime

    // Resonant celestial swell (C# Major / F# Major)
    const chord = [277.18, 349.23, 415.30, 554.37, 698.46]
    chord.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = i === 0 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.06, now + 1.2 + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start(now)
      osc.stop(now + 6.2)
    })
  }

  public playLetterOpen() {
    if (!this.ctx || !this.masterGain || this.isMuted) return
    const now = this.ctx.currentTime

    // Gentle harp-like ascending arpeggio
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const startAt = now + idx * 0.12

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startAt)

      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(0.05, startAt + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 2.0)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start(startAt)
      osc.stop(startAt + 2.1)
    })
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.45, now + 0.25)
    }
    return this.isMuted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  public stop() {
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer)
      this.chimeTimer = null
    }
    this.droneOscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.droneOscillators = []
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close() } catch {}
    }
    this.ctx = null
    this.masterGain = null
    this.droneGain = null
    this.isStarted = false
  }
}

export const universeAudio = new UniverseAudioEngine()
