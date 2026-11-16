import { SUPABASE_URL, SUPABASE_KEY } from './supabase'
export type Kind = 'image' | 'video'
const TYPES: Record<string, { ext: string; kind: Kind }> = {
  'image/jpeg': { ext: 'jpg', kind: 'image' }, 'image/png': { ext: 'png', kind: 'image' }, 'image/webp': { ext: 'webp', kind: 'image' },
  'video/mp4': { ext: 'mp4', kind: 'video' }, 'video/webm': { ext: 'webm', kind: 'video' }, 'video/quicktime': { ext: 'mov', kind: 'video' },
}
export const LIMIT = { image: 8 * 1048576, video: 50 * 1048576 }
export const kindOf = (path: string): Kind => (/\.(mp4|webm|mov)$/.test(path) ? 'video' : 'image')
export function validate(f: File, allow: Kind[]): string | null {
  const t = TYPES[f.type]
  if (!t || !allow.includes(t.kind)) return 'Định dạng không được hỗ trợ (ảnh JPG/PNG/WebP, video MP4/WebM/MOV).'
  if (f.size > LIMIT[t.kind]) return `Tệp quá lớn (tối đa ${LIMIT[t.kind] / 1048576}MB).`
  return null
}
export function upload(f: File, onProgress: (p: number) => void) {
  return new Promise<{ path: string; type: Kind }>((res, rej) => {
    const t = TYPES[f.type]
    if (!t || !SUPABASE_URL || !SUPABASE_KEY) return rej(new Error('config'))
    const path = `u/${crypto.randomUUID()}.${t.ext}`
    const x = new XMLHttpRequest()
    x.open('POST', `${SUPABASE_URL}/storage/v1/object/media/${path}`)
    x.setRequestHeader('apikey', SUPABASE_KEY)
    x.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`)
    x.setRequestHeader('Content-Type', f.type)
    x.setRequestHeader('x-upsert', 'false')
    x.upload.onprogress = e => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    x.onload = () => (x.status < 300 ? res({ path, type: t.kind }) : rej(new Error('upload ' + x.status)))
    x.onerror = () => rej(new Error('network'))
    x.send(f)
  })
}
export function deviceId() {
  try {
    let d = localStorage.getItem('dev')
    if (!d) { d = crypto.randomUUID(); localStorage.setItem('dev', d) }
    return d
  } catch { return crypto.randomUUID() }
}
