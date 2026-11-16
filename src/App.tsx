import { useEffect, useRef, useState, FormEvent } from 'react'
import { supabase, configured } from './lib/supabase'
import { startFlowers } from './lib/flowers'

type Greeting = { id: string; author_name: string | null; is_anonymous: boolean; content: string; created_at: string }
const PAGE = 9
const LETTER = [
  'Chúng em chân thành cảm ơn cô.',
  'Môn Toán tuy khô khan nhưng khi cô dạy chúng em, nó đã trở thành một phần kiến thức thú vị và khơi gợi sự chú ý, hứng thú trong chúng em.',
  'Đôi lúc cô có hơi nghiêm khắc và quát nạt, nhưng tất cả chúng em đều biết rằng cô cũng chỉ muốn tốt cho lớp hơn và giúp chúng em chú ý học hơn.',
  'Sau tất cả, nhân dịp 20/11, cả tập thể lớp 9H2 xin chúc mừng cô ngày 20/11 vui vẻ.',
  'Chúng em kính chúc cô luôn mạnh khỏe, hạnh phúc và giữ mãi nhiệt huyết với nghề giáo.',
]

function Greetings() {
  const [items, setItems] = useState<Greeting[]>([])
  const [more, setMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Greeting | null>(null)
  const [name, setName] = useState(''); const [text, setText] = useState(''); const [anon, setAnon] = useState(false)
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [hp, setHp] = useState('')

  const load = async (from: number) => {
    if (!supabase) { setLoading(false); return }
    const { data, error } = await supabase.from('greetings').select('id,author_name,is_anonymous,content,created_at')
      .eq('status', 'approved').order('created_at', { ascending: false }).range(from, from + PAGE - 1)
    setLoading(false)
    if (error || !data) { setMsg({ ok: false, t: 'Không tải được lời chúc.' }); return }
    setItems(p => (from ? [...p, ...data] : data)); setMore(data.length === PAGE)
  }
  useEffect(() => { load(0) }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || hp) return
    const content = text.trim()
    if (content.length < 2 || content.length > 1500) { setMsg({ ok: false, t: 'Lời chúc cần từ 2 đến 1500 ký tự.' }); return }
    if (!anon && !name.trim()) { setMsg({ ok: false, t: 'Vui lòng nhập tên hoặc chọn gửi ẩn danh.' }); return }
    if (!supabase) { setMsg({ ok: false, t: 'Website chưa được cấu hình Supabase.' }); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('greetings').insert({ author_name: anon ? null : name.trim().slice(0, 60), is_anonymous: anon, content })
    setBusy(false)
    if (error) { setMsg({ ok: false, t: 'Gửi thất bại, bạn thử lại nhé.' }); return }
    setText(''); setName(''); setMsg({ ok: true, t: 'Đã gửi! Lời chúc sẽ hiện sau khi được duyệt.' })
  }

  return (
    <section id="messages" className="section">
      <p className="kicker">01</p><h2>Messages from Our Hearts</h2>
      <form className="paper form" onSubmit={submit}>
        <input aria-label="Tên" placeholder="Tên của bạn" value={name} maxLength={60} disabled={anon} onChange={e => setName(e.target.value)} />
        <textarea aria-label="Lời chúc" placeholder="Viết lời chúc gửi cô…" rows={5} value={text} maxLength={1500} onChange={e => setText(e.target.value)} />
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={e => setHp(e.target.value)} />
        <label className="check"><input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Gửi ẩn danh</label>
        <button className="btn" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi lời chúc'}</button>
        {msg && <p role="status" className={msg.ok ? 'ok' : 'err'}>{msg.t}</p>}
      </form>
      {!configured && <p className="err">Chưa cấu hình Supabase (xem README).</p>}
      <div className="wall">
        {loading && configured && [0, 1, 2].map(i => <div key={i} className="card skel" />)}
        {!loading && !items.length && configured && <p className="empty">Chưa có lời chúc nào. Hãy là người đầu tiên nhé.</p>}
        {items.map((g, i) => (
          <button key={g.id} className="card paper" style={{ ['--r' as string]: `${((i * 37) % 5) - 2}deg` }} onClick={() => setOpen(g)}>
            <span className="clamp">{g.content}</span>
            <em>— {g.is_anonymous ? 'Một học sinh 9H2' : g.author_name}</em>
          </button>
        ))}
      </div>
      {more && !loading && items.length > 0 && <button className="btn ghost" onClick={() => load(items.length)}>Xem thêm</button>}
      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="paper letter-read" onClick={e => e.stopPropagation()}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{open.content}</p>
            <em className="hand">— {open.is_anonymous ? 'Một học sinh 9H2' : open.author_name}</em>
            <button className="btn ghost" autoFocus onClick={() => setOpen(null)}>Đóng</button>
          </div>
        </div>
      )}
    </section>
  )
}

