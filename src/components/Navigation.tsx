import { useState } from 'react'
import { AudioPlayer } from './AudioPlayer'

interface NavigationProps {
  flowersOn: boolean
  onToggleFlowers: () => void
  onOpenAdmin: () => void
  onReplayIntro?: () => void
}

export function Navigation({ flowersOn, onToggleFlowers, onOpenAdmin, onReplayIntro }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="site-nav">
      <div className="nav-container">
        <a href="#top" className="nav-brand">
          <span className="brand-crest" aria-hidden="true">❦</span>
          <span className="brand-text">A LETTER FOR YOU</span>
          <span className="brand-sub">CLASS 9H2</span>
        </a>

        {/* Mobile toggle button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Menu điều hướng"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#messages" onClick={handleNavClick}>
            <span className="nav-num">01</span> Lời Chúc
          </a>
          <a href="#memories" onClick={handleNavClick}>
            <span className="nav-num">02</span> Kỷ Niệm
          </a>
          <a href="#confessions" onClick={handleNavClick}>
            <span className="nav-num">03</span> Thú Tội
          </a>
          <a href="#gratitude" onClick={handleNavClick}>
            <span className="nav-num">04</span> Tri Ân
          </a>
          <a href="#gift" onClick={handleNavClick}>
            <span className="nav-num">05</span> Hộp Quà
          </a>

          <div className="nav-divider" aria-hidden="true" />

          <div className="nav-controls">
            {onReplayIntro && (
              <button
                type="button"
                className="nav-btn replay-intro-nav-btn"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onReplayIntro()
                }}
                title="Xem lại Cinematic 60s Universe Intro"
              >
                <span className="btn-icon">✨</span>
                <span className="btn-text">Vũ Trụ 9H2</span>
              </button>
            )}

            <button
              type="button"
              className={`nav-btn flower-toggle ${flowersOn ? 'active' : ''}`}
              onClick={onToggleFlowers}
              title={flowersOn ? 'Tắt hiệu ứng hoa rơi' : 'Bật hiệu ứng hoa rơi'}
              aria-pressed={flowersOn}
            >
              <span className="btn-icon">🌹</span>
              <span className="btn-text">{flowersOn ? 'Tắt hoa' : 'Bật hoa'}</span>
            </button>

            <AudioPlayer />

            <button
              type="button"
              className="nav-btn admin-link"
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenAdmin()
              }}
              title="Khu vực quản trị"
            >
              🔒 Quản trị
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
