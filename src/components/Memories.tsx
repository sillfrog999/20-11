import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Memory } from '../types'
import { Lightbox } from './Lightbox'
import { uploadMediaFile } from '../lib/storage'

// Curated scrapbook moments of Class 9H2 (Sample moments cleared)
const DEFAULT_MEMORIES: Memory[] = []

export function Memories() {
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES)
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video'>('all')
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Upload Form State
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [tag, setTag] = useState('Khoảnh khắc')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Fetch memories from Supabase
  const fetchMemories = async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMemories(data)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  // Filter memories
  const filteredMemories = memories.filter(m => {
    if (activeFilter === 'all') return true
    return m.media_type === activeFilter
  })

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setUploadFeedback(null)

      if (file.type.startsWith('image/')) {
        setMediaType('image')
        const reader = new FileReader()
        reader.onload = ev => setFilePreview(ev.target?.result as string)
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('video/')) {
        setMediaType('video')
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }

  // Handle upload submit
  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !caption.trim()) {
      setUploadFeedback({ ok: false, msg: 'Vui lòng điền tiêu đề và lời chú thích.' })
      return
    }

    let finalUrl = mediaUrl.trim()

    if (selectedFile) {
      setIsUploading(true)
      setUploadFeedback({ ok: true, msg: 'Đang tải tệp lên máy chủ...' })

      const uploadRes = await uploadMediaFile(selectedFile, 'memories')
      if (!uploadRes.success || !uploadRes.url) {
        setIsUploading(false)
        setUploadFeedback({ ok: false, msg: uploadRes.error || 'Tải tệp lên thất bại.' })
        return
      }
      finalUrl = uploadRes.url
    }

    if (!finalUrl) {
      setUploadFeedback({ ok: false, msg: 'Vui lòng chọn tệp ảnh/video hoặc dán đường dẫn URL trực tiếp.' })
      return
    }

    setIsUploading(true)
    const newMemory: Partial<Memory> = {
      title: title.trim(),
      caption: caption.trim(),
      media_type: mediaType,
      media_url: finalUrl,
      author_name: authorName.trim() || 'Thành viên 9H2',
      tag: tag.trim() || 'Khoảnh khắc',
      sort_order: 0
    }

    if (supabase) {
      const { error } = await supabase.from('memories').insert(newMemory)
      if (error) {
        setIsUploading(false)
        setUploadFeedback({ ok: false, msg: `Lưu thất bại: ${error.message}` })
        return
      }
      await fetchMemories()
    } else {
      // Local optimistic update
      const localItem: Memory = {
        ...newMemory,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString()
      } as Memory
      setMemories(prev => [localItem, ...prev])
    }

    setIsUploading(false)
    setUploadFeedback({ ok: true, msg: '✨ Đã thêm kỷ niệm mới vào cuốn sổ lưu bút!' })
    setTimeout(() => {
      setShowUploadModal(false)
      setTitle('')
      setCaption('')
      setMediaUrl('')
      setSelectedFile(null)
      setFilePreview(null)
      setUploadFeedback(null)
    }, 1200)
  }

  return (
    <section id="memories" className="section memories-section">
      <div className="section-head text-center">
        <p className="kicker">PHẦN 02</p>
        <h2 className="section-title">Our Little Chaos</h2>
        <p className="section-subtitle">
          Cuốn sổ lưu bút số ghi lại những khoảnh khắc đáng yêu, nghịch ngợm và khó quên của cả lớp cùng cô
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="memories-toolbar">
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả ({memories.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'image' ? 'active' : ''}`}
            onClick={() => setActiveFilter('image')}
          >
            📷 Hình ảnh ({memories.filter(m => m.media_type === 'image').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'video' ? 'active' : ''}`}
            onClick={() => setActiveFilter('video')}
          >
            🎥 Video ({memories.filter(m => m.media_type === 'video').length})
          </button>
        </div>

        <button
          type="button"
          className="btn primary-btn add-memory-btn"
          onClick={() => setShowUploadModal(true)}
        >
          + Thêm kỷ niệm mới 📷
        </button>
      </div>

      {/* Scrapbook Polaroid Grid */}
      <div className="scrapbook-grid">
        {filteredMemories.map((mem, index) => {
          const rotation = ((index * 17) % 9) - 4
          return (
            <article
              key={mem.id}
              className="polaroid-card paper"
              style={{ ['--r' as string]: `${rotation}deg` }}
              onClick={() => setSelectedMemoryIndex(index)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedMemoryIndex(index)
                }
              }}
              aria-label={`Xem kỷ niệm: ${mem.title}`}
            >
              <div className="washi-tape" aria-hidden="true" />
              <div className="polaroid-media-container">
                {mem.media_type === 'video' ? (
                  <div className="video-thumb-wrap">
                    <video src={mem.media_url} className="polaroid-img" muted playsInline />
                    <span className="play-badge" aria-hidden="true">▶</span>
                  </div>
                ) : (
                  <img
                    src={mem.media_url}
                    alt={mem.title}
                    className="polaroid-img"
                    loading="lazy"
                  />
                )}
                <span className="media-tag">{mem.tag || 'Khoảnh khắc'}</span>
              </div>

              <div className="polaroid-caption">
                <h3 className="memory-card-title">{mem.title}</h3>
                <p className="memory-card-excerpt">{mem.caption}</p>
                {mem.author_name && (
                  <span className="memory-card-author hand">— {mem.author_name}</span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {filteredMemories.length === 0 && (
        <div className="paper empty-wall" style={{ margin: '2rem auto', textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '520px' }}>
          <span className="empty-icon" style={{ fontSize: '2.8rem', display: 'block', marginBottom: '0.8rem' }}>📷</span>
          <p className="empty-title" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--burgundy)', marginBottom: '0.5rem' }}>
            Chưa có kỷ niệm nào trong sổ lưu bút
          </p>
          <p className="empty-sub" style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            Hãy bấm nút <strong>"+ Thêm kỷ niệm mới"</strong> ở trên để lưu lại những hình ảnh và thước phim thanh xuân đáng nhớ của lớp mình cùng cô nhé!
          </p>
        </div>
      )}

      {/* Lightbox */}
      {selectedMemoryIndex !== null && filteredMemories[selectedMemoryIndex] && (
        <Lightbox
          memory={filteredMemories[selectedMemoryIndex]}
          onClose={() => setSelectedMemoryIndex(null)}
          onPrev={() => setSelectedMemoryIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() => setSelectedMemoryIndex(prev => (prev !== null && prev < filteredMemories.length - 1 ? prev + 1 : prev))}
          hasPrev={selectedMemoryIndex > 0}
          hasNext={selectedMemoryIndex < filteredMemories.length - 1}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setShowUploadModal(false)}>
          <div className="paper modal-content upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đóng Góp Kỷ Niệm 9H2</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label className="field-label" htmlFor="mem-title">
                  Tiêu đề kỷ niệm <span className="req">*</span>
                </label>
                <input
                  id="mem-title"
                  type="text"
                  placeholder="Ví dụ: Giờ ôn thi Toán kịch tính, 20/11 năm ngoái..."
                  value={title}
                  maxLength={100}
                  onChange={e => setTitle(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="mem-caption">
                  Lời chú thích / Kỷ niệm kèm theo <span className="req">*</span>
                </label>
                <textarea
                  id="mem-caption"
                  rows={4}
                  placeholder="Kể lại cảm xúc, câu nói của cô hoặc chuyện hài hước xảy ra lúc đó…"
                  value={caption}
                  maxLength={800}
                  onChange={e => setCaption(e.target.value)}
                  className="text-area"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label" htmlFor="mem-author">
                    Tên người gửi (hoặc tổ/nhóm)
                  </label>
                  <input
                    id="mem-author"
                    type="text"
                    placeholder="Ví dụ: Tổ 1, Minh Trang, Cả lớp..."
                    value={authorName}
                    maxLength={50}
                    onChange={e => setAuthorName(e.target.value)}
                    className="text-input"
                  />
                </div>
                <div className="form-group">
                  <label className="field-label" htmlFor="mem-tag">
                    Chủ đề
                  </label>
                  <select
                    id="mem-tag"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    className="text-input"
                  >
                    <option value="Khoảnh khắc">Khoảnh khắc</option>
                    <option value="Tiết học">Tiết học</option>
                    <option value="Chuyện vui">Chuyện vui</option>
                    <option value="Kỷ niệm đẹp">Kỷ niệm đẹp</option>
                    <option value="20/11">20/11</option>
                    <option value="Tri ân">Tri ân</option>
                  </select>
                </div>
              </div>

              {/* Media File Upload or URL */}
              <div className="form-group file-upload-box">
                <label className="field-label">Tải lên ảnh hoặc video</label>
                <div className="file-drop-area">
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleFileChange}
                    id="mem-file-input"
                    className="file-input-hidden"
                  />
                  <label htmlFor="mem-file-input" className="file-pick-btn">
                    📁 {selectedFile ? `Đã chọn: ${selectedFile.name}` : 'Chọn ảnh hoặc video từ máy tính / điện thoại'}
                  </label>
                  <p className="file-hint">Hỗ trợ ảnh JPG, PNG, WEBP, GIF (dưới 20MB) hoặc video MP4 (dưới 50MB)</p>
                </div>

                {filePreview && (
                  <div className="preview-container">
                    <p className="preview-label">Xem trước:</p>
                    {mediaType === 'image' ? (
                      <img src={filePreview} alt="Preview" className="preview-thumb" />
                    ) : (
                      <video src={filePreview} controls className="preview-thumb" />
                    )}
                  </div>
                )}

                <div className="or-divider">hoặc nhập đường dẫn URL ảnh/video trực tiếp</div>
                <input
                  type="url"
                  placeholder="https://example.com/anh-ky-niem.jpg"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  className="text-input"
                />
              </div>

              {uploadFeedback && (
                <div className={`feedback-alert ${uploadFeedback.ok ? 'success' : 'error'}`}>
                  {uploadFeedback.msg}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn ghost-btn"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn primary-btn"
                  disabled={isUploading}
                >
                  {isUploading ? 'Đang lưu kỷ niệm…' : 'Lưu vào sổ lưu bút 📖'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
