import { useCallback, useEffect, useState, FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Media, MediaPicker } from './components/Media'
import { upload, Kind } from './lib/media'

type Tbl = 'greetings' | 'memories'
type Row = { id: string; table: Tbl; author_name: string | null; is_anonymous: boolean; content: string | null; title?: string; kind?: string; media_path: string | null; media_type: Kind | null; created_at: string }
const sb = () => supabase!

async function removeMedia(path: string | null) { if (path) await sb().storage.from('media').remove([path]) }

function Counts() {
  const [c, setC] = useState<Record<string, number>>({})
  useEffect(() => {
    const q = (t: string, status?: string) => { let r = sb().from(t).select('*', { count: 'exact', head: true }); if (status) r = r.eq('status', status); return r.then(x => x.count ?? 0) }
    Promise.all([q('greetings', 'pending'), q('greetings', 'approved'), q('memories', 'pending'), q('memories', 'approved'), q('comments'), q('reports')])
      .then(([gp, ga, mp, ma, cm, rp]) => setC({ gp, ga, mp, ma, cm, rp }))
  }, [])
  return <p className="small">Lời chúc: {c.gp ?? '…'} chờ / {c.ga ?? '…'} đã duyệt · Bài viết: {c.mp ?? '…'} chờ / {c.ma ?? '…'} đã duyệt · Bình luận: {c.cm ?? '…'} · Báo cáo: {c.rp ?? '…'}</p>
}

function Queue({ status }: { status: 'pending' | 'approved' }) {
  const [rows, setRows] = useState<Row[]>([]); const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const [g, m] = await Promise.all([
      sb().from('greetings').select('*').eq('status', status).order('created_at'),
      sb().from('memories').select('*').eq('status', status).order('created_at'),
    ])
    if (g.error || m.error) setErr('Không tải được dữ liệu.')
    setRows([...(g.data ?? []).map(r => ({ ...r, table: 'greetings' as Tbl })), ...(m.data ?? []).map(r => ({ ...r, table: 'memories' as Tbl }))])
  }, [status])
  useEffect(() => { load() }, [load])
  const act = async (r: Row, s: 'approved' | 'rejected') => {
    const { error } = await sb().from(r.table).update({ status: s, moderated_at: new Date().toISOString() }).eq('id', r.id)
    if (error) setErr('Cập nhật thất bại.'); load()
  }
  const del = async (r: Row) => {
    if (!confirm('Xoá vĩnh viễn mục này?')) return
    await removeMedia(r.media_path)
    const { error } = await sb().from(r.table).delete().eq('id', r.id)
    if (error) setErr('Xoá thất bại.'); load()
  }
  return (
    <div>
      {err && <p className="err">{err}</p>}
      {!rows.length && <p className="empty">Không có mục nào.</p>}
      {rows.map(r => (
        <article key={r.table + r.id} className="paper adm">
          <p className="small">{r.table === 'greetings' ? 'Lời chúc' : r.kind === 'confession' ? 'Confession' : 'Kỷ niệm'} · {r.author_name || '(không tên)'}{r.is_anonymous ? ' · chọn ẩn danh' : ''} · {new Date(r.created_at).toLocaleString('vi-VN')}</p>
          {r.title && <h4>{r.title}</h4>}
          {r.content && <p style={{ whiteSpace: 'pre-wrap' }}>{r.content}</p>}
          {r.media_path && r.media_type && <Media path={r.media_path} type={r.media_type} />}
          <div className="row">
            {status === 'pending' && <button className="btn" onClick={() => act(r, 'approved')}>Duyệt</button>}
            {status === 'pending' ? <button className="btn ghost" onClick={() => act(r, 'rejected')}>Từ chối</button> : <button className="btn ghost" onClick={() => act(r, 'rejected')}>Gỡ xuống</button>}
            <button className="btn ghost" onClick={() => del(r)}>Xoá</button>
          </div>
        </article>
      ))}
    </div>
  )
}

