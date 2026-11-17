import { useState, useEffect, useCallback, useRef } from 'react'
import { universeAudio } from './universeAudio'

interface LetterRevealProps {
  sceneTimeMs: number
  isActive: boolean
  onEnterSite: () => void
}

const LETTER_PARAGRAPHS = [
  'Dear Teacher,',
  'From the little stars of class 9H2, we want to thank you for being a part of our journey.',
  'Every lesson, every memory, and every moment has become a part of our universe.',
  'Happy Vietnamese Teachers\' Day — 20.11.',
  'With love,\nClass 9H2.'
]

export function LetterReveal({ sceneTimeMs, isActive, onEnterSite }: LetterRevealProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [typedLines, setTypedLines] = useState(0)
  const openedRef = useRef(false)

  const t = sceneTimeMs - 50000
  const isComplete = typedLines >= LETTER_PARAGRAPHS.length

  const handleOpen = useCallback(() => {
    if (openedRef.current) return

    openedRef.current = true
    setIsOpen(true)
    universeAudio.playLetterOpen()
  }, [])

  useEffect(() => {
    if (isActive && t >= 2200 && !isOpen) {
      handleOpen()
    }
  }, [isActive, t, isOpen, handleOpen])

  useEffect(() => {
    if (!isActive || !isOpen || isComplete) return

    const interval = window.setInterval(() => {
      setTypedLines(current => Math.min(current + 1, LETTER_PARAGRAPHS.length))
    }, 850)

    return () => window.clearInterval(interval)
  }, [isActive, isOpen, isComplete])

  useEffect(() => {
    if (!isActive) {
      openedRef.current = false
      setIsOpen(false)
      setTypedLines(0)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className={`letter-reveal-container ${isOpen ? 'is-opened' : ''}`}>
      <div
        className="vintage-envelope-3d"
        onClick={handleOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để mở lá thư tri ân"
        aria-expanded={isOpen}
      >
        <div className="env-back" />

        <div className={`env-letter-paper ${isOpen ? 'slid-out' : ''}`}>
          <div className="paper-crest">❦ 9H2 ❦</div>

          <div className="letter-body">
            {LETTER_PARAGRAPHS.map((para, i) => (
              <p
                key={i}
                className={`letter-line ${i < typedLines ? 'visible' : ''} ${i === 0 ? 'salutation' : ''} ${i === 4 ? 'signature' : ''}`}
                style={{
                  transitionDelay: `${i * 120}ms`,
                  whiteSpace: 'pre-line'
                }}
              >
                {para}
              </p>
            ))}
          </div>

          <div className="letter-decor-footer" aria-hidden="true">
            <span className="star-divider">✦ ✦ ✦</span>
          </div>
        </div>

        <div className="env-pocket" />
        <div className={`env-flap ${isOpen ? 'flap-open' : ''}`} />

        <div
          className={`wax-seal-crest ${isOpen ? 'seal-broken' : ''}`}
          title="Ấn sáp niêm phong 9H2"
          aria-hidden="true"
        >
          <div className="seal-outer-rim" />
          <div className="seal-monogram">9H2</div>
        </div>
      </div>

      {!isOpen && (
        <div className="open-envelope-hint">
          <p className="hint-text">Chạm vào lá thư để mở</p>
          <span className="hint-sparkle" aria-hidden="true">✦</span>
        </div>
      )}

      {isOpen && (
        <div className={`enter-action-wrapper ${isComplete ? 'show-enter' : ''}`}>
          <div className="closing-quote-box">
            <p className="quote-main">"Every star has its own light.</p>
            <p className="quote-sub">Thank you for helping us shine."</p>
          </div>

          <button
            type="button"
            className="enter-memories-btn"
            onClick={onEnterSite}
            disabled={!isComplete}
            aria-label="Enter our memories"
          >
            <span className="btn-starlight" aria-hidden="true">✦</span>
            <span className="btn-label">ENTER OUR MEMORIES</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  )
}
