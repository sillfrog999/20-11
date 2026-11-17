import { useState, useEffect, FormEvent, useCallback } from 'react'
import { supabase, configured } from '../lib/supabase'
import { Greeting, Confession, Memory, Report } from '../types'
import { uploadMediaFile, deleteMediaFile } from '../lib/storage'

interface AdminPanelProps {
  onClose: () => void
}

type AdminTab = 'overview' | 'greetings' | 'confessions' | 'memories' | 'reports' | 'settings'

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Data states
  const [greetings, setGreetings] = useState<Greeting[]>([])
  const [greetingFilter, setGreetingFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [confessionFilter, setConfessionFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [memories, setMemories] = useState<Memory[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({
    teacher_name: 'Cô giáo chủ nhiệm',
    allow_anonymous: 'true',
  })

  // Action status feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Check Auth & is_admin status
  const checkAuth = useCallback(async () => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (currentSession) {
      setSession(currentSession)
      // Check database if user is admin
      const { data: adminRows } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', currentSession.user.id)

      if (adminRows && adminRows.length > 0) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } else {
      setSession(null)
      setIsAdmin(false)
    }
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Fetch admin data
  const fetchAllData = useCallback(async () => {
    if (!supabase || !isAdmin) return

    // Greetings
    const { data: gData } = await supabase
      .from('greetings')
      .select('*')
      .order('created_at', { ascending: false })
    if (gData) setGreetings(gData)

    // Confessions
    const { data: cData } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (cData) setConfessions(cData)

    // Memories
    const { data: mData } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
    if (mData) setMemories(mData)

    // Reports
    const { data: rData } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (rData) setReports(rData)

    // Site settings
    const { data: sData } = await supabase
      .from('site_settings')
      .select('key, value')
    if (sData) {
      const map: Record<string, string> = {}
      sData.forEach(item => { map[item.key] = item.value })
      setSettings(prev => ({ ...prev, ...map }))
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) fetchAllData()
  }, [isAdmin, fetchAllData])

  // Handle Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setLoginError('Chưa cấu hình Supabase.')
      return
    }
    setIsLoggingIn(true)
    setLoginError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    setIsLoggingIn(false)

    if (error) {
      setLoginError('Đăng nhập thất bại: ' + error.message)
      return
    }

    if (data.session) {
      setSession(data.session)
      // Check admin
      const { data: adminRows } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', data.session.user.id)

      if (adminRows && adminRows.length > 0) {
        setIsAdmin(true)
        fetchAllData()
      } else {
        setIsAdmin(false)
        setLoginError('Tài khoản này chưa được cấp quyền quản trị trong bảng public.admins.')
      }
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }

  // Moderate Greeting
  const handleModerateGreeting = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!supabase) return
    const { error } = await supabase
      .from('greetings')
      .update({ status: newStatus, moderated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setGreetings(prev => prev.map(g => (g.id === id ? { ...g, status: newStatus } : g)))
      showNotice(`Đã chuyển lời chúc sang trạng thái: ${newStatus}`)
    } else {
      showNotice(`Lỗi: ${error.message}`)
    }
  }

  // Delete Greeting
  const handleDeleteGreeting = async (id: string) => {
    if (!supabase || !window.confirm('Bạn có chắc muốn xóa vĩnh viễn lời chúc này?')) return
    const { error } = await supabase.from('greetings').delete().eq('id', id)
    if (!error) {
      setGreetings(prev => prev.filter(g => g.id !== id))
      showNotice('Đã xóa lời chúc.')
    }
  }

  // Moderate Confession
  const handleModerateConfession = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!supabase) return
    const { error } = await supabase
      .from('confessions')
      .update({ status: newStatus, moderated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setConfessions(prev => prev.map(c => (c.id === id ? { ...c, status: newStatus } : c)))
      showNotice(`Đã chuyển thú tội sang trạng thái: ${newStatus}`)
    } else {
      showNotice(`Lỗi: ${error.message}`)
    }
  }

  // Delete Confession
  const handleDeleteConfession = async (id: string) => {
    if (!supabase || !window.confirm('Bạn có chắc muốn xóa confession này?')) return
    const { error } = await supabase.from('confessions').delete().eq('id', id)
    if (!error) {
      setConfessions(prev => prev.filter(c => c.id !== id))
      showNotice('Đã xóa confession.')
    }
  }

  // Delete Memory
  const handleDeleteMemory = async (mem: Memory) => {
    if (!supabase || !window.confirm(`Xóa kỷ niệm "${mem.title}"?`)) return
    if (mem.media_url.includes('supabase')) {
      await deleteMediaFile(mem.media_url)
    }
    const { error } = await supabase.from('memories').delete().eq('id', mem.id)
    if (!error) {
      setMemories(prev => prev.filter(m => m.id !== mem.id))
      showNotice('Đã xóa kỷ niệm.')
    }
  }

  // Resolve Report
  const handleResolveReport = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    if (!supabase) return
    const { error } = await supabase
      .from('reports')
      .update({ status: action })
      .eq('id', reportId)

    if (!error) {
      setReports(prev => prev.map(r => (r.id === reportId ? { ...r, status: action } : r)))
      showNotice(`Báo cáo đã chuyển sang: ${action}`)
    }
  }

  // Save Settings
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('site_settings').upsert({ key, value })
    }
    showNotice('Đã lưu cấu hình website!')
  }

  const showNotice = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(null), 3000)
  }

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true">
      <div className="admin-container paper">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-wrap">
            <span className="admin-badge">ADMINISTRATION</span>
            <h2>Bảng Điều Khiển Quản Trị 9H2</h2>
          </div>
          <div className="admin-header-actions">
            {session && (
              <span className="admin-user-email">
                👤 {session.user.email}
              </span>
            )}
            {session && (
              <button type="button" className="btn sm-btn ghost-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            )}
            <button type="button" className="btn sm-btn primary-btn" onClick={onClose}>
              Về trang web ✕
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="admin-toast-notice">{actionNotice}</div>
        )}

        {/* Auth Loading */}
        {authLoading && (
          <div className="admin-loading">
            <p>Đang kiểm tra quyền hạn quản trị…</p>
          </div>
        )}

        {/* Not Signed In / Not Admin Form */}
        {!authLoading && (!session || !isAdmin) && (
          <div className="admin-login-box paper">
            <h3>Đăng nhập Quyền Quản Trị</h3>
            <p className="login-desc">
              Khu vực dành riêng cho ban cán sự lớp 9H2 để kiểm duyệt lời chúc, bài thú tội và quản lý kỷ niệm.
            </p>

            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="form-group">
                <label className="field-label" htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="admin-pass">Mật khẩu</label>
                <input
                  id="admin-pass"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              {loginError && (
                <div className="feedback-alert error">{loginError}</div>
              )}

              <button
                type="submit"
                className="btn primary-btn"
                disabled={isLoggingIn}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isLoggingIn ? 'Đang xác thực…' : 'Đăng nhập Quản Trị 🔑'}
              </button>

              <div className="admin-hint-card">
                <strong>💡 Hướng dẫn cấp quyền admin lần đầu:</strong>
                <p>1. Đăng ký tài khoản trong Supabase Auth (Dashboard → Authentication → Users).</p>
                <p>2. Chạy lệnh SQL trong Supabase SQL Editor:</p>
                <code>insert into public.admins select id from auth.users where email = 'email-cua-ban';</code>
              </div>
            </form>
          </div>
        )}

        {/* Admin Dashboard */}
        {!authLoading && session && isAdmin && (
          <div className="admin-body">
            {/* Tabs Navigation */}
            <div className="admin-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Tổng Quan
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'greetings' ? 'active' : ''}`}
                onClick={() => setActiveTab('greetings')}
              >
                ✉ Duyệt Lời Chúc ({greetings.filter(g => g.status === 'pending').length} chờ)
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'confessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('confessions')}
              >
                🤫 Duyệt Thú Tội ({confessions.filter(c => c.status === 'pending').length} chờ)
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'memories' ? 'active' : ''}`}
                onClick={() => setActiveTab('memories')}
              >
                📷 Quản Lý Kỷ Niệm ({memories.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                🚩 Báo Cáo ({reports.filter(r => r.status === 'pending').length} chờ)
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙ Cài Đặt
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="admin-tab-content">
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Lời chúc đang chờ duyệt</span>
                    <strong className="stat-value pending">
                      {greetings.filter(g => g.status === 'pending').length}
                    </strong>
                    <span className="stat-hint">Tổng cộng: {greetings.length}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Thú tội đang chờ duyệt</span>
                    <strong className="stat-value pending">
                      {confessions.filter(c => c.status === 'pending').length}
                    </strong>
                    <span className="stat-hint">Tổng cộng: {confessions.length}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Kho kỷ niệm lớp</span>
                    <strong className="stat-value">{memories.length}</strong>
                    <span className="stat-hint">Ảnh & Video</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Báo cáo cần xử lý</span>
                    <strong className="stat-value warn">
                      {reports.filter(r => r.status === 'pending').length}
                    </strong>
                    <span className="stat-hint">Phản hồi của học sinh</span>
                  </div>
                </div>

                <div className="quick-actions-bar paper">
                  <h4>Thao tác nhanh</h4>
                  <div className="quick-buttons">
                    <button
                      type="button"
                      className="btn primary-btn"
                      onClick={() => {
                        setActiveTab('greetings')
                        setGreetingFilter('pending')
                      }}
                    >
                      Duyệt lời chúc chờ ({greetings.filter(g => g.status === 'pending').length})
                    </button>
                    <button
                      type="button"
                      className="btn primary-btn"
                      onClick={() => {
                        setActiveTab('confessions')
                        setConfessionFilter('pending')
                      }}
                    >
                      Duyệt thú tội chờ ({confessions.filter(c => c.status === 'pending').length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GREETINGS MODERATION */}
            {activeTab === 'greetings' && (
              <div className="admin-tab-content">
                <div className="sub-filter-row">
                  <button
                    type="button"
                    className={`sub-filter ${greetingFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setGreetingFilter('pending')}
                  >
                    Chờ duyệt ({greetings.filter(g => g.status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${greetingFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setGreetingFilter('approved')}
                  >
                    Đã duyệt ({greetings.filter(g => g.status === 'approved').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${greetingFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setGreetingFilter('rejected')}
                  >
                    Đã từ chối ({greetings.filter(g => g.status === 'rejected').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${greetingFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setGreetingFilter('all')}
                  >
                    Tất cả ({greetings.length})
                  </button>
                </div>

                <div className="admin-data-table-wrap">
                  {greetings
                    .filter(g => greetingFilter === 'all' || g.status === greetingFilter)
                    .map(g => (
                      <div key={g.id} className="admin-row paper">
                        <div className="row-content">
                          <div className="row-meta">
                            <strong>{g.is_anonymous ? 'Ẩn danh' : g.author_name}</strong>
                            <span className="badge-tag">{g.status}</span>
                            <span className="row-date">
                              {new Date(g.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="row-text">{g.content}</p>
                        </div>
                        <div className="row-actions">
                          {g.status !== 'approved' && (
                            <button
                              type="button"
                              className="btn sm-btn primary-btn"
                              onClick={() => handleModerateGreeting(g.id, 'approved')}
                            >
                              ✓ Duyệt
                            </button>
                          )}
                          {g.status !== 'rejected' && (
                            <button
                              type="button"
                              className="btn sm-btn ghost-btn"
                              onClick={() => handleModerateGreeting(g.id, 'rejected')}
                            >
                              ✕ Từ chối
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn sm-btn danger-btn"
                            onClick={() => handleDeleteGreeting(g.id)}
                          >
                            🗑 Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: CONFESSIONS MODERATION */}
            {activeTab === 'confessions' && (
              <div className="admin-tab-content">
                <div className="sub-filter-row">
                  <button
                    type="button"
                    className={`sub-filter ${confessionFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setConfessionFilter('pending')}
                  >
                    Chờ duyệt ({confessions.filter(c => c.status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${confessionFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setConfessionFilter('approved')}
                  >
                    Đã duyệt ({confessions.filter(c => c.status === 'approved').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${confessionFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setConfessionFilter('rejected')}
                  >
                    Đã từ chối ({confessions.filter(c => c.status === 'rejected').length})
                  </button>
                  <button
                    type="button"
                    className={`sub-filter ${confessionFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setConfessionFilter('all')}
                  >
                    Tất cả ({confessions.length})
                  </button>
                </div>

                <div className="admin-data-table-wrap">
                  {confessions
                    .filter(c => confessionFilter === 'all' || c.status === confessionFilter)
                    .map(c => (
                      <div key={c.id} className="admin-row paper">
                        <div className="row-content">
                          <div className="row-meta">
                            <strong>{c.pen_name}</strong>
                            <span className="badge-tag">{c.category}</span>
                            <span className={`badge-tag ${c.status}`}>{c.status}</span>
                            <span className="row-date">
                              {new Date(c.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="row-text">{c.content}</p>
                        </div>
                        <div className="row-actions">
                          {c.status !== 'approved' && (
                            <button
                              type="button"
                              className="btn sm-btn primary-btn"
                              onClick={() => handleModerateConfession(c.id, 'approved')}
                            >
                              ✓ Duyệt
                            </button>
                          )}
                          {c.status !== 'rejected' && (
                            <button
                              type="button"
                              className="btn sm-btn ghost-btn"
                              onClick={() => handleModerateConfession(c.id, 'rejected')}
                            >
                              ✕ Từ chối
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn sm-btn danger-btn"
                            onClick={() => handleDeleteConfession(c.id)}
                          >
                            🗑 Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: MEMORIES MANAGEMENT */}
            {activeTab === 'memories' && (
              <div className="admin-tab-content">
                <div className="admin-data-table-wrap">
                  {memories.map(m => (
                    <div key={m.id} className="admin-row paper memory-admin-row">
                      <div className="row-thumb">
                        {m.media_type === 'image' ? (
                          <img src={m.media_url} alt={m.title} />
                        ) : (
                          <video src={m.media_url} muted />
                        )}
                      </div>
                      <div className="row-content">
                        <div className="row-meta">
                          <strong>{m.title}</strong>
                          <span className="badge-tag">{m.media_type}</span>
                          <span className="badge-tag">{m.tag}</span>
                          {m.author_name && <span>Bởi: {m.author_name}</span>}
                        </div>
                        <p className="row-text">{m.caption}</p>
                      </div>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn sm-btn danger-btn"
                          onClick={() => handleDeleteMemory(m)}
                        >
                          🗑 Xóa kỷ niệm
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === 'reports' && (
              <div className="admin-tab-content">
                <div className="admin-data-table-wrap">
                  {reports.length === 0 ? (
                    <p className="empty-sub">Không có báo cáo vi phạm nào.</p>
                  ) : (
                    reports.map(r => (
                      <div key={r.id} className="admin-row paper">
                        <div className="row-content">
                          <div className="row-meta">
                            <span className="badge-tag warn">{r.target_type}</span>
                            <strong>Lý do: {r.reason}</strong>
                            <span className="badge-tag">{r.status}</span>
                            <span className="row-date">
                              {new Date(r.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {r.details && <p className="row-text">Chi tiết: {r.details}</p>}
                        </div>
                        <div className="row-actions">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="btn sm-btn primary-btn"
                                onClick={() => handleResolveReport(r.id, 'reviewed')}
                              >
                                ✓ Đã xử lý
                              </button>
                              <button
                                type="button"
                                className="btn sm-btn ghost-btn"
                                onClick={() => handleResolveReport(r.id, 'dismissed')}
                              >
                                Bỏ qua
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="admin-tab-content">
                <form onSubmit={handleSaveSettings} className="admin-settings-form paper">
                  <div className="form-group">
                    <label className="field-label" htmlFor="teacher-name-setting">
                      Tên / Danh xưng cô giáo chủ nhiệm
                    </label>
                    <input
                      id="teacher-name-setting"
                      type="text"
                      value={settings.teacher_name || ''}
                      onChange={e => setSettings(prev => ({ ...prev, teacher_name: e.target.value }))}
                      className="text-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label" htmlFor="allow-anon-setting">
                      Cho phép học sinh gửi lời chúc ẩn danh
                    </label>
                    <select
                      id="allow-anon-setting"
                      value={settings.allow_anonymous || 'true'}
                      onChange={e => setSettings(prev => ({ ...prev, allow_anonymous: e.target.value }))}
                      className="text-input"
                    >
                      <option value="true">Có cho phép</option>
                      <option value="false">Không (bắt buộc nhập tên)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn primary-btn" style={{ marginTop: '1rem' }}>
                    Lưu cấu hình website 💾
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
