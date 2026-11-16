import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { deviceId } from '../lib/media'

export function ReportButton({ type, id }: { type: 'greeting' | 'memory' | 'comment'; id: string }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('inappropriate')
  const send = async () => {
    if (!supabase || busy) return
    setBusy(true)
    const { error } = await supabase.from('reports').insert({ target_type: type, target_id: id, reason, device_id: deviceId() })
    setBusy(false)
    if (!error || error.code === '23505') { setDone(true); setOpen(false) }
  }
  if (done) return <span className="small">Đã báo cáo, cảm ơn bạn.</span>
  if (!open) return <button type="button" className="link" onClick={() => setOpen(true)}>Báo cáo</button>
  return (
    <span className="report">
      <select aria-label="Lý do báo cáo" value={reason} onChange={e => setReason(e.target.value)}>
        <option value="inappropriate">Không phù hợp</option><option value="bullying">Bắt nạt / chê bai</option>
        <option value="private">Lộ thông tin riêng tư</option><option value="spam">Spam</option>
      </select>
      <button type="button" className="link" disabled={busy} onClick={send}>Gửi</button>
      <button type="button" className="link" onClick={() => setOpen(false)}>Huỷ</button>
    </span>
  )
}
