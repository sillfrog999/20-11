// Falling Flowers Engine: Pool-based, CSS transform/opacity only, zero per-frame JS.
// Features: 💐 and 🌹 alternating naturally, gentle continuous drift, device-aware density,
// tab visibility pause, reduced-motion compliance, and celebration burst.

const FLOWERS = ['💐', '🌹']

export function startFlowers(root: HTMLElement) {
  let counter = 0
  let isEnabled = true
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const count = isMobile ? 7 : 16

  const pool: HTMLElement[] = []

  const resetFlower = (el: HTMLElement, initial = false) => {
    el.textContent = FLOWERS[counter++ % FLOWERS.length]
    const s = el.style

    // Randomize initial horizontal position
    const leftPercent = Math.random() * 96 + 2 // 2% to 98%
    s.left = `${leftPercent}vw`

    // Randomize flower size (subtle variance)
    const fontSize = isMobile ? 18 + Math.random() * 12 : 20 + Math.random() * 16
    s.fontSize = `${fontSize}px`

    // Natural swaying parameters via CSS custom properties
    const dx = (Math.random() * 140 - 70) // -70px to +70px drift
    const rot = (Math.random() * 480 - 240) // -240deg to +240deg rotation
    s.setProperty('--dx', `${dx}px`)
    s.setProperty('--rot', `${rot}deg`)

    // Timing
    const duration = 10 + Math.random() * 8 // 10s to 18s gentle descent
    s.animationDuration = `${duration}s`
    s.animationDelay = initial ? `${Math.random() * 10}s` : '0s'

    // Force retrigger
    s.animationName = 'none'
    void el.offsetWidth
    s.animationName = ''
  }

  const createFlower = (burst = false) => {
    const el = document.createElement('span')
    el.className = 'flower' + (burst ? ' burst' : '')
    resetFlower(el, !burst)

    if (burst) {
      // Burst starts from center area and floats outward
      const originX = 50 + (Math.random() * 40 - 20)
      el.style.left = `${originX}vw`
      el.style.top = `${40 + (Math.random() * 20 - 10)}vh`
      el.style.setProperty('--dx', `${(Math.random() * 400 - 200)}px`)
      el.style.setProperty('--rot', `${(Math.random() * 720 - 360)}deg`)
      el.style.animationDuration = `${4 + Math.random() * 4}s`
    }

    el.addEventListener('animationend', () => {
      if (burst) {
        el.remove()
      } else {
        if (isEnabled) {
          resetFlower(el, false)
        } else {
          el.style.display = 'none'
        }
      }
    })

    root.appendChild(el)
    if (!burst) pool.push(el)
  }

  // Populate persistent pool
  for (let i = 0; i < count; i++) {
    createFlower(false)
  }

  // Tab visibility handling
  const handleVisibilityChange = () => {
    root.classList.toggle('paused', document.hidden)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return {
    burst(amount?: number) {
      if (!isEnabled) return
      const burstCount = amount ?? (isMobile ? 14 : 26)
      for (let i = 0; i < burstCount; i++) {
        createFlower(true)
      }
    },
    setEnabled(value: boolean) {
      isEnabled = value
      root.style.display = value ? '' : 'none'
      pool.forEach(el => {
        el.style.display = value ? '' : 'none'
        if (value) resetFlower(el, true)
      })
    },
    stop() {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      root.textContent = ''
      pool.length = 0
    }
  }
}
