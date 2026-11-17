import { useEffect, useRef } from 'react'

const GRATITUDE_PARAGRAPHS = [
  'Kính gửi Cô giáo chủ nhiệm thân mến của chúng em,',
  'Chúng em chân thành cảm ơn cô vì tất cả những điều cô đã âm thầm dành cho tập thể 9H2 trong suốt thời gian qua.',
  'Môn Toán tuy khô khan và đầy những phép tính phức tạp, nhưng khi cô dạy chúng em, nó đã trở thành một phần kiến thức thú vị và khơi gợi sự chú ý, hứng thú đặc biệt trong mỗi người chúng em.',
  'Đôi lúc cô có hơi nghiêm khắc và quát nạt, nhưng tất cả chúng em đều hiểu sâu sắc rằng cô cũng chỉ muốn tốt cho lớp hơn, rèn cho chúng em tính kỷ luật và giúp chúng em chú ý học hành thật nghiêm túc.',
  'Sau tất cả, nhân dịp ngày Nhà giáo Việt Nam 20/11, cả tập thể lớp 9H2 xin kính chúc mừng cô một ngày 20/11 thật nhiều niềm vui, ấm áp và tràn ngập tiếng cười.',
  'Chúng em kính chúc cô luôn dồi dào sức khỏe, luôn hạnh phúc, bình an trong cuộc sống và mãi giữ trọn ngọn lửa nhiệt huyết với sự nghiệp trồng người cao quý.',
]

export function Gratitude() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.15 }
    )

    const reveals = containerRef.current?.querySelectorAll('.reveal-line')
    reveals?.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section id="gratitude" className="section gratitude-section">
      <div className="section-head text-center">
        <p className="kicker">PHẦN 04</p>
        <h2 className="section-title">Our Gratitude</h2>
        <p className="section-subtitle">
          Bức thư mộc mạc gửi trọn tấm lòng tri ân của từng cô cậu học trò lớp 9H2
        </p>
      </div>

      <div ref={containerRef} className="paper gratitude-letter">
        <div className="letter-deckle-edge" aria-hidden="true" />
        <div className="letter-wax-seal" aria-hidden="true">
          <span className="seal-emblem">9H2</span>
        </div>

        <div className="letter-header-meta">
          <span className="letter-location">Hà Nội, Ngày 20 tháng 11 năm 2026</span>
          <span className="letter-recipient">Kính gửi: Cô giáo Chủ nhiệm Lớp 9H2</span>
        </div>

        <div className="letter-content-body">
          {GRATITUDE_PARAGRAPHS.map((para, index) => (
            <p
              key={index}
              className={`reveal-line ${index === 0 ? 'salutation' : ''}`}
              style={{ transitionDelay: `${index * 130}ms` }}
            >
              {para}
            </p>
          ))}
        </div>

        <div className="divider-flourish" aria-hidden="true">❦</div>

        <div className="letter-signature-block reveal-line">
          <p className="hand signature-lead">Kính thư với tất cả lòng biết ơn và yêu quý,</p>
          <p className="signature-collective hand">Tập thể Học sinh Lớp 9H2</p>
          <div className="class-stamp">
            <span>CHI ĐỘI 9H2 • NIÊN KHÓA TRƯỞNG THÀNH</span>
          </div>
        </div>
      </div>
    </section>
  )
}
