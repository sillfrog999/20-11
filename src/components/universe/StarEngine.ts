// High Performance Canvas 2D Star Particle & Constellation Engine
// For The Universe of 9H2

export interface StarParticle {
  x: number
  y: number
  z: number
  size: number
  baseOpacity: number
  twinkleSpeed: number
  twinklePhase: number
  color: string
  vx: number
  vy: number
  originalX: number
  originalY: number
  connectionsCount: number
}

export interface MathFormula {
  text: string
  x: number
  y: number
  scale: number
  angle: number
  rotationSpeed: number
  vx: number
  vy: number
  baseOpacity: number
  phase: number
}

export class StarEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number = 0
  private height: number = 0
  private dpr: number = 1
  private stars: StarParticle[] = []
  private formulas: MathFormula[] = []
  private mouseX: number = -1000
  private mouseY: number = -1000
  private isPointerDown: boolean = false
  private autoPulseTime: number = 0
  private convergenceProgress: number = 0

  // Palette constants
  private readonly STAR_COLORS = ['#F5F0FF', '#B9A9E8', '#D8B879', '#C58F98', '#FFFFFF']

  private readonly FORMULA_STRINGS = [
    'e^(iπ) + 1 = 0',
    '∑',
    '∫',
    'Δ',
    'π',
    '√',
    '∞',
    'lim (1 + 1/n)ⁿ = e',
    'a² + b² = c²'
  ]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get Canvas 2D context')
    }

    this.ctx = context

    this.resize()
    this.initStars()
    this.initFormulas()
  }

  public resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr

    // Reset transform instead of stacking scale transformations.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private initStars() {
    // Responsive star density: 75 on mobile, 175 on desktop
    const count = this.width < 768 ? 75 : 175

    this.stars = []

    for (let i = 0; i < count; i++) {
      const z = 0.2 + Math.random() * 0.8
      const x = Math.random() * this.width
      const y = Math.random() * this.height

      const color = this.STAR_COLORS[
        Math.floor(Math.random() * this.STAR_COLORS.length)
      ]

      this.stars.push({
        x,
        y,
        z,
        size: (0.7 + Math.random() * 2.2) * (z * 0.9 + 0.3),
        baseOpacity: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.015 + Math.random() * 0.035,
        twinklePhase: Math.random() * Math.PI * 2,
        color,
        vx: (Math.random() - 0.5) * 0.18 * z,
        vy: (Math.random() - 0.5) * 0.18 * z,
        originalX: x,
        originalY: y,
        connectionsCount: 0
      })
    }
  }

  private initFormulas() {
    this.formulas = this.FORMULA_STRINGS.map((text, i) => {
      const angle = (i / this.FORMULA_STRINGS.length) * Math.PI * 2

      const radius = 120 + Math.random() * (
        Math.min(this.width, this.height) * 0.38
      )

      const cx = this.width * 0.5
      const cy = this.height * 0.5

      return {
        text,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius * 0.8,
        scale: 0.85 + Math.random() * 0.5,
        angle: (Math.random() - 0.5) * 0.4,
        rotationSpeed: (Math.random() - 0.5) * 0.002,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        baseOpacity: 0.18 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2
      }
    })
  }

  public setPointer(x: number, y: number, isDown: boolean = false) {
    this.mouseX = x
    this.mouseY = y
    this.isPointerDown = isDown
  }

  public clearPointer() {
    this.mouseX = -1000
    this.mouseY = -1000
    this.isPointerDown = false
  }

  public render(timestamp: number, sceneTimeMs: number, currentScene: string) {
    const ctx = this.ctx
    const w = this.width
    const h = this.height
    const cx = w * 0.5
    const cy = h * 0.5

    ctx.clearRect(0, 0, w, h)

    // Calculate scene specific weights
    const isVoid = currentScene === 'THE_VOID'
    const isConnect = currentScene === 'CONNECT_THE_STARS'
    const isConstellation = currentScene === 'OUR_CONSTELLATION'
    const isBrightest = currentScene === 'THE_BRIGHTEST_STAR'

    const isLetter = currentScene === 'A_LETTER_FOR_YOU' ||
      currentScene === 'WARP_TRANSITION'

    // Scene transition fades
    let formulaAlpha = 0

    if (sceneTimeMs < 10000) {
      formulaAlpha = Math.min(1, Math.max(0, (sceneTimeMs - 800) / 2500)) *
        Math.min(1, Math.max(0, (11000 - sceneTimeMs) / 2000))
    }

    // 1. Render Floating Mathematical Formulas (Scene 1 — The Void)
    if (formulaAlpha > 0.01) {
      ctx.save()

      this.formulas.forEach(f => {
        f.x += f.vx
        f.y += f.vy
        f.angle += f.rotationSpeed

        const pulse = 0.8 + 0.2 * Math.sin(timestamp * 0.0015 + f.phase)
        const alpha = f.baseOpacity * formulaAlpha * pulse

        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.angle)

        ctx.font = `italic ${Math.round(20 * f.scale)}px "Lora", "Playfair Display", Georgia, serif`
        ctx.fillStyle = `rgba(185, 169, 232, ${alpha})`
        ctx.shadowColor = 'rgba(185, 169, 232, 0.4)'
        ctx.shadowBlur = 8
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.fillText(f.text, 0, 0)
        ctx.restore()
      })

      ctx.restore()
    }

    // 2. Star Connection Network (Scene 2 & 3)
    let connectionAlpha = 0

    if (sceneTimeMs >= 9500 && sceneTimeMs < 42000) {
      if (sceneTimeMs < 12500) {
        connectionAlpha = (sceneTimeMs - 9500) / 3000
      } else if (sceneTimeMs > 38000) {
        connectionAlpha = Math.max(0, (42000 - sceneTimeMs) / 4000)
      } else {
        connectionAlpha = 1
      }
    }

    // Max distance for drawing connection lines
    const maxDistance = w < 768 ? 95 : 140
    const maxDegree = 3

    // Reset degree counters
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].connectionsCount = 0
    }

    // Procedural pulse traveling through constellation
    this.autoPulseTime += 0.012

    const pulseCenterIdx = Math.floor(
      Math.abs(Math.sin(this.autoPulseTime * 0.3)) * this.stars.length
    )

    const pulseStar = this.stars[pulseCenterIdx]

    if (connectionAlpha > 0.01) {
      ctx.save()
      ctx.lineWidth = 0.85

      for (let i = 0; i < this.stars.length; i++) {
        const s1 = this.stars[i]

        if (s1.connectionsCount >= maxDegree) continue

        for (let j = i + 1; j < this.stars.length; j++) {
          const s2 = this.stars[j]

          if (s2.connectionsCount >= maxDegree) continue

          const dx = s1.x - s2.x
          const dy = s1.y - s2.y
          const distSq = dx * dx + dy * dy

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq)
            const proximityFactor = 1 - dist / maxDistance

            // Bonus glow if near pulse star or near pointer
            let pulseBonus = 0

            if (pulseStar) {
              const dPulse = Math.hypot(
                s1.x - pulseStar.x,
                s1.y - pulseStar.y
              )

              if (dPulse < 220) {
                pulseBonus += (1 - dPulse / 220) * 0.4
              }
            }

            if (this.mouseX > 0) {
              const dMouse = Math.hypot(
                (s1.x + s2.x) * 0.5 - this.mouseX,
                (s1.y + s2.y) * 0.5 - this.mouseY
              )

              if (dMouse < 180) {
                pulseBonus += (1 - dMouse / 180) * 0.65
              }
            }

            const lineOpacity = Math.min(
              0.85,
              (proximityFactor * 0.35 + pulseBonus) * connectionAlpha
            )

            if (lineOpacity > 0.02) {
              ctx.strokeStyle = `rgba(185, 169, 232, ${lineOpacity})`
              ctx.beginPath()
              ctx.moveTo(s1.x, s1.y)
              ctx.lineTo(s2.x, s2.y)
              ctx.stroke()

              s1.connectionsCount++
              s2.connectionsCount++
            }
          }
        }
      }

      ctx.restore()
    }

    // 3. Pointer interaction rays
    if (this.mouseX > 0 && (isConnect || isConstellation)) {
      ctx.save()

      const pointerRadius = 160

      this.stars.forEach(s => {
        const d = Math.hypot(
          s.x - this.mouseX,
          s.y - this.mouseY
        )

        if (d < pointerRadius) {
          const alpha = (1 - d / pointerRadius) * 0.55

          ctx.strokeStyle = `rgba(216, 184, 121, ${alpha})`
          ctx.lineWidth = 1.1
          ctx.beginPath()
          ctx.moveTo(this.mouseX, this.mouseY)
          ctx.lineTo(s.x, s.y)
          ctx.stroke()
        }
      })

      ctx.restore()
    }

    // 4. Update & Render Stars
    // Calculate Convergence towards center for Scene 4
    if (isBrightest) {
      this.convergenceProgress = Math.min(
        1,
        this.convergenceProgress + 0.008
      )
    } else if (isLetter) {
      this.convergenceProgress = Math.min(
        1,
        this.convergenceProgress + 0.002
      )
    } else {
      this.convergenceProgress = Math.max(
        0,
        this.convergenceProgress - 0.01
      )
    }

    const starGlobalAlpha = isVoid
      ? Math.min(1, Math.max(0.2, sceneTimeMs / 6000))
      : 1

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i]

      // Natural twinkle
      const twinkle = Math.sin(
        timestamp * s.twinkleSpeed + s.twinklePhase
      )

      const currentAlpha = Math.max(
        0.1,
        Math.min(1, s.baseOpacity + twinkle * 0.35)
      ) * starGlobalAlpha

      // Convergence attraction physics
      if (this.convergenceProgress > 0.01) {
        const dx = cx - s.x
        const dy = cy - s.y
        const dist = Math.hypot(dx, dy)

        // Tangential spiral + radial attraction
        const angle = Math.atan2(dy, dx) +
          0.02 * (1 - this.convergenceProgress)

        const speed = (
          0.6 + (1 - s.z) * 1.2
        ) * this.convergenceProgress

        s.x += Math.cos(angle) * speed +
          (dx / Math.max(dist, 10)) * speed * 0.5

        s.y += Math.sin(angle) * speed +
          (dy / Math.max(dist, 10)) * speed * 0.5
      } else {
        // Normal drift
        s.x += s.vx
        s.y += s.vy

        // Wrap around bounds with gentle margin
        if (s.x < -30) s.x = w + 30
        if (s.x > w + 30) s.x = -30
        if (s.y < -30) s.y = h + 30
        if (s.y > h + 30) s.y = -30
      }

      // Pointer gentle repulsion
      if (this.mouseX > 0 && !isBrightest) {
        const pdx = s.x - this.mouseX
        const pdy = s.y - this.mouseY
        const pDist = Math.hypot(pdx, pdy)

        if (pDist < 120 && pDist > 1) {
          const force = (1 - pDist / 120) * 1.5

          s.x += (pdx / pDist) * force
          s.y += (pdy / pDist) * force
        }
      }

      // Render Star Particle
      ctx.save()
      ctx.fillStyle = s.color
      ctx.globalAlpha = currentAlpha

      // Glow halo on larger/nearer stars
      if (s.size > 1.8) {
        ctx.shadowColor = s.color
        ctx.shadowBlur = s.size * 3.5
      }

      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()

      // Cross flare on brightest foreground stars
      if (s.size > 2.4 && s.z > 0.75 && twinkle > 0.6) {
        ctx.strokeStyle = `rgba(245, 240, 255, ${currentAlpha * 0.7})`
        ctx.lineWidth = 0.6

        const flareLen = s.size * 3.2

        ctx.beginPath()
        ctx.moveTo(s.x - flareLen, s.y)
        ctx.lineTo(s.x + flareLen, s.y)
        ctx.moveTo(s.x, s.y - flareLen)
        ctx.lineTo(s.x, s.y + flareLen)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  public destroy() {
    this.stars = []
    this.formulas = []
  }
}
