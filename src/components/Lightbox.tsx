import { useEffect } from 'react'
import { Memory } from '../types'

interface LightboxProps {
  memory: Memory
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function Lightbox({ memory, onClose, onPrev, onNext, hasPrev, hasNext }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lightbox-container" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-close"
          onClick={onClose}
          aria-label="Đóng xem kỷ niệm"
        >
          ✕
        </button>

        {hasPrev && (
          <button
            type="button"
            className="lightbox-nav prev"
            onClick={onPrev}
            aria-label="Kỷ niệm trước"
          >
            ‹
          </button>
        )}

        <div className="lightbox-media-wrapper">
          {memory.media_type === 'video' ? (
            <video
              src={memory.media_url}
              controls
              autoPlay
              playsInline
              className="lightbox-video"
            />
          ) : (
            <img
              src={memory.media_url}
              alt={memory.title}
              className="lightbox-image"
              loading="eager"
            />
          )}
        </div>

        {hasNext && (
          <button
            type="button"
            className="lightbox-nav next"
            onClick={onNext}
            aria-label="Kỷ niệm tiếp theo"
          >
            ›
          </button>
        )}

        <div className="lightbox-caption-card paper">
          <div className="caption-meta">
            <span className="badge-tag">{memory.tag || 'Khoảnh khắc 9H2'}</span>
            {memory.author_name && (
              <span className="caption-author">Gửi bởi: {memory.author_name}</span>
            )}
          </div>
          <h3 className="lightbox-title">{memory.title}</h3>
          <p className="lightbox-desc">{memory.caption}</p>
        </div>
      </div>
    </div>
  )
}
