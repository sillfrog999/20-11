// Pool-based falling flowers: CSS transform/opacity only, no per-frame JS, no React re-render.
const EMOJI = ['💐', '🌹']
export function startFlowers(root: HTMLElement) {
  let k = 0, on = true
  const small = window.innerWidth < 700
  const make = (burst: boolean) => {
    const el = document.createElement('span')
    el.className = 'flower'
    const go = (first: boolean) => {
      el.textContent = EMOJI[k++ % 2]
      const s = el.style
      s.left = Math.random() * 100 + 'vw'
      s.fontSize = 16 + Math.random() * 20 + 'px'
      s.setProperty('--dx', (Math.random() * 160 - 80) + 'px')
      s.setProperty('--rot', (Math.random() * 540 - 270) + 'deg')
      s.animationDuration = 9 + Math.random() * 9 + 's'
      s.animationDelay = first ? Math.random() * 9 + 's' : '0s'
      s.animationName = 'none'; void el.offsetWidth; s.animationName = ''
    }
    go(true)
    el.addEventListener('animationend', () => (burst ? el.remove() : on ? go(false) : (el.style.display = 'none')))
    root.appendChild(el)
  }
  for (let i = 0; i < (small ? 6 : 15); i++) make(false)
  const vis = () => root.classList.toggle('paused', document.hidden)
  document.addEventListener('visibilitychange', vis)
  return {
    burst(n = small ? 14 : 30) { if (on) for (let i = 0; i < n; i++) make(true) },
    setEnabled(v: boolean) { on = v; root.style.display = v ? '' : 'none'; if (v) root.querySelectorAll<HTMLElement>('.flower').forEach(e => (e.style.display = '')) },
    stop() { document.removeEventListener('visibilitychange', vis); root.textContent = '' },
  }
}