type Rep = { id: string; target_type: 'greeting' | 'memory' | 'comment'; target_id: string; reason: string; created_at: string }
const TBL = { greeting: 'greetings', memory: 'memories', comment: 'comments' } as const
function ReportItem({ r, onDone }: { r: Rep; onDone: () => void }) {
  const [t, setT] = useState<{ title?: string; content?: string; media_path?: string | null } | null | undefined>(undefined)
  useEffect(() => { sb().from(TBL[r.target_type]).select('*').eq('id', r.target_id).maybeSingle().then(x => setT(x.data)) }, [r])
  const dismiss = async () => { await sb().from('reports').delete().eq('id', r.id); onDone() }
  const remove = async () => {
    if (!confirm('Xoá nội dung bị báo cáo?')) return
    await removeMedia(t?.media_path ?? null)
    await sb().from(TBL[r.target_type]).delete().eq('id', r.target_id)
    await sb().from('reports').delete().eq('target_type', r.target_type).eq('target_id', r.target_id)
    onDone()
  }
  return (
    <article className="paper adm">
      <p className="small">{r.target_type} · lý do: {r.reason} · {new Date(r.created_at).toLocaleString('vi-VN')}</p>
      {t === undefined ? <p className="empty">Đang tải…</p> : t === null ? <p className="empty">Nội dung đã bị xoá.</p> : <><strong>{t.title}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{t.content}</p></>}
      <div className="row">{t && <button className="btn" onClick={remove}>Xoá nội dung</button>}<button className="btn ghost" onClick={dismiss}>Bỏ qua báo cáo</button></div>
    </article>
  )
}
function Reports() {
  const [rows, setRows] = useState<Rep[]>([])
  const load = useCallback(() => { sb().from('reports').select('*').order('created_at', { ascending: false }).limit(100).then(x => setRows((x.data as Rep[]) ?? [])) }, [])
  useEffect(() => { load() }, [load])
  return <div>{!rows.length && <p className="empty">Chưa có báo cáo.</p>}{rows.map(r => <ReportItem key={r.id} r={r} onDone={load} />)}</div>
}

function Settings() {
  const [s, setS] = useState<Record<string, string>>({}); const [file, setFile] = useState<File | null>(null)
  const [prog, setProg] = useState<number | null>(null); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { sb().from('site_settings').select('key,value').then(x => setS(Object.fromEntries((x.data ?? []).map(r => [r.key, r.value])))) }, [])
  const set = (k: string, v: string) => setS(p => ({ ...p, [k]: v }))
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return
    setBusy(true); setMsg('')
    try {
      const next = { ...s }
      if (file) { setProg(0); const up = await upload(file, setProg); await removeMedia(s.final_media_path || null); next.final_media_path = up.path }
      const { error } = await sb().from('site_settings').upsert(Object.entries(next).map(([key, value]) => ({ key, value })))
      if (error) throw error
      setS(next); setFile(null); setMsg('Đã lưu.')
    } catch { setMsg('Lưu thất bại.') } finally { setBusy(false); setProg(null) }
  }
  return (
    <form className="paper form" onSubmit={save}>
      <label>Tên giáo viên<input value={s.teacher_name ?? ''} maxLength={60} onChange={e => set('teacher_name', e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={s.allow_anonymous === 'true'} onChange={e => set('allow_anonymous', String(e.target.checked))} /> Cho phép gửi ẩn danh</label>
      <label>Lời nhắn cuối (hộp quà)<textarea rows={4} maxLength={600} value={s.final_message ?? ''} onChange={e => set('final_message', e.target.value)} /></label>
      <p className="small">Ảnh lớp hiện tại: {s.final_media_path || '(chưa có)'}</p>
      <MediaPicker allow={['image']} file={file} onFile={setFile} progress={prog} />
      <button className="btn" disabled={busy}>Lưu cài đặt</button>
      {msg && <p role="status">{msg}</p>}
    </form>
  )
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); const [tab, setTab] = useState('pending')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  useEffect(() => {
    if (!supabase) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session || !supabase) { setIsAdmin(null); return }
    supabase.from('admins').select('user_id').maybeSingle().then(({ data }) => setIsAdmin(!!data))
  }, [session])
  const login = async (e: FormEvent) => {
    e.preventDefault(); setErr('')
    const { error } = await sb().auth.signInWithPassword({ email, password: pw })
    if (error) setErr('Sai email hoặc mật khẩu.')
  }
  if (!ready) return <main className="adm-wrap"><p className="empty">Đang tải…</p></main>
  if (!supabase) return <main className="adm-wrap"><p className="err">Chưa cấu hình Supabase.</p></main>
  if (!session) return (
    <main className="adm-wrap"><h1>Admin</h1>
      <form className="paper form" onSubmit={login}>
        <input type="email" aria-label="Email" placeholder="Email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" aria-label="Mật khẩu" placeholder="Mật khẩu" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} />
        <button className="btn">Đăng nhập</button>{err && <p className="err" role="alert">{err}</p>}
      </form></main>
  )
  if (isAdmin === null) return <main className="adm-wrap"><p className="empty">Đang kiểm tra quyền…</p></main>
  if (!isAdmin) return <main className="adm-wrap"><p className="err">Tài khoản này không có quyền admin.</p><button className="btn ghost" onClick={() => sb().auth.signOut()}>Đăng xuất</button></main>
  return (
    <main className="adm-wrap">
      <header className="row"><h1>Quản trị</h1><button className="btn ghost" onClick={() => sb().auth.signOut()}>Đăng xuất</button></header>
      <Counts />
      <div className="tabs" role="tablist">
        {[['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['reports', 'Báo cáo'], ['settings', 'Cài đặt']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'pending' && <Queue key="p" status="pending" />}
      {tab === 'approved' && <Queue key="a" status="approved" />}
      {tab === 'reports' && <Reports />}
      {tab === 'settings' && <Settings />}
    </main>
  )
}
