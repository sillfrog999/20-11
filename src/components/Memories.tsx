import { useEffect, useState, FormEvent } from 'react'
import { supabase, configured } from '../lib/supabase'
import { upload, deviceId, Kind } from '../lib/media'
import { Media, MediaPicker } from './Media'
import { ReportButton } from './Report'

type Mem = { id: string; kind: 'memory' | 'confession'; title: string; content: string | null; author_name: string | null; media_path: string | null; media_type: Kind | null; likes: number; comments: number }
type Cm = { id: string; author_name: string; content: string }
const PAGE = 9
const likedSet = () => { try { return new Set<string>(JSON.parse(localStorage.getItem('liked') || '[]')) } catch { return new Set<string>() } }

function Viewer({ m, onClose, onLike }: { m: Mem; onClose: () => void; onLike: (id: string, d: number) => void }) {
  const [cs, setCs] = useState<Cm[]>([])
  const [name, setName] = useState(''); const [t, setT] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const [isLiked, setIsLiked] = useState(() => likedSet().has(m.id))
  const loadC = async () => {
    const { data } = await supabase!.from('comments_public').select('id,author_name,content').eq('memory_id', m.id).order('created_at').limit(100)
    setCs((data as Cm[]) ?? [])
  }
  useEffect(() => {
    loadC()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const like = async () => {
    const { data, error } = await supabase!.rpc('toggle_reaction', { p_memory: m.id, p_device: deviceId() })
    if (error) return
    const s = likedSet(); if (data) s.add(m.id); else s.delete(m.id)
    try { localStorage.setItem('liked', JSON.stringify([...s])) } catch { /* ignore */ }
    setIsLiked(!!data); onLike(m.id, data ? 1 : -1)
  }
  const send = async (e: FormEvent) => {
    e.preventDefault()
    const content = t.trim()
    if (busy || !content) return
    setBusy(true); setMsg('')
    const { error } = await supabase!.from('comments').insert({ memory_id: m.id, author_name: name.trim().slice(0, 60) || null, content: content.slice(0, 500) })
    setBusy(false)
    if (error) { setMsg('Không gửi được bình luận.'); return }
    setT(''); loadC()
  }
  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="paper letter-read wide" onClick={e => e.stopPropagation()}>
        {m.media_path && m.media_type && <Media path={m.media_path} type={m.media_type} />}
        <h3>{m.title}</h3>
        {m.content && <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>}
        <em className="hand">— {m.author_name || 'Một học sinh 9H2'}</em>
        <div className="row">
          <button className="btn ghost" aria-pressed={isLiked} onClick={like}>{isLiked ? 'Đã thích' : 'Thích'} · {m.likes}</button>
          <ReportButton type="memory" id={m.id} />
          <button className="btn ghost" autoFocus onClick={onClose}>Đóng</button>
        </div>
        <h4>Bình luận ({cs.length})</h4>
        <ul className="comments">
          {cs.map(c => <li key={c.id}><strong>{c.author_name}</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{c.content}</span> <ReportButton type="comment" id={c.id} /></li>)}
          {!cs.length && <li className="empty">Chưa có bình luận.</li>}
        </ul>
        <form onSubmit={send} className="form flat">
          <input aria-label="Tên (tuỳ chọn)" placeholder="Tên (tuỳ chọn)" maxLength={60} value={name} onChange={e => setName(e.target.value)} />
          <textarea aria-label="Bình luận" placeholder="Viết bình luận vui vẻ, tôn trọng…" rows={2} maxLength={500} value={t} onChange={e => setT(e.target.value)} />
          <button className="btn" disabled={busy || !t.trim()}>Gửi bình luận</button>
          {msg && <p className="err" role="status">{msg}</p>}
        </form>
      </div>
    </div>
  )
}

function MemForm({ kind, allowAnon }: { kind: Mem['kind']; allowAnon: boolean }) {
  const conf = kind === 'confession'
  const [title, setTitle] = useState(''); const [text, setText] = useState(''); const [name, setName] = useState(''); const [anon, setAnon] = useState(false)
  const [agree, setAgree] = useState(false); const [file, setFile] = useState<File | null>(null); const [prog, setProg] = useState<number | null>(null)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [hp, setHp] = useState('')
  const isAnon = allowAnon && anon
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || hp) return
    const content = text.trim()
    if (title.trim().length < 2) { setMsg({ ok: false, t: 'Tiêu đề cần ít nhất 2 ký tự.' }); return }
    if (!content && !file) { setMsg({ ok: false, t: 'Hãy viết nội dung hoặc đính kèm ảnh/video.' }); return }
    if (conf && !agree) { setMsg({ ok: false, t: 'Bạn cần đồng ý quy tắc của Confession Room.' }); return }
    if (!supabase) { setMsg({ ok: false, t: 'Website chưa được cấu hình Supabase.' }); return }
    if (!confirm('Gửi bài này để admin duyệt?')) return
    setBusy(true); setMsg(null)
    try {
      let m: { path: string; type: Kind } | null = null
      if (file) { setProg(0); m = await upload(file, setProg) }
      const { error } = await supabase.from('memories').insert({
        kind, title: title.trim().slice(0, 100), content: content || null, author_name: isAnon || !name.trim() ? null : name.trim().slice(0, 60),
        is_anonymous: isAnon, media_path: m?.path ?? null, media_type: m?.type ?? null,
      })
      if (error) throw error
      setTitle(''); setText(''); setFile(null); setAgree(false)
      setMsg({ ok: true, t: 'Đã gửi! Bài sẽ hiện sau khi được duyệt.' })
    } catch { setMsg({ ok: false, t: 'Gửi thất bại, bạn thử lại nhé.' }) }
    finally { setBusy(false); setProg(null) }
  }
  return (
    <form className="paper form" onSubmit={submit}>
      {conf && <p className="rules">Kể chuyện vui về lớp, nhẹ nhàng và tôn trọng. Không chê bai, bêu xấu, nêu thông tin riêng tư của ai, và không xếp hạng hay gán biệt danh. Bài sẽ được admin duyệt trước khi hiện.</p>}
      <input aria-label="Tiêu đề" placeholder={conf ? 'Tiêu đề câu chuyện' : 'Tiêu đề kỷ niệm'} maxLength={100} value={title} onChange={e => setTitle(e.target.value)} />
      <textarea aria-label="Nội dung" placeholder="Kể lại câu chuyện…" rows={5} maxLength={2000} value={text} onChange={e => setText(e.target.value)} />
      <MediaPicker allow={['image', 'video']} file={file} onFile={setFile} progress={prog} />
      <input aria-label="Tên (tuỳ chọn)" placeholder="Tên (tuỳ chọn)" maxLength={60} disabled={isAnon} value={name} onChange={e => setName(e.target.value)} />
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={e => setHp(e.target.value)} />
      {allowAnon && <label className="check"><input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Đăng ẩn danh</label>}
      {conf && <label className="check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> Mình cam kết nội dung vui vẻ, tôn trọng, không nêu thông tin riêng tư.</label>}
      <button className="btn" disabled={busy}>{busy ? (prog !== null ? `Đang tải lên ${prog}%` : 'Đang gửi…') : 'Gửi bài'}</button>
      {msg && <p role="status" className={msg.ok ? 'ok' : 'err'}>{msg.t}</p>}
    </form>
  )
}

