import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiEdit2, FiEye, FiMessageSquare, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import { useAdmin } from '../../contexts/AdminContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import DataTable from '../../components/admin/DataTable'
import { API_BASE_URL } from '../../utils/apiUrl'

const CATEGORIES = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const STATUSES = ['all', 'pending', 'answered', 'rejected']
const SORTS = ['Latest', 'Oldest', 'MostViewed', 'MostLiked']
const LIMITS = ['6', '12', '24', '48']

const safeNumber = (value) => Number(value || 0)

const safeDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const normalizeDoubt = (doubt) => ({
  ...doubt,
  title: doubt?.title || 'Untitled Doubt',
  description: doubt?.description || 'No description available',
  category: doubt?.category || 'General',
  subject: doubt?.subject || 'N/A',
  askedBy: doubt?.askedBy || 'User',
  userName: doubt?.userName || doubt?.askedBy || 'User',
  userEmail: doubt?.userEmail || 'N/A',
  status: doubt?.status || 'pending',
  answer: doubt?.answer || '',
  views: safeNumber(doubt?.views),
  likes: safeNumber(doubt?.likes),
  tags: normalizeTags(doubt?.tags),
  createdAt: doubt?.createdAt || null,
  answeredAt: doubt?.answeredAt || null,
})

const normalizeStats = (incoming = {}) => ({
  totalDoubts: safeNumber(incoming.totalDoubts),
  pendingDoubts: safeNumber(incoming.pendingDoubts),
  answeredDoubts: safeNumber(incoming.answeredDoubts),
  rejectedDoubts: safeNumber(incoming.rejectedDoubts),
  totalViews: safeNumber(incoming.totalViews),
  totalLikes: safeNumber(incoming.totalLikes),
  latestDoubtDate: incoming.latestDoubtDate || null,
})

const badgeStyle = (status) => {
  if (status === 'answered') return { background: 'rgba(16,185,129,0.14)', color: '#047857' }
  if (status === 'rejected') return { background: 'rgba(239,68,68,0.14)', color: '#b91c1c' }
  return { background: 'rgba(245,158,11,0.16)', color: '#b45309' }
}

