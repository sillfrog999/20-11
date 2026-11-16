import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import Greetings from './components/Greetings'
import Memories from './components/Memories'
import Music from './components/Music'
import { Media } from './components/Media'
import { kindOf } from './lib/media'
import { startFlowers } from './lib/flowers'

const LETTER = [
  'Chúng em chân thành cảm ơn cô.',
  'Môn Toán tuy khô khan nhưng khi cô dạy chúng em, nó đã trở thành một phần kiến thức thú vị và khơi gợi sự chú ý, hứng thú trong chúng em.',
  'Đôi lúc cô có hơi nghiêm khắc và quát nạt, nhưng tất cả chúng em đều biết rằng cô cũng chỉ muốn tốt cho lớp hơn và giúp chúng em chú ý học hơn.',
  'Sau tất cả, nhân dịp 20/11, cả tập thể lớp 9H2 xin chúc mừng cô ngày 20/11 vui vẻ.',
  'Chúng em kính chúc cô luôn mạnh khỏe, hạnh phúc và giữ mãi nhiệt huyết với nghề giáo.',
]

function Gratitude({ teacher }: { teacher: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.2 })
    ref.current?.querySelectorAll('.rv').forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])
  return (
    <section id="gratitude" className="section">
      <p className="kicker">03</p><h2>Our Gratitude</h2>
      <p className="hand">Gửi {teacher},</p>
      <div ref={ref} className="paper letter">
        {LETTER.map((p, i) => <p key={i} className="rv" style={{ transitionDelay: `${i * 120}ms` }}>{p}</p>)}
        <div className="divider" aria-hidden>❦</div>
        <p className="hand rv">With love, Class 9H2</p>
        <p className="date rv">20 November 2026</p>
      </div>
    </section>
  )
}

function Gift({ onOpen, message, mediaPath }: { onOpen: () => void; message: string; mediaPath: string }) {
  const [opened, setOpened] = useState(false)
  return (
    <section id="gift" className="section center">
      <button className={'gift' + (opened ? ' opened' : '')} aria-label="Mở món quà" disabled={opened} onClick={() => { setOpened(true); onOpen() }}>
        <span className="lid" /><span className="box" />
      </button>
      {!opened && <p className="hand">Chạm để mở món quà</p>}
      {opened && (
        <div className="finale">
          {mediaPath && <div className="final-media"><Media path={mediaPath} type={kindOf(mediaPath)} /></div>}
          <p className="final-msg">{message}</p>
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
  const [cfg, setCfg] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase?.from('site_settings').select('key,value').then(({ data }) => setCfg(Object.fromEntries((data ?? []).map(r => [r.key, r.value]))))
  }, [])
  const allowAnon = cfg.allow_anonymous !== 'false'
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
            <Music />
          </header>
          <main id="top">
            <Greetings allowAnon={allowAnon} />
            <Memories allowAnon={allowAnon} />
            <Gratitude teacher={cfg.teacher_name || 'Cô'} />
            <Gift onOpen={() => fl.current?.burst()} message={cfg.final_message || 'Chúng em kính chúc cô luôn mạnh khỏe, hạnh phúc và giữ mãi nhiệt huyết với nghề giáo.'} mediaPath={cfg.final_media_path || ''} />
          </main>
        </>
      )}
    </>
  )
}
