import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { validate, Kind } from '../lib/media'

export function useMediaUrl(path?: string | null) {
  const [u, setU] = useState<string>()
  useEffect(() => {
    if (!path || !supabase) return
    let off = false
    supabase.storage.from('media').createSignedUrl(path, 3600).then(({ data }) => { if (!off) setU(data?.signedUrl) })
    return () => { off = true }
  }, [path])
  return u
}

// Lazy: the signed URL is only requested once the element is near the viewport. Never autoplays.
export function Media({ path, type, thumb }: { path: string; type: Kind; thumb?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const url = useMediaUrl(vis ? path : null)
  return (
    <div ref={ref} className={'media' + (thumb ? ' thumb' : '')}>
      {url ? (type === 'image'
        ? <img src={url} alt="" loading="lazy" />
        : <video src={thumb ? url + '#t=0.1' : url} controls={!thumb} muted={thumb} preload="metadata" playsInline />)
        : <div className="skel fill" />}
      {thumb && type === 'video' && <span className="play" aria-hidden>▶</span>}
    </div>
  )
}

export function MediaPicker({ allow, file, onFile, progress }: { allow: Kind[]; file: File | null; onFile: (f: File | null) => void; progress: number | null }) {
  const [err, setErr] = useState('')
  const [prev, setPrev] = useState<string>()
  useEffect(() => {
    if (!file) { setPrev(undefined); return }
    const u = URL.createObjectURL(file)
    setPrev(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  const accept = allow.includes('video') ? (allow.includes('image') ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime' : 'video/mp4,video/webm,video/quicktime') : 'image/jpeg,image/png,image/webp'
  const label = allow.length === 2 ? 'ảnh hoặc video' : allow[0] === 'video' ? 'video' : 'ảnh'
  return (
    <div className="picker">
      <label className="btn ghost">Chọn {label}
        <input type="file" className="sr" accept={accept} onChange={e => {
          const f = e.target.files?.[0]; e.target.value = ''
          if (!f) return
          const m = validate(f, allow); setErr(m || ''); onFile(m ? null : f)
        }} />
      </label>
      {file && <button type="button" className="link" onClick={() => onFile(null)}>Bỏ tệp</button>}
      {err && <p className="err" role="alert">{err}</p>}
      {file && prev && <div className="media">{file.type.startsWith('image/') ? <img src={prev} alt="Xem trước" /> : <video src={prev} controls preload="metadata" playsInline />}</div>}
      {progress !== null && <div className="bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: progress + '%' }} /></div>}
    </div>
  )
}
