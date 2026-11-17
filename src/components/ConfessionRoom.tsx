import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Confession, Comment } from '../types'
import { ReportModal } from './ReportModal'

const INITIAL_CONFESSIONS: Confession[] = [
  {
    id: 'conf-1',
    pen_name: 'Một mầm non sợ Toán hình',
    category: 'Chuyện giờ Toán',
    content: 'Có hôm cô gọi lên bảng chữa bài hình không gian, em run quá vẽ luôn cái hình chóp lệch hẳn sang một bên. Cô bảo: "Vẽ cái đỉnh thế này thì gió thổi một cái là đổ mất tiêu!". Lúc đó quê một cục nhưng nhớ mãi lời cô chữa.',
    status: 'approved',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'conf-2',
    pen_name: 'Tổ 3 bí ẩn',
    category: 'Ăn vụng thần sầu',
    content: 'Thật ra hôm cô bảo "Cô ngửi thấy mùi ổi ở đâu đây nhé", chính là tổ chúng em đang lén chấm muối ớt dưới ngăn bàn. Sau hôm đó cả tổ thề là không dám mang đồ ăn vào tiết cô nữa, sợ cô vừa buồn vừa đói!',
    status: 'approved',
    created_at: '2026-11-04T15:20:00Z',
  },
  {
    id: 'conf-3',
    pen_name: 'Chiến thần bàn cuối',
    category: 'Lời thú tội chân thành',
    content: 'Đôi lúc cô quát to vì lớp mất trật tự, em cũng thấy hơi sợ. Nhưng khi nhìn thấy mắt cô đỏ và giọng khản đặc sau 4 tiết liền, em mới thấy thương cô vô cùng. Cảm ơn cô vì đã không bao giờ bỏ cuộc với lớp chúng em.',
    status: 'approved',
    created_at: '2026-11-08T18:40:00Z',
  },
  {
    id: 'conf-4',
    pen_name: 'Cựu học sinh ngủ gật',
    category: 'Bí mật lớp học',
    content: 'Có lần em ngủ gật trong giờ, bị cô gõ thước lên bàn. Em giật mình đứng dậy hô "Dạ có em!". Cả lớp cười ầm lên, cô cũng bật cười rồi đưa cho em cốc nước bảo ra rửa mặt cho tỉnh. Khoảnh khắc ấy ấm áp đến tận bây giờ.',
    status: 'approved',
    created_at: '2026-11-12T09:15:00Z',
  }
]

const CONFESSION_REACTIONS = [
  { type: 'laugh', emoji: '😂', label: 'Cười xỉu' },
  { type: 'agree', emoji: '🤝', label: 'Đồng cảm' },
  { type: 'heart', emoji: '❤️', label: 'Thương ghê' },
  { type: 'tear', emoji: '🥺', label: 'Rưng rưng' },
]

function getClientHash(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('client_hash_id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 12)
    localStorage.setItem('client_hash_id', id)
  }
  return id
}

