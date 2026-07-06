import { useEffect, useMemo, useRef, useState } from 'react'
import { FiEdit2, FiEye, FiFilePlus, FiTrash2, FiPlayCircle } from 'react-icons/fi'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import { useAdmin } from '../../contexts/AdminContext'
import { API_BASE_URL, getPublicAssetUrl } from '../../utils/apiUrl'

const CATEGORIES = ['Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const STATUSES = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
]
const SORTS = ['Latest', 'Oldest', 'MostViewed']
const LIMITS = ['6', '12', '24', '48']

const FALLBACK_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#052e16"/>
          <stop offset="100%" stop-color="#14b8a6"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" rx="34" fill="url(#g)"/>
      <circle cx="650" cy="92" r="74" fill="rgba(255,255,255,0.08)"/>
      <circle cx="132" cy="328" r="108" fill="rgba(255,255,255,0.07)"/>
      <rect x="88" y="122" width="624" height="56" rx="16" fill="rgba(255,255,255,0.13)"/>
      <rect x="88" y="200" width="468" height="30" rx="10" fill="rgba(255,255,255,0.12)"/>
      <text x="88" y="352" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700">
        Video Library
      </text>
    </svg>`
  )

const safeNumber = (value) => Number(value || 0)

const formatBytes = (bytes) => {
  const n = safeNumber(bytes)
  if (n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const size = n / 1024 ** idx
  return `${size.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const normalizeVideo = (video) => ({
  ...video,
  title: video?.title || 'Untitled Video',
  description: video?.description || 'No description available',
  category: video?.category || 'General',
  subject: video?.subject || 'N/A',
  duration: video?.duration || 'N/A',
  author: video?.author || 'Unknown',
  tags: normalizeTags(video?.tags),
  thumbnail: video?.thumbnail || '',
  videoUrl: video?.videoUrl || '',
  videoName: video?.videoName || 'No video',
  videoSize: safeNumber(video?.videoSize),
  videoType: video?.videoType || 'Unknown',
  views: safeNumber(video?.views),
  status: video?.status ?? true,
  createdAt: video?.createdAt || null,
  updatedAt: video?.updatedAt || null,
})

const normalizeStats = (incoming = {}) => ({
  totalVideos: safeNumber(incoming.totalVideos),
  activeVideos: safeNumber(incoming.activeVideos),
  inactiveVideos: safeNumber(incoming.inactiveVideos),
  totalViews: safeNumber(incoming.totalViews),
  lastUploaded: incoming.lastUploaded?.createdAt || incoming.lastUploaded || null,
})

const videoTypeLabel = (mime) => {
  if (!mime || mime === 'Unknown') return 'VIDEO'
  if (mime === 'video/mp4') return 'MP4'
  if (mime === 'video/quicktime') return 'MOV'
  if (mime === 'video/x-msvideo') return 'AVI'
  if (mime === 'video/x-matroska') return 'MKV'
  if (mime === 'video/webm') return 'WEBM'
  return mime
}

export default function Videos() {
  const { showToast } = useToast()
  const { adminToken, checkAdmin } = useAdmin()

  const adminApi = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
        },
        withCredentials: true,
      }),
    [adminToken]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [videos, setVideos] = useState([])
  const [stats, setStats] = useState({
    totalVideos: 0,
    activeVideos: 0,
    inactiveVideos: 0,
    totalViews: 0,
    lastUploaded: null,
  })

  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('Latest')
  const pageSize = Number(limit) || 12
  const totalPages = Math.max(Math.ceil(count / pageSize), 1)

  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)
  const thumbInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    subject: SUBJECTS[0],
    duration: '',
    author: '',
    tags: '',
    status: true,
    video: null,
    thumbnail: null,
  })

  const [videoPreview, setVideoPreview] = useState('')
  const [thumbPreview, setThumbPreview] = useState('')

  const selected = useMemo(() => videos.find((v) => v._id === viewId) || null, [videos, viewId])
  const editing = useMemo(() => videos.find((v) => v._id === editId) || null, [videos, editId])

  const fetchStats = async () => {
    const response = await adminApi.get('/admin/videos/stats')
    setStats(normalizeStats(response.data?.stats || response.data || {}))
  }

  const fetchVideos = async () => {
    const response = await adminApi.get('/admin/videos', {
      params: {
        q: query.trim() || undefined,
        category: category === 'all' ? undefined : category,
        subject: subject === 'all' ? undefined : subject,
        status,
        sort,
        page,
        limit: pageSize,
      },
    })

    const rows = response.data?.videos || []
    setVideos(Array.isArray(rows) ? rows.map(normalizeVideo) : [])
    setCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    let alive = true

    const boot = async () => {
      try {
        setLoading(true)
        setError('')
        if (!adminToken) await checkAdmin?.()
        await Promise.all([fetchStats(), fetchVideos()])
      } catch (err) {
        if (!alive) return
        const message = err?.response?.data?.message || err?.message || 'Failed to load videos'
        setError(message)
        showToast(message, 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }

    boot()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, query, category, subject, status, sort, adminToken])

  useEffect(() => {
    if (!form.thumbnail) {
      setThumbPreview(getPublicAssetUrl(editing?.thumbnail || '', ''))
      return undefined
    }

    const url = URL.createObjectURL(form.thumbnail)
    setThumbPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.thumbnail, editing?.thumbnail])

  useEffect(() => {
    if (!form.video) {
      setVideoPreview(getPublicAssetUrl(editing?.videoUrl || '', ''))
      return undefined
    }

    const url = URL.createObjectURL(form.video)
    setVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.video, editing?.videoUrl])

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: CATEGORIES[0],
      subject: SUBJECTS[0],
      duration: '',
      author: '',
      tags: '',
      status: true,
      video: null,
      thumbnail: null,
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (thumbInputRef.current) thumbInputRef.current.value = ''
  }

  const openUpload = () => {
    setUploadOpen(true)
    setEditId(null)
    setViewId(null)
    resetForm()
  }

  const openEdit = (video) => {
    setUploadOpen(true)
    setEditId(video._id)
    setViewId(null)
    setForm({
      title: video.title || '',
      description: video.description || '',
      category: video.category || CATEGORIES[0],
      subject: video.subject || SUBJECTS[0],
      duration: String(video.duration || ''),
      author: video.author || '',
      tags: Array.isArray(video.tags) ? video.tags.join(', ') : (video.tags || ''),
      status: !!video.status,
      video: null,
      thumbnail: null,
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (thumbInputRef.current) thumbInputRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) return showToast('Title is required', 'error')
    if (!form.description.trim()) return showToast('Description is required', 'error')
    if (!form.category) return showToast('Category is required', 'error')
    if (!form.subject) return showToast('Subject is required', 'error')
    if (!form.duration.trim()) return showToast('Duration is required', 'error')
    if (!form.author.trim()) return showToast('Author is required', 'error')
    if (!editId && !form.video) return showToast('Video file is required', 'error')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('category', form.category)
    fd.append('subject', form.subject)
    fd.append('duration', form.duration.trim())
    fd.append('author', form.author.trim())
    fd.append('tags', form.tags || '')
    fd.append('status', String(form.status))

    if (form.video) fd.append('video', form.video)
    if (form.thumbnail) fd.append('thumbnail', form.thumbnail)

    try {
      setSaving(true)
      if (editId) {
        await adminApi.put(`/admin/videos/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Video updated successfully', 'success')
      } else {
        await adminApi.post('/admin/videos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Video uploaded successfully', 'success')
      }

      setUploadOpen(false)
      setEditId(null)
      resetForm()
      await Promise.all([fetchStats(), fetchVideos()])
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Video save failed'
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteVideo = async (id) => {
    try {
      await adminApi.delete(`/admin/videos/${id}`)
      showToast('Video deleted successfully', 'success')
      setConfirm({ open: false, id: null })
      if (viewId === id) setViewId(null)
      await Promise.all([fetchStats(), fetchVideos()])
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Delete failed'
      showToast(message, 'error')
    }
  }

  const toggleStatus = async (video) => {
    try {
      await adminApi.patch(`/admin/videos/${video._id}/status`, { status: !video.status })
      showToast(`Video marked ${!video.status ? 'active' : 'inactive'}`, 'success')
      await Promise.all([fetchStats(), fetchVideos()])
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Status update failed'
      showToast(message, 'error')
    }
  }

  const categories = useMemo(() => ['all', ...CATEGORIES], [])
  const subjects = useMemo(() => ['all', ...SUBJECTS], [])

  if (loading) return <Loader text="Loading videos..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Admin • Videos</div>
        <h2>Video Management</h2>
      </div>

      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Total Videos</div>
          <div className="admin-stat-value">{safeNumber(stats.totalVideos).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Active Videos</div>
          <div className="admin-stat-value">{safeNumber(stats.activeVideos).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Inactive Videos</div>
          <div className="admin-stat-value">{safeNumber(stats.inactiveVideos).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Total Views</div>
          <div className="admin-stat-value">{safeNumber(stats.totalViews).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Last Uploaded</div>
          <div className="admin-stat-value" style={{ fontSize: 14 }}>{formatDate(stats.lastUploaded)}</div>
        </div>
      </div>

      <div className="admin-filters" style={{ marginTop: 18 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar
            value={query}
            onChange={(v) => {
              setPage(1)
              setQuery(v)
            }}
            placeholder="Search videos"
          />
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={category}
            onChange={(e) => {
              setPage(1)
              setCategory(e.target.value)
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={subject}
            onChange={(e) => {
              setPage(1)
              setSubject(e.target.value)
            }}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Subjects' : s}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={sort}
            onChange={(e) => {
              setPage(1)
              setSort(e.target.value)
            }}
          >
            {SORTS.map((item) => (
              <option key={item} value={item}>
                {item === 'MostViewed' ? 'Most Viewed' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(e.target.value)
            }}
          >
            {LIMITS.map((item) => (
              <option key={item} value={item}>
                {item} / page
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-actions">
          <button className="btn btn-primary" type="button" onClick={openUpload}>
            <FiFilePlus /> Upload Video
          </button>
        </div>
      </div>

      {error ? (
        <div className="fcard light" style={{ marginTop: 16, padding: 18, color: 'var(--danger, #ef4444)' }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {videos.length === 0 ? (
          <EmptyState title="No videos found" description="Upload a new video or adjust your filters." />
        ) : (
          <>
            <div className="admin-resources-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {videos.map((video) => {
                const thumbSrc = getPublicAssetUrl(video.thumbnail, FALLBACK_THUMB)
                return (
                  <div key={video._id} className="admin-resource-card" style={{ overflow: 'hidden' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={thumbSrc}
                        alt={video.title}
                        className="admin-resource-thumb"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_THUMB
                        }}
                      />
                      <span className="tag" style={{ position: 'absolute', left: 12, top: 12 }}>
                        {videoTypeLabel(video.videoType)}
                      </span>
                    </div>
                    <div className="admin-resource-meta">
                      <div className="admin-resource-title">{video.title}</div>
                      <div className="admin-muted" style={{ marginBottom: 4 }}>{video.category}</div>
                      <div className="admin-muted" style={{ marginBottom: 4 }}>{video.subject}</div>
                      <div className="admin-muted" style={{ marginBottom: 4 }}>By {video.author}</div>
                      <div className="admin-muted" style={{ marginBottom: 4 }}>{formatBytes(video.videoSize)} · {video.views.toLocaleString()} views</div>
                      <div className="admin-muted" style={{ marginBottom: 6 }}>Duration: {video.duration || 'N/A'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <span className="tag">{video.status ? 'Active' : 'Inactive'}</span>
                        {Array.isArray(video.tags) && video.tags[0] ? <span className="tag">{video.tags[0]}</span> : null}
                      </div>
                      <div className="admin-resource-actions" style={{ marginTop: 12 }}>
                        <button className="btn" type="button" onClick={() => setViewId(video._id)}>
                          <FiEye /> View
                        </button>
                        <button className="btn" type="button" onClick={() => openEdit(video)}>
                          <FiEdit2 /> Edit
                        </button>
                        <button className="btn" type="button" onClick={() => setConfirm({ open: true, id: video._id })}>
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                      <div className="admin-resource-link" style={{ marginTop: 10 }}>
                        <FiPlayCircle />{' '}
                        <a href={video.videoUrl ? getPublicAssetUrl(video.videoUrl, '#') : '#'} target="_blank" rel="noreferrer">
                          Open video
                        </a>
                      </div>
                      <button
                        className="btn btn-small"
                        type="button"
                        onClick={() => toggleStatus(video)}
                        style={{ marginTop: 10, padding: '8px 12px', borderRadius: 999 }}
                      >
                        {video.status ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="admin-page-footer">
              <div className="admin-muted">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, count)} of {count}
              </div>
              <Pagination page={page} pageSize={pageSize} total={count} onPageChange={(p) => setPage(p)} />
            </div>
          </>
        )}
      </div>

      <FormModal
        open={!!viewId}
        title="Video Details"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault()
          setViewId(null)
        }}
        width={860}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Thumbnail</label>
              <div>
                {selected.thumbnail ? (
                  <img
                    src={getPublicAssetUrl(selected.thumbnail, FALLBACK_THUMB)}
                    alt="thumbnail"
                    style={{ width: 180, height: 110, borderRadius: 16, objectFit: 'cover', border: '1px solid rgba(20,184,166,0.25)' }}
                  />
                ) : (
                  <div className="admin-muted">No thumbnail</div>
                )}
              </div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Video Preview</label>
              <video
                controls
                style={{ width: '100%', maxHeight: 360, borderRadius: 16, background: '#000' }}
                src={selected.videoUrl ? getPublicAssetUrl(selected.videoUrl, '') : ''}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Title</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{selected.title}</div>
            </div>
            <div className="admin-field">
              <label>Category</label>
              <div className="admin-readonly">{selected.category}</div>
            </div>
            <div className="admin-field">
              <label>Subject</label>
              <div className="admin-readonly">{selected.subject}</div>
            </div>
            <div className="admin-field">
              <label>Duration</label>
              <div className="admin-readonly">{selected.duration}</div>
            </div>
            <div className="admin-field">
              <label>Author</label>
              <div className="admin-readonly">{selected.author}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <div className="admin-readonly">{selected.description}</div>
            </div>
            <div className="admin-field">
              <label>Video Name</label>
              <div className="admin-readonly">{selected.videoName}</div>
            </div>
            <div className="admin-field">
              <label>Video Type</label>
              <div className="admin-readonly">{selected.videoType}</div>
            </div>
            <div className="admin-field">
              <label>Video Size</label>
              <div className="admin-readonly">{formatBytes(selected.videoSize)}</div>
            </div>
            <div className="admin-field">
              <label>Views</label>
              <div className="admin-readonly">{safeNumber(selected.views).toLocaleString()}</div>
            </div>
            <div className="admin-field">
              <label>Status</label>
              <div className="admin-readonly">{selected.status ? 'Active' : 'Inactive'}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Tags</label>
              <div className="admin-readonly">{Array.isArray(selected.tags) && selected.tags.length ? selected.tags.join(', ') : 'N/A'}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Uploaded</label>
              <div className="admin-readonly">{formatDate(selected.createdAt)}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Video not found" description="This video may have been removed." />
        )}
      </FormModal>

      <FormModal
        open={uploadOpen}
        title={editId ? 'Edit Video' : 'Upload Video'}
        onClose={() => {
          setUploadOpen(false)
          setEditId(null)
        }}
        submitText={editId ? 'Update Video' : 'Upload'}
        onSubmit={submit}
        width={920}
        submitDisabled={saving}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Description</label>
            <textarea
              className="admin-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="admin-field">
            <label>Category</label>
            <select className="admin-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Subject</label>
            <select className="admin-select" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}>
              {SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Duration</label>
            <input
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 12:45 or 15 min"
            />
          </div>

          <div className="admin-field">
            <label>Author</label>
            <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. rehab, cardio, mobility"
            />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Video File {editId ? '(optional for edit)' : ''}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.avi,.mkv,.webm,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
              onChange={(e) => setForm((f) => ({ ...f, video: e.target.files?.[0] || null }))}
            />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Thumbnail (optional)</label>
            <input
              ref={thumbInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.files?.[0] || null }))}
            />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Status</label>
            <select className="admin-select" value={form.status ? 'active' : 'inactive'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value === 'active' }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Thumbnail Preview</label>
            <div>
              <img
                src={thumbPreview || FALLBACK_THUMB}
                alt="thumbnail preview"
                style={{ width: 220, height: 130, borderRadius: 16, objectFit: 'cover', border: '1px solid rgba(20,184,166,0.25)' }}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_THUMB
                }}
              />
            </div>
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Video Preview</label>
            {videoPreview ? (
              <video
                controls
                style={{ width: '100%', maxHeight: 340, borderRadius: 16, background: '#000' }}
                src={videoPreview}
              />
            ) : (
              <div className="admin-muted">No video selected</div>
            )}
            {editId ? <div className="admin-muted" style={{ marginTop: 8 }}>Current video will stay if not replaced.</div> : null}
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Video?"
        description="This will remove the uploaded file, thumbnail, and database record."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => deleteVideo(confirm.id)}
      />
    </div>
  )
}
