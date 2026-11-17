import { useState, useEffect } from 'react'
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
  const [typedLines, setTypedLines] = useState<number>(0)

  // Relative time in Scene 5 (starts at 50000ms)
  const t = sceneTimeMs - 50000

  // Auto-open envelope smoothly after a brief 2.2-second pause in Scene 5 if user hasn't clicked
  useEffect(() => {
    if (isActive && t >= 2200 && !isOpen) {
      handleOpen()
    }
  }, [isActive, t, isOpen])

  // Progressively reveal letter paragraphs
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setTypedLines(prev => {
        if (prev < LETTER_PARAGRAPHS.length) {
          return prev + 1
        }
        clearInterval(interval)
        return prev
      })
    }, 900)
    return () => clearInterval(interval)
  }, [isOpen])

  const handleOpen = () => {
    if (isOpen) return
    setIsOpen(true)
    universeAudio.playLetterOpen()
  }

  if (!isActive) return null

  const isComplete = typedLines >= LETTER_PARAGRAPHS.length

  return (
    <div className={`letter-reveal-container ${isOpen ? 'is-opened' : ''}`}>
      {/* 3D Envelope Container */}
      <div
        className="vintage-envelope-3d"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để mở lá thư tri ân"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleOpen() }}
      >
        {/* Envelope Back Flap */}
        <div className="env-back" />

        {/* Parchment Letter Paper Sliding Out */}
        <div className={`env-letter-paper ${isOpen ? 'slid-out' : ''}`}>
          <div className="paper-crest">❦ 9H2 ❦</div>
          <div className="letter-body">
            {LETTER_PARAGRAPHS.map((para, i) => (
              <p
                key={i}
                className={`letter-line ${i < typedLines ? 'visible' : ''} ${i === 0 ? 'salutation' : ''} ${i === 4 ? 'signature' : ''}`}
                style={{
                  transitionDelay: `${i * 180}ms`,
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

        {/* Envelope Front Pocket & Seal */}
        <div className="env-pocket" />
        <div className={`env-flap ${isOpen ? 'flap-open' : ''}`} />

        {/* Antique Gold Wax Seal with 9H2 Crest */}
        <div
          className={`wax-seal-crest ${isOpen ? 'seal-broken' : ''}`}
          title="Ấn sáp niêm phong 9H2"
        >
          <div className="seal-outer-rim" />
          <div className="seal-monogram">9H2</div>
        </div>
      </div>

      {/* Gentle Tap Hint prior to opening */}
      {!isOpen && (
        <div className="open-envelope-hint">
          <p className="hint-text">Chạm vào lá thư để mở</p>
          <span className="hint-sparkle">✦</span>
        </div>
      )}

      {/* Final Grand Message & Enter Button */}
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
            autoFocus
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
