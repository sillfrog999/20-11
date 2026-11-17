import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface ReportModalProps {
  targetType: 'greeting' | 'confession' | 'comment'
  targetId: string
  targetExcerpt?: string
  onClose: () => void
  onSuccess?: () => void
}

const REPORT_REASONS = [
  'Nội dung xúc phạm hoặc thiếu tôn trọng',
  'Ngôn từ không phù hợp với môi trường học đường',
  'Tiết lộ thông tin cá nhân',
  'Spam hoặc nội dung vô nghĩa',
  'Lý do khác'
]

export function ReportModal({ targetType, targetId, targetExcerpt, onClose, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setStatus({ ok: false, msg: 'Chưa kết nối cơ sở dữ liệu.' })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
      status: 'pending'
    })

    setIsSubmitting(false)

    if (error) {
      setStatus({ ok: false, msg: 'Gửi báo cáo thất bại. Vui lòng thử lại.' })
    } else {
      setStatus({ ok: true, msg: 'Cảm ơn bạn. Ban quản trị lớp sẽ xem xét nội dung này.' })
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="paper modal-content report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Báo cáo nội dung không phù hợp</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {targetExcerpt && (
          <blockquote className="report-excerpt">
            "{targetExcerpt.slice(0, 140)}{targetExcerpt.length > 140 ? '…' : ''}"
          </blockquote>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          <label className="field-label">Lý do báo cáo:</label>
          <div className="radio-group">
            {REPORT_REASONS.map((r, i) => (
              <label key={i} className="radio-item">
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <label className="field-label" htmlFor="report-details">
            Chi tiết thêm (không bắt buộc):
          </label>
          <textarea
            id="report-details"
            rows={3}
            placeholder="Mô tả cụ thể hơn để ban quản trị dễ xử lý…"
            value={details}
            maxLength={300}
            onChange={e => setDetails(e.target.value)}
          />

          {status && (
            <p className={`status-msg ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="btn danger" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi…' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
