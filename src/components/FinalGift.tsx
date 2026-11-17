import { useState } from 'react'

interface FinalGiftProps {
  onOpenGift: () => void
}

export function FinalGift({ onOpenGift }: FinalGiftProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  const handleOpen = () => {
    if (isOpen || isOpening) return
    setIsOpening(true)
    onOpenGift()
    setTimeout(() => {
      setIsOpen(true)
      setIsOpening(false)
    }, 900)
  }

  const handleReplay = () => {
    setIsOpen(false)
    setIsOpening(false)
  }

  return (
    <section id="gift" className="section gift-section">
      <div className="section-head text-center">
        <p className="kicker">PHẦN 05 • KẾT LẠI</p>
        <h2 className="section-title">The Final Gift</h2>
        <p className="section-subtitle">
          Món quà tinh thần đặc biệt được gói ghém bằng tất cả sự kính trọng và tình yêu thương của lớp 9H2
        </p>
      </div>

      <div className="gift-stage-wrapper">
        {!isOpen && (
          <div className="gift-box-container">
            <button
              type="button"
              className={`gift-box-btn ${isOpening ? 'opening' : ''}`}
              onClick={handleOpen}
              aria-label="Chạm để mở món quà tri ân"
              disabled={isOpening}
            >
              <div className="box-lid">
                <div className="ribbon-bow">
                  <span className="bow-loop left" />
                  <span className="bow-loop right" />
                  <span className="bow-center" />
                </div>
                <div className="lid-stripe" />
              </div>

              <div className="box-body">
                <div className="box-ribbon-v" />
                <div className="box-ribbon-h" />
                <div className="box-seal">
                  <span>9H2</span>
                </div>
              </div>
            </button>

            <p className="gift-prompt hand">
              {isOpening ? 'Đang mở món quà…' : 'Chạm vào hộp quà để mở điều bất ngờ ❦'}
            </p>
          </div>
        )}

        {isOpen && (
          <div className="gift-reveal-card paper finale-card">
            <div className="certificate-border">
              <div className="cert-crest">
                <span className="crest-star">★ ★ ★ ★ ★</span>
                <span className="crest-title">CHỨNG NHẬN ĐẶC BIỆT</span>
              </div>

              <h3 className="cert-main-heading">NGƯỜI LÁI ĐÒ TUYỆT VỜI NHẤT</h3>
              <p className="cert-subhead hand">Kính trao: Cô giáo Chủ nhiệm kính yêu của tập thể 9H2</p>

              <div className="cert-message">
                <p>
                  Nhân ngày <strong>Nhà giáo Việt Nam 20/11</strong>, 45 thành viên của lớp 9H2 xin gửi tặng cô danh hiệu
                  người cô kiên nhẫn nhất, tận tâm nhất và truyền cảm hứng nhất!
                </p>
                <p>
                  Cảm ơn cô vì đã kiên trì giảng từng bài toán khó, cảm ơn những lời răn dạy nghiêm khắc đã giúp chúng em
                  nên người, và cảm ơn cô vì đã luôn tin tưởng lớp 9H2 ngay cả khi chúng em vụng về nhất.
                </p>
                <p className="cert-highlight hand">
                  "Ơn dạy dỗ cao dường hơn núi, nghĩa thầy cô như biển rộng bao la."
                </p>
              </div>

              <div className="cert-signatures">
                <div className="sig-item">
                  <span className="sig-role">Đại diện tập thể</span>
                  <span className="hand sig-name">Lớp 9H2</span>
                </div>
                <div className="cert-golden-seal">
                  <div className="seal-inner">
                    <span>TRI ÂN</span>
                    <strong>20.11</strong>
                    <small>MÃI NHỚ ƠN CÔ</small>
                  </div>
                </div>
                <div className="sig-item">
                  <span className="sig-role">Niên khóa</span>
                  <span className="hand sig-name">2026 - 2027</span>
                </div>
              </div>

              <div className="finale-action-bar">
                <button
                  type="button"
                  className="btn ghost-btn"
                  onClick={handleReplay}
                >
                  Gói lại món quà ↺
                </button>
                <button
                  type="button"
                  className="btn primary-btn"
                  onClick={onOpenGift}
                >
                  Tung thêm hoa chúc mừng cô 💐
                </button>
                <a href="#messages" className="btn ghost-btn">
                  Viết thêm lời chúc ✉
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
