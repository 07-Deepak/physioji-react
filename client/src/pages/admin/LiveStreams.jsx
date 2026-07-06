import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCopy, FiEdit2, FiEye, FiFilePlus, FiStar, FiPlay, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import { useAdmin } from '../../contexts/AdminContext'
import { API_BASE_URL, LIVE_STREAM_SERVER_URL, getPublicAssetUrl } from '../../utils/apiUrl'

const CATEGORIES = ['Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const STATUSES = ['all', 'upcoming', 'live', 'ended', 'cancelled']
const FEATURED = ['all', 'true', 'false']
const SORTS = ['Latest', 'Oldest', 'Upcoming', 'Live']
const LIMITS = ['6', '12', '24', '48']

const FALLBACK_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#14b8a6"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" rx="40" fill="url(#g)"/>
      <circle cx="790" cy="110" r="84" fill="rgba(255,255,255,0.08)"/>
      <circle cx="150" cy="390" r="130" fill="rgba(255,255,255,0.07)"/>
      <rect x="88" y="130" width="650" height="62" rx="16" fill="rgba(255,255,255,0.14)"/>
      <text x="88" y="448" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700">
        Live Streams
      </text>
    </svg>`
  )

const safeNumber = (value) => Number(value || 0)

const safeDate = (value) => {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not scheduled' : date.toLocaleString()
}

const toDatetimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const normalizeLiveStream = (item) => ({
  ...item,
  title: item?.title || 'Untitled Live Stream',
  description: item?.description || 'No description available',
  category: item?.category || 'General',
  subject: item?.subject || 'N/A',
  instructor: item?.instructor || 'Unknown',
  streamKey: item?.streamKey || '',
  hlsUrl: item?.hlsUrl || '',
  streamServerUrl: item?.streamServerUrl || LIVE_STREAM_SERVER_URL,
  thumbnail: item?.thumbnail || '',
  scheduledAt: item?.scheduledAt || null,
  startedAt: item?.startedAt || null,
  endedAt: item?.endedAt || null,
  status: item?.status || 'upcoming',
  isFeatured: !!item?.isFeatured,
  viewers: safeNumber(item?.viewers),
  tags: normalizeTags(item?.tags),
  createdAt: item?.createdAt || null,
  updatedAt: item?.updatedAt || null,
})

const normalizeStats = (incoming = {}) => ({
  totalLiveStreams: safeNumber(incoming.totalLiveStreams),
  upcomingCount: safeNumber(incoming.upcomingCount),
  liveCount: safeNumber(incoming.liveCount),
  endedCount: safeNumber(incoming.endedCount),
  cancelledCount: safeNumber(incoming.cancelledCount),
  featuredCount: safeNumber(incoming.featuredCount),
  totalViewers: safeNumber(incoming.totalViewers),
  nextScheduledAt: incoming.nextScheduledAt || null,
})

const copyToClipboard = async (value, showToast) => {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    showToast('Copied to clipboard', 'success')
  } catch {
    showToast('Copy failed', 'error')
  }
}

export default function LiveStreams() {
  const { showToast } = useToast()
  const { adminToken, checkAdmin } = useAdmin()
  const api = useMemo(
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
  const [liveStreams, setLiveStreams] = useState([])
  const [count, setCount] = useState(0)
  const [stats, setStats] = useState({
    totalLiveStreams: 0,
    upcomingCount: 0,
    liveCount: 0,
    endedCount: 0,
    cancelledCount: 0,
    featuredCount: 0,
    totalViewers: 0,
    nextScheduledAt: null,
  })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [status, setStatus] = useState('all')
  const [featured, setFeatured] = useState('all')
  const [sort, setSort] = useState('Latest')
  const pageSize = Number(limit) || 12
  const totalPages = Math.max(Math.ceil(count / pageSize), 1)

  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [error, setError] = useState('')

  const thumbRef = useRef(null)
  const [thumbPreview, setThumbPreview] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    subject: SUBJECTS[0],
    instructor: '',
    scheduledAt: '',
    status: 'upcoming',
    isFeatured: false,
    tags: '',
    thumbnail: null,
  })

  const selected = useMemo(() => liveStreams.find((item) => item._id === viewId) || null, [liveStreams, viewId])

  const fetchStats = async () => {
    const response = await api.get('/admin/live-streams/stats')
    setStats(normalizeStats(response.data?.stats || response.data || {}))
  }

  const fetchLiveStreams = async () => {
    const response = await api.get('/admin/live-streams', {
      params: {
        q: query.trim() || undefined,
        category: category === 'all' ? undefined : category,
        subject: subject === 'all' ? undefined : subject,
        status,
        featured,
        sort,
        page,
        limit: pageSize,
      },
    })

    const rows = response.data?.liveStreams || []
    setLiveStreams(Array.isArray(rows) ? rows.map(normalizeLiveStream) : [])
    setCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    let alive = true

    const boot = async () => {
      try {
        setLoading(true)
        setError('')
        if (!adminToken) await checkAdmin?.()
        await Promise.all([fetchStats(), fetchLiveStreams()])
      } catch (err) {
        if (!alive) return
        const message = err?.response?.data?.message || err?.message || 'Failed to load live streams'
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
  }, [page, limit, query, category, subject, status, featured, sort, adminToken])

  useEffect(() => {
    if (!form.thumbnail) {
      setThumbPreview(editId ? getPublicAssetUrl(selected?.thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB)
      return undefined
    }

    const url = URL.createObjectURL(form.thumbnail)
    setThumbPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.thumbnail, editId, selected?.thumbnail])

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: CATEGORIES[0],
      subject: SUBJECTS[0],
      instructor: '',
      scheduledAt: '',
      status: 'upcoming',
      isFeatured: false,
      tags: '',
      thumbnail: null,
    })
    if (thumbRef.current) thumbRef.current.value = ''
  }

  const openCreate = () => {
    setFormOpen(true)
    setEditId(null)
    setViewId(null)
    resetForm()
  }

  const openEdit = (item) => {
    setFormOpen(true)
    setEditId(item._id)
    setViewId(null)
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || CATEGORIES[0],
      subject: item.subject || SUBJECTS[0],
      instructor: item.instructor || '',
      scheduledAt: toDatetimeLocal(item.scheduledAt),
      status: item.status || 'upcoming',
      isFeatured: !!item.isFeatured,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      thumbnail: null,
    })
    if (thumbRef.current) thumbRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) return showToast('Title is required', 'error')
    if (!form.description.trim()) return showToast('Description is required', 'error')
    if (!form.category) return showToast('Category is required', 'error')
    if (!form.subject) return showToast('Subject is required', 'error')
    if (!form.instructor.trim()) return showToast('Instructor is required', 'error')
    if (!form.scheduledAt) return showToast('Scheduled time is required', 'error')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('category', form.category)
    fd.append('subject', form.subject)
    fd.append('instructor', form.instructor.trim())
    fd.append('scheduledAt', form.scheduledAt)
    fd.append('status', form.status)
    fd.append('isFeatured', String(form.isFeatured))
    fd.append('tags', form.tags || '')
    if (form.thumbnail) fd.append('thumbnail', form.thumbnail)

    try {
      setSaving(true)
      if (editId) {
        await api.put(`/admin/live-streams/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Live stream updated successfully', 'success')
      } else {
        await api.post('/admin/live-streams', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Live stream created successfully', 'success')
      }

      setFormOpen(false)
      setEditId(null)
      resetForm()
      await Promise.all([fetchStats(), fetchLiveStreams()])
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id) => {
    try {
      await api.delete(`/admin/live-streams/${id}`)
      showToast('Live stream deleted successfully', 'success')
      setConfirm({ open: false, id: null })
      if (viewId === id) setViewId(null)
      await Promise.all([fetchStats(), fetchLiveStreams()])
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error')
    }
  }

  const patchStatus = async (item, nextStatus) => {
    try {
      await api.patch(`/admin/live-streams/${item._id}/status`, { status: nextStatus })
      showToast('Status updated successfully', 'success')
      await Promise.all([fetchStats(), fetchLiveStreams()])
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Status update failed', 'error')
    }
  }

  const patchFeatured = async (item) => {
    try {
      await api.patch(`/admin/live-streams/${item._id}/featured`, { isFeatured: !item.isFeatured })
      showToast('Featured flag updated successfully', 'success')
      await Promise.all([fetchStats(), fetchLiveStreams()])
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Feature update failed', 'error')
    }
  }

  if (loading) return <Loader text="Loading live streams..." />

  const selectedPlaybackUrl = selected?.hlsUrl ? getPublicAssetUrl(selected.hlsUrl) : ''

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Admin | Live Streams</div>
        <h2>Live Stream Management</h2>
      </div>

      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Total</div>
          <div className="admin-stat-value">{safeNumber(stats.totalLiveStreams).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Upcoming</div>
          <div className="admin-stat-value">{safeNumber(stats.upcomingCount).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Live</div>
          <div className="admin-stat-value">{safeNumber(stats.liveCount).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Ended</div>
          <div className="admin-stat-value">{safeNumber(stats.endedCount).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Featured</div>
          <div className="admin-stat-value">{safeNumber(stats.featuredCount).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Total Viewers</div>
          <div className="admin-stat-value">{safeNumber(stats.totalViewers).toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Next Scheduled</div>
          <div className="admin-stat-value" style={{ fontSize: 14 }}>{safeDate(stats.nextScheduledAt)}</div>
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
            placeholder="Search live streams"
          />
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={subject} onChange={(e) => { setPage(1); setSubject(e.target.value) }}>
            <option value="all">All Subjects</option>
            {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            {STATUSES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All Status' : item}</option>)}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={featured} onChange={(e) => { setPage(1); setFeatured(e.target.value) }}>
            {FEATURED.map((item) => <option key={item} value={item}>{item === 'all' ? 'All Featured' : item === 'true' ? 'Featured only' : 'Not featured'}</option>)}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value) }}>
            {SORTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={limit} onChange={(e) => { setPage(1); setLimit(e.target.value) }}>
            {LIMITS.map((item) => <option key={item} value={item}>{item} / page</option>)}
          </select>
        </div>

        <div className="admin-filter-actions">
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <FiFilePlus /> Create Live Stream
          </button>
        </div>
      </div>

      {error ? (
        <div className="fcard light" style={{ marginTop: 16, padding: 18, color: 'var(--danger, #ef4444)' }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {liveStreams.length === 0 ? (
          <EmptyState title="No live streams found" description="Create your first live stream or adjust filters." />
        ) : (
          <>
            <div className="admin-resources-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {liveStreams.map((item) => {
                const thumb = item.thumbnail
                  ? item.thumbnail.startsWith('http')
                    ? item.thumbnail
                    : getPublicAssetUrl(item.thumbnail, FALLBACK_THUMB)
                  : FALLBACK_THUMB
                return (
                  <div key={item._id} className="admin-resource-card" style={{ overflow: 'hidden' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={thumb}
                        alt={item.title}
                        className="admin-resource-thumb"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_THUMB
                        }}
                      />
                      {item.isFeatured ? <span className="tag" style={{ position: 'absolute', left: 12, top: 12 }}><FiStar /> Featured</span> : null}
                    </div>
                    <div className="admin-resource-meta">
                      <div className="admin-resource-title">{item.title}</div>
                      <div className="admin-muted">{item.category} | {item.subject}</div>
                      <div className="admin-muted">Instructor: {item.instructor}</div>
                      <div className="admin-muted">Scheduled: {safeDate(item.scheduledAt)}</div>
                      <div className="admin-muted">Viewers: {safeNumber(item.viewers).toLocaleString()}</div>
                      <div className="admin-muted">Stream Key: {item.streamKey || 'Not generated'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <span className="tag">{item.status || 'upcoming'}</span>
                        {item.isFeatured ? <span className="tag">Featured</span> : null}
                      </div>
                      <div className="admin-resource-actions" style={{ marginTop: 12 }}>
                        <button className="btn" type="button" onClick={() => setViewId(item._id)}>
                          <FiEye /> View
                        </button>
                        <button className="btn" type="button" onClick={() => openEdit(item)}>
                          <FiEdit2 /> Edit
                        </button>
                        <button className="btn" type="button" onClick={() => setConfirm({ open: true, id: item._id })}>
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <button className="btn btn-small" type="button" onClick={() => patchStatus(item, 'live')}>
                          <FiPlay /> Go Live
                        </button>
                        <select className="admin-select" value={item.status || 'upcoming'} onChange={(e) => patchStatus(item, e.target.value)}>
                          {STATUSES.filter((x) => x !== 'all').map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-small" type="button" onClick={() => patchFeatured(item)}>
                          {item.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                      </div>
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
        title="Live Stream Details"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault()
          setViewId(null)
        }}
        width={900}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Thumbnail</label>
              {selected.thumbnail ? (
                <img
                  src={getPublicAssetUrl(selected.thumbnail, FALLBACK_THUMB)}
                  alt={selected.title}
                  style={{ width: 220, height: 124, borderRadius: 18, objectFit: 'cover', border: '1px solid rgba(20,184,166,0.25)' }}
                />
              ) : (
                <div className="admin-muted">No thumbnail</div>
              )}
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Title</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{selected.title}</div>
            </div>
            <div className="admin-field">
              <label>Status</label>
              <div className="admin-readonly">{selected.status}</div>
            </div>
            <div className="admin-field">
              <label>Featured</label>
              <div className="admin-readonly">{selected.isFeatured ? 'Yes' : 'No'}</div>
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
              <label>Instructor</label>
              <div className="admin-readonly">{selected.instructor}</div>
            </div>
            <div className="admin-field">
              <label>Scheduled</label>
              <div className="admin-readonly">{safeDate(selected.scheduledAt)}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <div className="admin-readonly">{selected.description}</div>
            </div>
            <div className="admin-field">
              <label>Stream Server URL</label>
              <div className="admin-readonly" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{selected.streamServerUrl || LIVE_STREAM_SERVER_URL}</span>
                <button className="btn btn-small" type="button" onClick={() => copyToClipboard(selected.streamServerUrl || LIVE_STREAM_SERVER_URL, showToast)}>
                  <FiCopy /> Copy
                </button>
              </div>
            </div>
            <div className="admin-field">
              <label>Stream Key</label>
              <div className="admin-readonly" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{selected.streamKey || 'Not generated'}</span>
                <button className="btn btn-small" type="button" onClick={() => copyToClipboard(selected.streamKey, showToast)}>
                  <FiCopy /> Copy
                </button>
              </div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>HLS Playback URL</label>
              <div className="admin-readonly" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <a className="link" href={selectedPlaybackUrl} target="_blank" rel="noreferrer">
                  {selectedPlaybackUrl || 'Not ready yet'}
                </a>
                {selectedPlaybackUrl ? (
                  <button className="btn btn-small" type="button" onClick={() => copyToClipboard(selectedPlaybackUrl, showToast)}>
                    <FiCopy /> Copy
                  </button>
                ) : null}
              </div>
            </div>
            <div className="admin-field">
              <label>Viewers</label>
              <div className="admin-readonly">{safeNumber(selected.viewers).toLocaleString()}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Tags</label>
              <div className="admin-readonly">{Array.isArray(selected.tags) && selected.tags.length ? selected.tags.join(', ') : 'N/A'}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Live stream not found" description="This stream may have been removed." />
        )}
      </FormModal>

      <FormModal
        open={formOpen}
        title={editId ? 'Edit Live Stream' : 'Create Live Stream'}
        onClose={() => {
          setFormOpen(false)
          setEditId(null)
        }}
        submitText={editId ? 'Update' : 'Create'}
        onSubmit={submit}
        width={940}
        submitDisabled={saving}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Description</label>
            <textarea className="admin-textarea" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Category</label>
            <select className="admin-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Subject</label>
            <select className="admin-select" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}>
              {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Instructor</label>
            <input value={form.instructor} onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Scheduled At</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Status</label>
            <select className="admin-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {['upcoming', 'live', 'ended', 'cancelled'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Featured</label>
            <select className="admin-select" value={form.isFeatured ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.value === 'true' }))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Thumbnail</label>
            <input
              ref={thumbRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.files?.[0] || null }))}
            />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Thumbnail Preview</label>
            <img
              src={thumbPreview || FALLBACK_THUMB}
              alt="thumbnail preview"
              style={{ width: 220, height: 124, borderRadius: 18, objectFit: 'cover', border: '1px solid rgba(20,184,166,0.25)' }}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_THUMB
              }}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Live Stream?"
        description="This will remove the live stream record and thumbnail."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => deleteItem(confirm.id)}
      />
    </div>
  )
}
