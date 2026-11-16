import { useEffect, useState, FormEvent } from 'react'
import { supabase, configured } from '../lib/supabase'
import { upload, Kind } from '../lib/media'
import { Media, MediaPicker } from './Media'
import { ReportButton } from './Report'

type G = { id: string; author_name: string | null; is_anonymous: boolean; content: string; media_path: string | null; media_type: Kind | null }
const PAGE = 9

export default function Greetings({ allowAnon }: { allowAnon: boolean }) {
  const [items, setItems] = useState<G[]>([])
  const [more, setMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<G | null>(null)
  const [name, setName] = useState(''); const [text, setText] = useState(''); const [anon, setAnon] = useState(false)
  const [file, setFile] = useState<File | null>(null); const [prog, setProg] = useState<number | null>(null)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [hp, setHp] = useState('')
  const isAnon = allowAnon && anon

  const load = async (from: number) => {
    if (!supabase) { setLoading(false); return }
    const { data, error } = await supabase.from('greetings').select('id,author_name,is_anonymous,content,media_path,media_type')
      .eq('status', 'approved').order('created_at', { ascending: false }).range(from, from + PAGE - 1)
    setLoading(false)
    if (error || !data) { setMsg({ ok: false, t: 'Không tải được lời chúc.' }); return }
    setItems(p => (from ? [...p, ...(data as G[])] : (data as G[]))); setMore(data.length === PAGE)
  }
  useEffect(() => { load(0) }, [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || hp) return
    const content = text.trim()
    if (content.length < 2 || content.length > 1500) { setMsg({ ok: false, t: 'Lời chúc cần từ 2 đến 1500 ký tự.' }); return }
    if (!isAnon && !name.trim()) { setMsg({ ok: false, t: 'Vui lòng nhập tên của bạn.' }); return }
    if (!supabase) { setMsg({ ok: false, t: 'Website chưa được cấu hình Supabase.' }); return }
    if (!confirm('Gửi lời chúc này đến cô?')) return
    setBusy(true); setMsg(null)
    try {
      let m: { path: string; type: Kind } | null = null
      if (file) { setProg(0); m = await upload(file, setProg) }
      const { error } = await supabase.from('greetings').insert({
        author_name: isAnon ? null : name.trim().slice(0, 60), is_anonymous: isAnon, content, media_path: m?.path ?? null, media_type: m?.type ?? null,
      })
      if (error) throw error
      setText(''); setName(''); setFile(null)
      setMsg({ ok: true, t: 'Đã gửi! Lời chúc sẽ hiện sau khi được duyệt.' })
    } catch { setMsg({ ok: false, t: 'Gửi thất bại, bạn thử lại nhé.' }) }
    finally { setBusy(false); setProg(null) }
  }

  return (
    <section id="messages" className="section">
      <p className="kicker">01</p><h2>Messages from Our Hearts</h2>
      <form className="paper form" onSubmit={submit}>
        <input aria-label="Tên" placeholder="Tên của bạn" value={name} maxLength={60} disabled={isAnon} onChange={e => setName(e.target.value)} />
        <textarea aria-label="Lời chúc" placeholder="Viết lời chúc gửi cô…" rows={5} value={text} maxLength={1500} onChange={e => setText(e.target.value)} />
        <MediaPicker allow={['video', 'image']} file={file} onFile={setFile} progress={prog} />
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={e => setHp(e.target.value)} />
        {allowAnon && <label className="check"><input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Gửi ẩn danh</label>}
        <button className="btn" disabled={busy}>{busy ? (prog !== null ? `Đang tải lên ${prog}%` : 'Đang gửi…') : 'Gửi lời chúc'}</button>
        {msg && <p role="status" className={msg.ok ? 'ok' : 'err'}>{msg.t}</p>}
      </form>
      {!configured && <p className="err">Chưa cấu hình Supabase (xem README).</p>}
      <div className="wall">
        {loading && configured && [0, 1, 2].map(i => <div key={i} className="card skel" />)}
        {!loading && !items.length && configured && <p className="empty">Chưa có lời chúc nào. Hãy là người đầu tiên nhé.</p>}
        {items.map((g, i) => (
          <button key={g.id} className="card paper" style={{ ['--r' as string]: `${((i * 37) % 5) - 2}deg` }} onClick={() => setOpen(g)}>
            <span className="clamp">{g.content}</span>
            {g.media_type && <small className="tag">{g.media_type === 'video' ? 'Có video' : 'Có ảnh'}</small>}
            <em>— {g.is_anonymous ? 'Một học sinh 9H2' : g.author_name}</em>
          </button>
        ))}
      </div>
      {more && !loading && items.length > 0 && <button className="btn ghost" onClick={() => load(items.length)}>Xem thêm</button>}
      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="paper letter-read" onClick={e => e.stopPropagation()}>
            {open.media_path && open.media_type && <Media path={open.media_path} type={open.media_type} />}
            <p style={{ whiteSpace: 'pre-wrap' }}>{open.content}</p>
            <em className="hand">— {open.is_anonymous ? 'Một học sinh 9H2' : open.author_name}</em>
            <div className="row"><button className="btn ghost" autoFocus onClick={() => setOpen(null)}>Đóng</button><ReportButton type="greeting" id={open.id} /></div>
          </div>
        </div>
      )}
    </section>
  )
}
