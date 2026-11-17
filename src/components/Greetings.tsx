import { useEffect, useState, FormEvent, useCallback } from 'react'
import { supabase, configured } from '../lib/supabase'
import { Greeting, Comment } from '../types'
import { ReportModal } from './ReportModal'

const PAGE_SIZE = 9
const REACTION_TYPES = [
  { type: 'heart', emoji: '❤️', label: 'Yêu thích' },
  { type: 'flower', emoji: '🌸', label: 'Tặng hoa' },
  { type: 'hug', emoji: '🤗', label: 'Ấm áp' },
  { type: 'tear', emoji: '🥺', label: 'Cảm động' },
  { type: 'sparkle', emoji: '✨', label: 'Lấp lánh' },
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

export function Greetings() {
  const [items, setItems] = useState<Greeting[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeGreeting, setActiveGreeting] = useState<Greeting | null>(null)
  const [reportingGreeting, setReportingGreeting] = useState<Greeting | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [honeypot, setHoneypot] = useState('')

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'popular'>('all')

  // Comments for active modal
  const [comments, setComments] = useState<Comment[]>([])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null)

  // Reactions state for active modal (or local cache)
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({})

  const clientHash = getClientHash()

  // Load greetings
  const loadGreetings = useCallback(async (from = 0, append = false) => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    const query = supabase
      .from('greetings')
      .select('id, author_name, is_anonymous, content, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    const { data, error } = await query
    setLoading(false)

    if (error || !data) {
      setFeedback({ ok: false, message: 'Không thể tải danh sách lời chúc.' })
      return
    }

    setItems(prev => (append ? [...prev, ...data] : data))
    setHasMore(data.length === PAGE_SIZE)
  }, [])

  useEffect(() => {
    loadGreetings(0, false)
  }, [loadGreetings])

  // Load comments & reactions for active greeting
  useEffect(() => {
    if (!activeGreeting || !supabase) return

    // Load comments
    supabase
      .from('comments')
      .select('*')
      .eq('target_type', 'greeting')
      .eq('target_id', activeGreeting.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data)
      })

    // Load reactions count
    supabase
      .from('reactions')
      .select('reaction_type, client_hash')
      .eq('target_type', 'greeting')
      .eq('target_id', activeGreeting.id)
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {}
          const userHas: Record<string, boolean> = {}
          data.forEach(r => {
            counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1
            if (r.client_hash === clientHash) {
              userHas[r.reaction_type] = true
            }
          })
          setReactions(counts)
          setUserReacted(userHas)
        }
      })
  }, [activeGreeting, clientHash])

  // Submit new greeting
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting || honeypot) return

    const trimmedContent = content.trim()
    if (trimmedContent.length < 2) {
      setFeedback({ ok: false, message: 'Lời chúc quá ngắn. Vui lòng viết ít nhất 2 ký tự.' })
      return
    }
    if (trimmedContent.length > 1500) {
      setFeedback({ ok: false, message: 'Lời chúc không được vượt quá 1500 ký tự.' })
      return
    }
    if (!isAnonymous && !name.trim()) {
      setFeedback({ ok: false, message: 'Vui lòng nhập họ tên hoặc chọn "Gửi ẩn danh".' })
      return
    }
    if (!supabase) {
      setFeedback({ ok: false, message: 'Website chưa kết nối cơ sở dữ liệu Supabase.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    const { error } = await supabase.from('greetings').insert({
      author_name: isAnonymous ? null : name.trim().slice(0, 60),
      is_anonymous: isAnonymous,
      content: trimmedContent,
      status: 'pending',
    })

    setIsSubmitting(false)

    if (error) {
      setFeedback({ ok: false, message: 'Gửi thất bại. Vui lòng kiểm tra lại kết nối và thử lại.' })
    } else {
      setContent('')
      setName('')
      setFeedback({
        ok: true,
        message: '💌 Lời chúc của bạn đã được gửi gắm thành công! Lời chúc sẽ xuất hiện trên bảng sau khi được ban cán sự duyệt.',
      })
    }
  }

  // Handle reaction click
  const handleToggleReaction = async (reactionType: string) => {
    if (!activeGreeting || !supabase) return
    const isCurrentlyReacted = userReacted[reactionType]

    // Optimistic UI update
    setUserReacted(prev => ({ ...prev, [reactionType]: !isCurrentlyReacted }))
    setReactions(prev => ({
      ...prev,
      [reactionType]: Math.max(0, (prev[reactionType] || 0) + (isCurrentlyReacted ? -1 : 1)),
    }))

    if (isCurrentlyReacted) {
      await supabase
        .from('reactions')
        .delete()
        .eq('target_type', 'greeting')
        .eq('target_id', activeGreeting.id)
        .eq('reaction_type', reactionType)
        .eq('client_hash', clientHash)
    } else {
      await supabase.from('reactions').insert({
        target_type: 'greeting',
        target_id: activeGreeting.id,
        reaction_type: reactionType,
        client_hash: clientHash,
      })
    }
  }

  // Add comment
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeGreeting || !supabase || isSubmittingComment) return

    const trimmedComment = commentText.trim()
    const trimmedAuthor = commentName.trim() || 'Một bạn 9H2'

    if (!trimmedComment) return

    setIsSubmittingComment(true)
    setCommentFeedback(null)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        target_type: 'greeting',
        target_id: activeGreeting.id,
        author_name: trimmedAuthor.slice(0, 60),
        content: trimmedComment.slice(0, 500),
        status: 'approved',
      })
      .select()
      .single()

    setIsSubmittingComment(false)

    if (error) {
      setCommentFeedback('Không thể gửi bình luận. Thử lại sau nhé.')
    } else if (data) {
      setComments(prev => [...prev, data])
      setCommentText('')
      setCommentFeedback('Đã gửi phản hồi!')
      setTimeout(() => setCommentFeedback(null), 2500)
    }
  }

  // Filter items
  const filteredItems = items.filter(item => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      item.content.toLowerCase().includes(term) ||
      (item.author_name && item.author_name.toLowerCase().includes(term))
    )
  })

  return (
    <section id="messages" className="section messages-section">
      <div className="section-head text-center">
        <p className="kicker">PHẦN 01</p>
        <h2 className="section-title">Messages from Our Hearts</h2>
        <p className="section-subtitle">
          Những dòng tâm tình mộc mạc và lời chúc chân thành nhất của tập thể 9H2 gửi đến người cô kính yêu
        </p>
      </div>

      {/* Submission Form */}
      <div className="paper form-card envelope-card">
        <div className="envelope-top-bar">
          <span className="postage-stamp">20.11</span>
          <span className="postmark">CLASS 9H2 • HANOI</span>
        </div>

        <h3 className="form-title">Gửi Lời Chúc Đến Cô</h3>
        <p className="form-desc">
          Mỗi lời chúc là một cánh hoa tươi thắm gửi trao cô trong ngày Hiến chương Nhà giáo.
        </p>

        <form onSubmit={handleSubmit} className="greeting-form">
          <div className="form-group">
            <label htmlFor="greeting-author" className="field-label">
              Tên của bạn {!isAnonymous && <span className="req">*</span>}
            </label>
            <input
              id="greeting-author"
              type="text"
              placeholder={isAnonymous ? 'Đang chọn chế độ gửi ẩn danh' : 'Ví dụ: Nguyễn Minh Anh, Bàn 3...'}
              value={name}
              maxLength={60}
              disabled={isAnonymous}
              onChange={e => setName(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="greeting-content" className="field-label">
                Lời chúc gửi cô <span className="req">*</span>
              </label>
              <span className={`char-counter ${content.length > 1400 ? 'warn' : ''}`}>
                {content.length} / 1500 ký tự
              </span>
            </div>
            <textarea
              id="greeting-content"
              placeholder="Viết những lời từ tận đáy lòng gửi đến cô: lời cảm ơn vì những tiết Toán, lời xin lỗi vì những lúc lớp nghịch ngợm, hay lời chúc cô luôn mạnh khỏe và yêu đời…"
              rows={5}
              value={content}
              maxLength={1500}
              onChange={e => setContent(e.target.value)}
              className="text-area"
            />
          </div>

          {/* Honeypot anti-spam */}
          <input
            type="text"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />

          <div className="form-footer">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
              />
              <span>Gửi dưới danh nghĩa ẩn danh ("Một học sinh 9H2")</span>
            </label>

            <button type="submit" className="btn primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Đang niêm phong thư…' : 'Gửi lời chúc ✉'}
            </button>
          </div>

          {feedback && (
            <div className={`feedback-alert ${feedback.ok ? 'success' : 'error'}`} role="status">
              {feedback.message}
            </div>
          )}
        </form>
      </div>

      {!configured && (
        <div className="config-warning paper">
          <p>⚠️ Chưa cấu hình biến môi trường Supabase. Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.</p>
        </div>
      )}

      {/* Wall Header & Filter */}
      <div className="wall-toolbar">
        <div className="toolbar-info">
          <h3>Bảng Lời Chúc ({filteredItems.length})</h3>
          <span className="toolbar-tag">Tập thể học sinh 9H2</span>
        </div>

        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc lời chúc…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Tìm kiếm lời chúc"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Greetings Grid Wall */}
      <div className="greetings-wall">
        {loading && configured && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card paper skeleton-card" aria-hidden="true" />
          ))
        )}

        {!loading && !filteredItems.length && configured && (
          <div className="paper empty-wall">
            <span className="empty-icon">📜</span>
            <p className="empty-title">
              {searchTerm ? 'Không tìm thấy lời chúc phù hợp.' : 'Chưa có lời chúc nào được hiển thị.'}
            </p>
            <p className="empty-sub">
              {searchTerm ? 'Hãy thử tìm từ khóa khác xem nhé!' : 'Hãy là người đầu tiên đặt bút viết những dòng chúc gửi cô nhé!'}
            </p>
          </div>
        )}

        {filteredItems.map((g, index) => {
          const rotationDegree = ((index * 29) % 7) - 3
          return (
            <article
              key={g.id}
              className="greeting-card paper"
              style={{ ['--r' as string]: `${rotationDegree}deg` }}
              onClick={() => setActiveGreeting(g)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveGreeting(g)
                }
              }}
              aria-label={`Lời chúc từ ${g.is_anonymous ? 'Một học sinh 9H2' : g.author_name}`}
            >
              <div className="card-pin" aria-hidden="true" />
              <div className="card-body">
                <p className="card-text">{g.content}</p>
              </div>
              <div className="card-footer">
                <span className="card-author">
                  — {g.is_anonymous ? 'Một học sinh 9H2' : g.author_name}
                </span>
                <span className="card-hint">Mở thư ↗</span>
              </div>
            </article>
          )
        })}
      </div>

      {hasMore && !loading && items.length > 0 && (
        <div className="load-more-wrap">
          <button
            type="button"
            className="btn ghost-btn"
            onClick={() => loadGreetings(items.length, true)}
          >
            Xem thêm lời chúc khác ❦
          </button>
        </div>
      )}

      {/* Read Modal */}
      {activeGreeting && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveGreeting(null)}
        >
          <div className="paper modal-content letter-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="postage-stamp">20.11</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveGreeting(null)}
                aria-label="Đóng thư"
              >
                ✕
              </button>
            </div>

            <div className="letter-full-text">
              <p>{activeGreeting.content}</p>
            </div>

            <div className="letter-author-signature">
              <span className="hand-sig">
                — {activeGreeting.is_anonymous ? 'Một học sinh 9H2' : activeGreeting.author_name}
              </span>
              <span className="letter-date">
                {new Date(activeGreeting.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <div className="divider-flourish" aria-hidden="true">❦</div>

            {/* Reactions bar */}
            <div className="reactions-container">
              <span className="reactions-title">Thả cảm xúc:</span>
              <div className="reactions-buttons">
                {REACTION_TYPES.map(r => {
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
              <h4 className="comments-heading">Phản hồi & Lời nhắn ({comments.length})</h4>

              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">Chưa có phản hồi nào. Hãy để lại lời nhắn cùng chia sẻ nhé.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-author-row">
                        <strong>{c.author_name}</strong>
                        <span className="comment-time">
                          {new Date(c.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="comment-body">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="add-comment-form">
                <input
                  type="text"
                  placeholder="Tên của bạn (hoặc để trống)"
                  value={commentName}
                  maxLength={50}
                  onChange={e => setCommentName(e.target.value)}
                  className="comment-name-input"
                />
                <div className="comment-submit-row">
                  <input
                    type="text"
                    placeholder="Viết phản hồi ngắn…"
                    value={commentText}
                    maxLength={300}
                    onChange={e => setCommentText(e.target.value)}
                    className="comment-text-input"
                  />
                  <button
                    type="submit"
                    className="btn sm-btn"
                    disabled={isSubmittingComment || !commentText.trim()}
                  >
                    Gửi
                  </button>
                </div>
                {commentFeedback && <span className="comment-status">{commentFeedback}</span>}
              </form>
            </div>

            <div className="modal-bottom-actions">
              <button
                type="button"
                className="report-link"
                onClick={() => setReportingGreeting(activeGreeting)}
              >
                🚩 Báo cáo lời chúc không phù hợp
              </button>
              <button
                type="button"
                className="btn ghost-btn"
                onClick={() => setActiveGreeting(null)}
              >
                Gấp thư lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingGreeting && (
        <ReportModal
          targetType="greeting"
          targetId={reportingGreeting.id}
          targetExcerpt={reportingGreeting.content}
          onClose={() => setReportingGreeting(null)}
        />
      )}
    </section>
  )
}
