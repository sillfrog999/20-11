import { useState, useEffect } from 'react'
import { universeAudio } from './universeAudio'

interface LetterRevealProps {
  sceneTimeMs: number
  isActive: boolean
  onEnterSite: () => void
}

const LETTER_PARAGRAPHS = [
  'Kính gửi Cô giáo kính yêu của chúng em,',
  'Từ những vì sao nhỏ còn ngây ngô vụng dại của tập thể 9H2, chúng em xin gửi đến cô lời cảm ơn chân thành và sâu sắc nhất vì đã luôn là bến đỗ bình yên, là người đồng hành dịu dàng trong suốt năm tháng thanh xuân của chúng em.',
  'Từng bài học cô dạy, từng lời nhắc nhở ân cần và từng ánh mắt bao dung của cô đều đã hóa thành những vì tinh tú rạng ngời trong vũ trụ ký ức của lớp mình.',
  'Nhân ngày Nhà giáo Việt Nam 20.11, chúng em kính chúc cô luôn ngập tràn niềm vui, nhiều sức khỏe và mãi giữ trọn nụ cười ấm áp cùng ngọn lửa nhiệt huyết bên các thế hệ học trò.',
  'Với trọn vẹn yêu thương và lòng biết ơn sâu sắc,\nTập thể Lớp 9H2 gửi tặng Cô.'
]

export function LetterReveal({ sceneTimeMs, isActive, onEnterSite }: LetterRevealProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [typedLines, setTypedLines] = useState<number>(0)

  // Thời gian bắt đầu Cảnh 5 (từ giây thứ 50)
  const t = sceneTimeMs - 50000

  // Tự động mở thư sau 2.2 giây nếu người xem chưa bấm
  useEffect(() => {
    if (isActive && t >= 2200 && !isOpen) {
      handleOpen()
    }
  }, [isActive, t, isOpen])

  // Hiệu ứng lần lượt từng đoạn văn xuất hiện mượt mà
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
      {/* Khối phong bì cổ điển 3D */}
      <div
        className="vintage-envelope-3d"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để mở lá thư tri ân"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleOpen() }}
      >
        <div className="env-back" />

        {/* Giấy da trượt lên nhẹ nhàng */}
        <div className={`env-letter-paper ${isOpen ? 'slid-out' : ''}`}>
          <div className="paper-crest">❦ GỬI NGƯỜI CÔ KÍNH YÊU • TẬP THỂ 9H2 ❦</div>
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

        <div className="env-pocket" />
        <div className={`env-flap ${isOpen ? 'flap-open' : ''}`} />

        {/* Con dấu sáp hoàng kim khắc 9H2 */}
        <div
          className={`wax-seal-crest ${isOpen ? 'seal-broken' : ''}`}
          title="Dấu sáp Lớp 9H2"
        >
          <div className="seal-outer-rim" />
          <div className="seal-monogram">9H2</div>
        </div>
      </div>

      {/* Gợi ý mở phong bì */}
      {!isOpen && (
        <div className="open-envelope-hint">
          <p className="hint-text">Chạm nhẹ để mở lá thư của chúng em</p>
          <span className="hint-sparkle">✦</span>
        </div>
      )}

      {/* Thông điệp kết và nút bước vào website */}
      {isOpen && (
        <div className={`enter-action-wrapper ${isComplete ? 'show-enter' : ''}`}>
          <div className="closing-quote-box">
            <p className="quote-main">"Mỗi vì sao đều mang một ánh sáng riêng."</p>
            <p className="quote-sub">"Cảm ơn cô vì đã nâng niu và giúp chúng em tỏa sáng."</p>
          </div>

          <button
            type="button"
            className="enter-memories-btn"
            onClick={onEnterSite}
            autoFocus
          >
            <span className="btn-starlight" aria-hidden="true">✦</span>
            <span className="btn-label">BƯỚC VÀO MIỀN KÝ ỨC CỦA CHÚNG EM</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  )
}