export default function Doubts() {
  const { showToast } = useToast()
  const { adminToken, checkAdmin } = useAdmin()

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
        withCredentials: true,
      }),
    [adminToken]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doubts, setDoubts] = useState([])
  const [count, setCount] = useState(0)
  const [stats, setStats] = useState({
    totalDoubts: 0,
    pendingDoubts: 0,
    answeredDoubts: 0,
    rejectedDoubts: 0,
    totalViews: 0,
    totalLikes: 0,
    latestDoubtDate: null,
  })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('Latest')
  const pageSize = Number(limit) || 12

  const [activeId, setActiveId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [error, setError] = useState('')
  const [answerText, setAnswerText] = useState('')

  const selected = useMemo(() => doubts.find((item) => item._id === activeId) || null, [doubts, activeId])
  const totalPages = Math.max(Math.ceil(count / pageSize), 1)

  const fetchStats = async () => {
    const response = await api.get('/admin/doubts/stats')
    setStats(normalizeStats(response.data?.stats || response.data || {}))
  }

  const fetchDoubts = async () => {
    const response = await api.get('/admin/doubts', {
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

    const rows = response.data?.doubts || []
    setDoubts(Array.isArray(rows) ? rows.map(normalizeDoubt) : [])
    setCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    let alive = true

    const boot = async () => {
      try {
        setLoading(true)
        setError('')
        if (!adminToken) await checkAdmin?.()
        await Promise.all([fetchStats(), fetchDoubts()])
      } catch (err) {
        if (!alive) return
        const message = err?.response?.data?.message || err?.message || 'Failed to load doubts'
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
    if (!selected) {
      setAnswerText('')
      return
    }
    setAnswerText(selected.answer || '')
  }, [selected])

  const refresh = async () => {
    await Promise.all([fetchStats(), fetchDoubts()])
  }

  const openDetail = (item) => {
    setActiveId(item._id)
  }

  const patchStatus = async (item, nextStatus) => {
    try {
      await api.patch(`/admin/doubts/${item._id}/status`, { status: nextStatus })
      showToast('Doubt status updated successfully', 'success')
      await refresh()
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Status update failed', 'error')
    }
  }

  const answerDoubt = async (e) => {
    e.preventDefault()
    if (!selected) return
    const answer = answerText.trim()
    if (!answer) {
      showToast('Answer text is required', 'error')
      return
    }

    try {
      setSaving(true)
      await api.patch(`/admin/doubts/${selected._id}/answer`, { answer })
      showToast('Doubt answered successfully', 'success')
      setActiveId(null)
      setAnswerText('')
      await refresh()
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Answer failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteDoubt = async (id) => {
    try {
      await api.delete(`/admin/doubts/${id}`)
      showToast('Doubt deleted successfully', 'success')
      setConfirm({ open: false, id: null })
      if (activeId === id) setActiveId(null)
      await refresh()
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error')
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        tdClassName: 'admin-td-strong',
        render: (value, row) => (
          <div>
            <div style={{ fontWeight: 950 }}>{value || 'Untitled Doubt'}</div>
            <div className="admin-muted" style={{ fontSize: 12 }}>
              {row?.category || 'General'} | {row?.subject || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        key: 'userName',
        label: 'Asked By',
        render: (value, row) => (
          <div>
            <div style={{ fontWeight: 900 }}>{value || 'User'}</div>
            <div className="admin-muted" style={{ fontSize: 12 }}>
              {row?.userEmail || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (value) => <span className="tag" style={badgeStyle(value)}>{String(value || 'pending').toUpperCase()}</span>,
      },
      {
        key: 'views',
        label: 'Views',
        render: (value) => Number(value || 0).toLocaleString(),
      },
      {
        key: 'likes',
        label: 'Likes',
        render: (value) => Number(value || 0).toLocaleString(),
      },
      {
        key: 'createdAt',
        label: 'Created At',
        render: (value) => safeDate(value),
      },
      {
        key: 'answeredAt',
        label: 'Answered At',
        render: (value) => safeDate(value),
      },
    ],
    []
  )

  const renderRowActions = (item) => (
    <div className="admin-row-actions">
      <button className="icon-btn" type="button" aria-label="View doubt" onClick={() => openDetail(item)}>
        <FiEye />
      </button>
      <button className="icon-btn" type="button" aria-label="Answer doubt" onClick={() => openDetail(item)}>
        <FiMessageSquare />
      </button>
      <button className="icon-btn" type="button" aria-label="Delete doubt" onClick={() => setConfirm({ open: true, id: item._id })}>
        <FiTrash2 />
      </button>
    </div>
  )

  if (loading) return <Loader text="Loading doubts..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Admin | Doubts</div>
        <h2>Doubt Management</h2>
      </div>

      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Total</div>
          <div className="admin-stat-value">{stats.totalDoubts.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Pending</div>
          <div className="admin-stat-value">{stats.pendingDoubts.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Answered</div>
          <div className="admin-stat-value">{stats.answeredDoubts.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Rejected</div>
          <div className="admin-stat-value">{stats.rejectedDoubts.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Views</div>
          <div className="admin-stat-value">{stats.totalViews.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Likes</div>
          <div className="admin-stat-value">{stats.totalLikes.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ minHeight: 120, padding: 18 }}>
          <div className="admin-panel-title">Latest</div>
          <div className="admin-stat-value" style={{ fontSize: 14 }}>{safeDate(stats.latestDoubtDate)}</div>
        </div>
      </div>

      <div className="admin-filters" style={{ marginTop: 18 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar
            value={query}
            onChange={(value) => {
              setPage(1)
              setQuery(value)
            }}
            placeholder="Search doubts"
          />
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Categories' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1) }}>
            {SUBJECTS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Subjects' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Status' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            {SORTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1) }}>
            {LIMITS.map((item) => (
              <option key={item} value={item}>
                {item} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="fcard light" style={{ marginTop: 16, padding: 18, color: 'var(--danger, #ef4444)' }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <DataTable
          columns={columns}
          rows={doubts}
          rowKey="_id"
          emptyTitle="No doubts found"
          emptyDescription="Try changing search or filters."
          renderRowActions={renderRowActions}
        />

        {doubts.length > 0 ? (
          <div className="admin-page-footer">
            <div className="admin-muted">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, count)} of {count}
            </div>
            <Pagination page={page} pageSize={pageSize} total={count} onPageChange={(p) => setPage(p)} />
          </div>
        ) : null}
      </div>

      <FormModal
        open={!!activeId}
        title="Doubt Details"
        onClose={() => setActiveId(null)}
        submitText={selected?.status === 'answered' ? 'Clear Doubt' : 'Answer Doubt'}
        onSubmit={answerDoubt}
        width={940}
        submitDisabled={saving}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Title</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{selected.title}</div>
            </div>
            <div className="admin-field">
              <label>User</label>
              <div className="admin-readonly">{selected.userName}</div>
            </div>
            <div className="admin-field">
              <label>Email</label>
              <div className="admin-readonly">{selected.userEmail}</div>
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
              <label>Status</label>
              <div className="admin-readonly">
                <span className="tag" style={badgeStyle(selected.status)}>{String(selected.status || 'pending').toUpperCase()}</span>
              </div>
            </div>
            <div className="admin-field">
              <label>Views</label>
              <div className="admin-readonly">{selected.views.toLocaleString()}</div>
            </div>
            <div className="admin-field">
              <label>Likes</label>
              <div className="admin-readonly">{selected.likes.toLocaleString()}</div>
            </div>
            <div className="admin-field">
              <label>Created At</label>
              <div className="admin-readonly">{safeDate(selected.createdAt)}</div>
            </div>
            <div className="admin-field">
              <label>Answered At</label>
              <div className="admin-readonly">{safeDate(selected.answeredAt)}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <div className="admin-readonly" style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Answer</label>
              {selected.answer ? (
                <div className="admin-readonly" style={{ whiteSpace: 'pre-wrap', borderLeft: '4px solid #10b981' }}>
                  {selected.answer}
                </div>
              ) : (
                <div className="admin-muted">No answer yet.</div>
              )}
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Admin Answer</label>
              <textarea
                className="admin-textarea"
                rows={6}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write the answer or updated explanation here..."
              />
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Status Update</label>
              <select
                className="admin-select"
                value={selected.status}
                onChange={(e) => patchStatus(selected, e.target.value)}
              >
                {STATUSES.filter((item) => item !== 'all').map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Tags</label>
              <div className="admin-readonly">{selected.tags.length ? selected.tags.join(', ') : 'N/A'}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Doubt not found" description="This doubt may have been removed." />
        )}
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Doubt?"
        description="This will permanently delete the doubt."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => deleteDoubt(confirm.id)}
      />
    </div>
  )
}