function Gratitude() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.2 })
    ref.current?.querySelectorAll('.rv').forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])
  return (
    <section id="gratitude" className="section">
      <p className="kicker">03</p><h2>Our Gratitude</h2>
      <div ref={ref} className="paper letter">
        {LETTER.map((p, i) => <p key={i} className="rv" style={{ transitionDelay: `${i * 120}ms` }}>{p}</p>)}
        <div className="divider" aria-hidden>❦</div>
        <p className="hand rv">With love, Class 9H2</p>
        <p className="date rv">20 November 2026</p>
      </div>
    </section>
  )
}

function Gift({ onOpen }: { onOpen: () => void }) {
  const [opened, setOpened] = useState(false)
  return (
    <section id="gift" className="section center">
      <button className={'gift' + (opened ? ' opened' : '')} aria-label="Mở món quà" disabled={opened} onClick={() => { setOpened(true); onOpen() }}>
        <span className="lid" /><span className="box" />
      </button>
      {!opened && <p className="hand">Chạm để mở món quà</p>}
      {opened && (
        <div className="finale">
          <h3>CẢM ƠN CÔ VÌ ĐÃ ĐỒNG HÀNH CÙNG 9H2</h3>
          <p className="hand big">Happy Vietnamese Teachers' Day!</p>
          <p className="date">Your Students — Class 9H2</p>
        </div>
      )}
    </section>
  )
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [opening, setOpening] = useState(false)
  const [flowersOn, setFlowersOn] = useState(true)
  const layer = useRef<HTMLDivElement>(null)
  const fl = useRef<ReturnType<typeof startFlowers> | null>(null)
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!layer.current || reduced) return
    fl.current = startFlowers(layer.current)
    return () => fl.current?.stop()
  }, [reduced])
  useEffect(() => { fl.current?.setEnabled(flowersOn) }, [flowersOn])

  const enter = () => { setOpening(true); setTimeout(() => setEntered(true), reduced ? 0 : 1400) }

  return (
    <>
      <div ref={layer} className="flowers" aria-hidden="true" />
      {!entered && (
        <div className={'intro' + (opening ? ' opening' : '')}>
          <div className="envelope" aria-hidden><div className="flap" /><div className="seal" /></div>
          <p className="kicker">20 NOVEMBER 2026 — CLASS 9H2</p>
          <h1>Dear Our Teacher</h1><p className="hand big">A Letter for You.</p>
          <button className="btn" onClick={enter}>OPEN YOUR LETTER</button>
          <button className="link" onClick={() => setEntered(true)}>Bỏ qua</button>
        </div>
      )}
      {entered && (
        <>
          <header className="nav"><a href="#top" className="mark">A LETTER FOR YOU</a>
            <nav><a href="#messages">01 Messages</a><a href="#memories">02 Memories</a><a href="#gratitude">03 Gratitude</a></nav>
            <button className="link" aria-pressed={flowersOn} onClick={() => setFlowersOn(v => !v)}>{flowersOn ? 'Tắt hoa rơi' : 'Bật hoa rơi'}</button>
          </header>
          <main id="top">
            <Greetings />
            <section id="memories" className="section"><p className="kicker">02</p><h2>Our Little Chaos</h2>
              <p className="empty">Phần kỷ niệm đang được hoàn thiện.</p></section>
            <Gratitude />
            <Gift onOpen={() => fl.current?.burst()} />
          </main>
        </>
      )}
    </>
  )
}