export function ConfessionRoom() {
  const [confessions, setConfessions] = useState<Confession[]>(INITIAL_CONFESSIONS)
  const [activeConfession, setActiveConfession] = useState<Confession | null>(null)
  const [reportingConfession, setReportingConfession] = useState<Confession | null>(null)

  // Form state
  const [penName, setPenName] = useState('')
  const [category, setCategory] = useState('Chuyện giờ Toán')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Modal comments & reactions
  const [comments, setComments] = useState<Comment[]>([])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({})

  const clientHash = getClientHash()

  // Fetch approved confessions from Supabase
  const fetchConfessions = async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      setConfessions(data)
    }
  }

  useEffect(() => {
    fetchConfessions()
  }, [])

  // Load comments and reactions for active confession
  useEffect(() => {
    if (!activeConfession || !supabase) return

    // Comments
    supabase
      .from('comments')
      .select('*')
      .eq('target_type', 'confession')
      .eq('target_id', activeConfession.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data)
      })

    // Reactions
    supabase
      .from('reactions')
      .select('reaction_type, client_hash')
      .eq('target_type', 'confession')
      .eq('target_id', activeConfession.id)
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {}
          const userHas: Record<string, boolean> = {}
          data.forEach(r => {
            counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1
            if (r.client_hash === clientHash) userHas[r.reaction_type] = true
          })
          setReactions(counts)
          setUserReacted(userHas)
        }
      })
  }, [activeConfession, clientHash])

  // Handle reaction toggle
  const handleToggleReaction = async (reactionType: string) => {
    if (!activeConfession || !supabase) return
    const isReacted = userReacted[reactionType]

    setUserReacted(prev => ({ ...prev, [reactionType]: !isReacted }))
    setReactions(prev => ({
      ...prev,
      [reactionType]: Math.max(0, (prev[reactionType] || 0) + (isReacted ? -1 : 1)),
    }))

    if (isReacted) {
      await supabase
        .from('reactions')
        .delete()
        .eq('target_type', 'confession')
        .eq('target_id', activeConfession.id)
        .eq('reaction_type', reactionType)
        .eq('client_hash', clientHash)
    } else {
      await supabase.from('reactions').insert({
        target_type: 'confession',
        target_id: activeConfession.id,
        reaction_type: reactionType,
        client_hash: clientHash,
      })
    }
  }

  // Handle submit confession
  const handleSubmitConfession = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (trimmed.length < 5) {
      setStatusMsg({ ok: false, text: 'Nội dung thú tội cần ít nhất 5 ký tự.' })
      return
    }

    setIsSubmitting(true)
    setStatusMsg(null)

    const finalPenName = penName.trim() || 'Ẩn danh 9H2'

    if (supabase) {
      const { error } = await supabase.from('confessions').insert({
        pen_name: finalPenName,
        category,
        content: trimmed,
        status: 'pending',
      })

      setIsSubmitting(false)

      if (error) {
        setStatusMsg({ ok: false, text: 'Gửi thất bại. Vui lòng thử lại sau.' })
      } else {
        setContent('')
        setPenName('')
        setStatusMsg({
          ok: true,
          text: '🤫 Bí mật của bạn đã được gửi an toàn vào chiếc hộp bí mật! Sẽ được hiển thị sau khi ban cán sự duyệt.',
        })
      }
    } else {
      setIsSubmitting(false)
      const mock: Confession = {
        id: `conf-local-${Date.now()}`,
        pen_name: finalPenName,
        category,
        content: trimmed,
        status: 'approved',
        created_at: new Date().toISOString(),
      }
      setConfessions(prev => [mock, ...prev])
      setContent('')
      setPenName('')
      setStatusMsg({
        ok: true,
        text: '🤫 Đã đăng thú tội thành công!',
      })
    }
  }

  // Add comment
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeConfession || !supabase || !commentText.trim()) return

    const { data, error } = await supabase
      .from('comments')
      .insert({
        target_type: 'confession',
        target_id: activeConfession.id,
        author_name: commentName.trim() || 'Học sinh 9H2',
        content: commentText.trim().slice(0, 500),
        status: 'approved',
      })
      .select()
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
  }

  return (
    <section id="confessions" className="section confessions-section">
      <div className="section-head text-center">
        <p className="kicker">PHẦN 03</p>
        <h2 className="section-title">Confession Room</h2>
        <p className="section-subtitle">
          Góc thú tội đáng yêu & những chuyện chưa kể — nơi cất giữ những kỷ niệm nghịch ngợm không ai dám nói trực tiếp với cô
        </p>
      </div>

      {/* Secret Submission Form */}
      <div className="paper form-card confession-box-card">
        <div className="confession-stamp">SECRET • 9H2</div>
        <h3 className="form-title">Gửi Chuyện Chưa Kể Vào Hộp Bí Mật</h3>
        <p className="form-desc">
          Những lần ăn vụng, những lần quên làm bài tập, hay những khoảnh khắc làm cô giận rồi thầm hối hận... Mọi chia sẻ đều được bảo mật ẩn danh hoàn toàn.
        </p>

        <form onSubmit={handleSubmitConfession} className="confession-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label" htmlFor="conf-pen-name">
                Bút danh ngộ nghĩnh
              </label>
              <input
                id="conf-pen-name"
                type="text"
                placeholder="Ví dụ: Một mầm non sợ kiểm tra, Học sinh bàn 4..."
                value={penName}
                maxLength={50}
                onChange={e => setPenName(e.target.value)}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="conf-category">
                Chủ đề câu chuyện
              </label>
              <select
                id="conf-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="text-input"
              >
                <option value="Chuyện giờ Toán">Chuyện giờ Toán</option>
                <option value="Ăn vụng thần sầu">Ăn vụng thần sầu</option>
                <option value="Lời thú tội chân thành">Lời thú tội chân thành</option>
                <option value="Bí mật lớp học">Bí mật lớp học</option>
                <option value="Chọc cô cười">Chọc cô cười</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="conf-content">
              Câu chuyện của bạn <span className="req">*</span>
            </label>
            <textarea
              id="conf-content"
              rows={4}
              placeholder="Kể lại câu chuyện thật lòng, nhẹ nhàng và ấm áp nhé…"
              value={content}
              maxLength={1000}
              onChange={e => setContent(e.target.value)}
              className="text-area"
              required
            />
          </div>

          <div className="form-footer">
            <span className="conf-notice">🔒 Không công khai thông tin cá nhân. Nội dung sẽ được kiểm duyệt trước khi xuất hiện.</span>
            <button type="submit" className="btn primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Đang thả vào hòm thư…' : 'Gửi thú tội bí mật 🤫'}
            </button>
          </div>

          {statusMsg && (
            <div className={`feedback-alert ${statusMsg.ok ? 'success' : 'error'}`}>
              {statusMsg.text}
            </div>
          )}
        </form>
      </div>

      {/* Confession Cards Grid */}
      <div className="confessions-grid">
        {confessions.map((c, i) => {
          const rotation = ((i * 23) % 9) - 4
          return (
            <article
              key={c.id}
              className="confession-sticky-note paper"
              style={{ ['--r' as string]: `${rotation}deg` }}
              onClick={() => setActiveConfession(c)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveConfession(c)
                }
              }}
              aria-label={`Câu chuyện từ ${c.pen_name}`}
            >
              <div className="pushpin" aria-hidden="true" />
              <div className="sticky-header">
                <span className="sticky-tag">{c.category}</span>
                <span className="sticky-time">
                  {new Date(c.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="sticky-content">{c.content}</p>
              <div className="sticky-footer">
                <span className="sticky-author hand">— {c.pen_name}</span>
                <span className="sticky-click-hint">Đọc & Thả tim ↗</span>
              </div>
            </article>
          )
        })}
      </div>

      {/* Confession Detail Modal */}
      {activeConfession && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setActiveConfession(null)}>
          <div className="paper modal-content confession-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="badge-tag">{activeConfession.category}</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveConfession(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="confession-full-content">
              <p>{activeConfession.content}</p>
            </div>

            <div className="confession-signature">
              <span className="hand-sig">— {activeConfession.pen_name}</span>
            </div>

            <div className="divider-flourish" aria-hidden="true">❦</div>

            {/* Reactions bar */}
            <div className="reactions-container">
              <span className="reactions-title">Cảm xúc của bạn:</span>
              <div className="reactions-buttons">
                {CONFESSION_REACTIONS.map(r => {
                  const count = reactions[r.type] || 0
                  const active = Boolean(userReacted[r.type])
                  return (
                    <button
                      key={r.type}
                      type="button"
                      className={`reaction-pill ${active ? 'active' : ''}`}
                      onClick={() => handleToggleReaction(r.type)}
                      title={r.label}
                      aria-label={`${r.label}: ${count}`}
                    >
                      <span className="pill-emoji">{r.emoji}</span>
                      <span className="pill-count">{count > 0 ? count : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="comments-section">
              <h4 className="comments-heading">Bình luận & Chia sẻ ({comments.length})</h4>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">Chưa có bình luận nào cho câu chuyện này.</p>
                ) : (
                  comments.map(cm => (
                    <div key={cm.id} className="comment-item">
                      <div className="comment-author-row">
                        <strong>{cm.author_name}</strong>
                        <span className="comment-time">
                          {new Date(cm.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="comment-body">{cm.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="add-comment-form">
                <input
                  type="text"
                  placeholder="Tên của bạn"
                  value={commentName}
                  maxLength={50}
                  onChange={e => setCommentName(e.target.value)}
                  className="comment-name-input"
                />
                <div className="comment-submit-row">
                  <input
                    type="text"
                    placeholder="Viết phản hồi vui vẻ…"
                    value={commentText}
                    maxLength={300}
                    onChange={e => setCommentText(e.target.value)}
                    className="comment-text-input"
                  />
                  <button type="submit" className="btn sm-btn" disabled={!commentText.trim()}>
                    Gửi
                  </button>
                </div>
              </form>
            </div>

            <div className="modal-bottom-actions">
              <button
                type="button"
                className="report-link"
                onClick={() => setReportingConfession(activeConfession)}
              >
                🚩 Báo cáo nội dung không phù hợp
              </button>
              <button
                type="button"
                className="btn ghost-btn"
                onClick={() => setActiveConfession(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingConfession && (
        <ReportModal
          targetType="confession"
          targetId={reportingConfession.id}
          targetExcerpt={reportingConfession.content}
          onClose={() => setReportingConfession(null)}
        />
      )}
    </section>
  )
}