function Wall({ kind }: { kind: Mem['kind'] }) {
  const [items, setItems] = useState<Mem[]>([])
  const [more, setMore] = useState(true); const [loading, setLoading] = useState(true); const [err, setErr] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const load = async (from: number) => {
    if (!supabase) { setLoading(false); return }
    const { data, error } = await supabase.from('memories_public').select('*').eq('kind', kind).order('created_at', { ascending: false }).range(from, from + PAGE - 1)
    setLoading(false)
    if (error || !data) { setErr(true); return }
    setItems(p => (from ? [...p, ...(data as Mem[])] : (data as Mem[]))); setMore(data.length === PAGE)
  }
  useEffect(() => { load(0) }, [])
  const cur = items.find(i => i.id === openId)
  return (
    <>
      {err && <p className="err">Không tải được bài viết.</p>}
      <div className="scrap">
        {loading && configured && [0, 1, 2].map(i => <div key={i} className="polaroid skel" />)}
        {!loading && !items.length && !err && configured && <p className="empty">Chưa có bài nào. Hãy chia sẻ điều đầu tiên nhé.</p>}
        {items.map((m, i) => (
          <button key={m.id} className="polaroid" style={{ ['--r' as string]: `${((i * 53) % 7) - 3}deg` }} onClick={() => setOpenId(m.id)}>
            {m.media_path && m.media_type ? <Media path={m.media_path} type={m.media_type} thumb /> : <span className="clamp note">{m.content}</span>}
            <strong>{m.title}</strong>
            <span className="hand">{m.author_name || 'Ẩn danh'}</span>
            <small>Thích {m.likes} · Bình luận {m.comments}</small>
          </button>
        ))}
      </div>
      {more && !loading && items.length > 0 && <button className="btn ghost" onClick={() => load(items.length)}>Xem thêm</button>}
      {cur && <Viewer m={cur} onClose={() => setOpenId(null)} onLike={(id, d) => setItems(p => p.map(x => (x.id === id ? { ...x, likes: x.likes + d } : x)))} />}
    </>
  )
}

export default function Memories({ allowAnon }: { allowAnon: boolean }) {
  const [kind, setKind] = useState<Mem['kind']>('memory')
  return (
    <section id="memories" className="section">
      <p className="kicker">02</p><h2>Our Little Chaos</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={kind === 'memory'} onClick={() => setKind('memory')}>Kỷ niệm</button>
        <button role="tab" aria-selected={kind === 'confession'} onClick={() => setKind('confession')}>THE 9H2 CONFESSION ROOM</button>
      </div>
      <MemForm key={kind} kind={kind} allowAnon={allowAnon} />
      <Wall key={'w' + kind} kind={kind} />
    </section>
  )
}
