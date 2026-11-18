import { useEffect, useRef, useState } from 'react'
import { startFlowers } from './lib/flowers'
import { musicEngine } from './lib/audio'
import { Navigation } from './components/Navigation'
import { Greetings } from './components/Greetings'
import { Memories } from './components/Memories'
import { ConfessionRoom } from './components/ConfessionRoom'
import { Gratitude } from './components/Gratitude'
import { FinalGift } from './components/FinalGift'
import { AdminPanel } from './components/AdminPanel'
import { UniverseIntro } from './components/universe/UniverseIntro'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [opening, setOpening] = useState(false)
  const [flowersOn, setFlowersOn] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)

  const layer = useRef<HTMLDivElement>(null)
  const flowersController = useRef<ReturnType<typeof startFlowers> | null>(null)
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Setup background music autoplay starting from Track 1 (3m20s)
  useEffect(() => {
    musicEngine.play().catch(() => {})

    const unlock = () => {
      musicEngine.play().catch(() => {})
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('click', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
  }, [])

  // Initialize falling flowers
  useEffect(() => {
    if (!layer.current || reducedMotion) return
    flowersController.current = startFlowers(layer.current)
    return () => flowersController.current?.stop()
  }, [reducedMotion])

  // Sync flowers enabled state
  useEffect(() => {
    flowersController.current?.setEnabled(flowersOn)
  }, [flowersOn])

  // Check URL route for /admin or #admin
  useEffect(() => {
    const checkRoute = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setShowAdmin(true)
        setEntered(true)
      }
    }
    checkRoute()
    window.addEventListener('popstate', checkRoute)
    return () => window.removeEventListener('popstate', checkRoute)
  }, [])

  // Enter experience
  const handleEnterExperience = () => {
    setOpening(true)
    // Start gentle music upon intentional user interaction
    musicEngine.play().catch(() => {})

    setTimeout(() => {
      setEntered(true)
    }, reducedMotion ? 0 : 1200)
  }

  const handleOpenGiftBurst = () => {
    flowersController.current?.burst()
  }

  return (
    <div className="app-root">
      {/* Falling flowers container — hidden during Universe Intro */}
      <div ref={layer} className="flowers" aria-hidden="true" style={!entered ? { display: 'none' } : undefined} />

      {/* 60-Second Cinematic Universe Intro */}
      {!entered && (
        <UniverseIntro
          onComplete={() => {
            setEntered(true)
            musicEngine.play().catch(() => {})
          }}
        />
      )}

      {/* Main Experience */}
      {entered && (
        <>
          <Navigation
            flowersOn={flowersOn}
            onToggleFlowers={() => setFlowersOn(prev => !prev)}
            onOpenAdmin={() => setShowAdmin(true)}
            onReplayIntro={() => setEntered(false)}
          />

          <main id="top" className="main-content">
            {/* Hero Banner */}
            <section className="hero-editorial">
              <p className="kicker hero-kicker">TRI ÂN NGÀY NHÀ GIÁO VIỆT NAM 20.11</p>
              <h1 className="hero-headline">Người Gieo Hạt & Người Lái Đò</h1>
              <p className="hand hero-subscript">Dành tặng cô giáo chủ nhiệm với muôn vàn tình cảm của tập thể 9H2</p>
              <p className="hand hero-subscript">Muôn vàn tình cảm của tập thể 9H2 dành tặng cô Kiều Anh</p>
              <div className="hero-flourish" aria-hidden="true">❦</div>
            </section>

            {/* 01 Messages */}
            <Greetings />

            {/* 02 Memories */}
            <Memories />

            {/* 03 Confessions */}
            <ConfessionRoom />

            {/* 04 Gratitude */}
            <Gratitude />

            {/* 05 Final Gift */}
            <FinalGift onOpenGift={handleOpenGiftBurst} />
          </main>

          {/* Footer */}
          <footer className="site-footer">
            <div className="footer-container">
              <div className="footer-crest" aria-hidden="true">❦</div>
              <p className="hand footer-lead">Cảm ơn cô đã là người thầy, người cố vấn và ngôi sao dẫn đường của chúng em.</p>
              <p className="footer-copy">
                Thiết kế và thực hiện với trọn vẹn tình yêu thương bởi <strong>Tập thể Lớp 9H2</strong> • Niên khóa 2026 - 2027
              </p>
              <div className="footer-links">
                <a href="#top">Về đầu trang ↑</a>
                <button
                  type="button"
                  className="footer-admin-btn"
                  onClick={() => setEntered(false)}
                  title="Xem lại Cinematic 60-Second Universe Intro"
                >
                  ✨ Xem lại Universe Intro
                </button>
                <button
                  type="button"
                  className="footer-admin-btn"
                  onClick={() => setShowAdmin(true)}
                >
                  Khu vực Quản trị 9H2
                </button>
              </div>
            </div>
          </footer>

          {/* Admin Panel Modal */}
          {showAdmin && (
            <AdminPanel
              onClose={() => {
                setShowAdmin(false)
                if (window.location.hash === '#admin') {
                  history.pushState(null, '', window.location.pathname)
                }
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
