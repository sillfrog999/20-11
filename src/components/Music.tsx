import { useRef, useState } from 'react'
const SRC = import.meta.env.VITE_MUSIC_URL as string | undefined
// Never autoplays: playback only starts from a user click.
export default function Music() {
  const a = useRef<HTMLAudioElement>(null)
  const [on, setOn] = useState(false)
  const [vol, setVol] = useState(0.4)
  const toggle = async () => {
    const el = a.current; if (!el) return
    if (on) { el.pause(); setOn(false) } else { el.volume = vol; try { await el.play(); setOn(true) } catch { setOn(false) } }
  }
  return (
    <span className="music">
      {SRC && <audio ref={a} src={SRC} loop preload="none" />}
      <button className="link" onClick={toggle} disabled={!SRC} aria-pressed={on} title={SRC ? '' : 'Chưa cấu hình nhạc (VITE_MUSIC_URL)'}>{on ? 'Tạm dừng nhạc' : 'Phát nhạc'}</button>
      {SRC && <input type="range" aria-label="Âm lượng" min={0} max={1} step={0.05} value={vol} onChange={e => { const v = +e.target.value; setVol(v); if (a.current) a.current.volume = v }} />}
    </span>
  )
}
