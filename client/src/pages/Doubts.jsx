import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiHeart, FiEye, FiSend, FiMessageSquare } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import SearchInput from '../components/SearchInput'
import SelectInput from '../components/SelectInput'
import { API_BASE_URL } from '../utils/apiUrl'

const CATEGORIES = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const STATUSES = ['all', 'pending', 'answered']
const SORTS = ['Latest', 'Oldest', 'MostViewed', 'MostLiked']
const LIMITS = ['6', '12', '24']

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

const normalizeDoubt = (item) => ({
  ...item,
  title: item?.title || 'Untitled Doubt',
  description: item?.description || 'No description available',
  category: item?.category || 'General',
  subject: item?.subject || 'N/A',
  askedBy: item?.askedBy || 'User',
  userName: item?.userName || item?.askedBy || 'User',
  status: item?.status || 'pending',
  answer: item?.answer || '',
  views: safeNumber(item?.views),
  likes: safeNumber(item?.likes),
  tags: normalizeTags(item?.tags),
  createdAt: item?.createdAt || null,
  answeredAt: item?.answeredAt || null,
})

const statusClass = (status) => {
  if (status === 'answered') return 'tag'
  if (status === 'rejected') return 'tag'
  return 'tag'
}

const statusBadgeStyle = (status) => {
  if (status === 'answered') return { background: 'rgba(16,185,129,0.14)', color: '#047857' }
  if (status === 'rejected') return { background: 'rgba(239,68,68,0.14)', color: '#b91c1c' }
  return { background: 'rgba(245,158,11,0.16)', color: '#b45309' }
}

export default function Doubts() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  const token = localStorage.getItem('physiojiToken') || ''
  const isLoggedIn = Boolean(token && user)

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      }),
    [token]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doubts, setDoubts] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('Latest')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Physiotherapy',
    subject: 'Physiotherapy',
    tags: '',
  })

  const viewedIdsRef = useRef(new Set())
  const pageSize = Number(limit) || 12
  const totalPages = Math.max(Math.ceil(count / pageSize), 1)

  const fetchDoubts = async () => {
    const response = await axios.get(`${API_BASE_URL}/doubts`, {
      params: {
        q: query.trim() || undefined,
        category: category === 'all' ? undefined : category,
        subject: subject === 'all' ? undefined : subject,
        status,
        sort,
        page,
        limit: pageSize,
      },
      withCredentials: true,
    })

    const rows = response.data?.doubts || []
    setDoubts(Array.isArray(rows) ? rows.map(normalizeDoubt) : [])
    setCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        setLoading(true)
        await fetchDoubts()
      } catch (err) {
        if (!alive) return
        showToast(err?.response?.data?.message || err?.message || 'Failed to load doubts', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, query, category, subject, status, sort, token, user])

  useEffect(() => {
    setPage(1)
  }, [query, category, subject, status, sort, limit])

  useEffect(() => {
    if (!selected) return
    if (!isLoggedIn) return
    if (viewedIdsRef.current.has(selected._id)) return

    viewedIdsRef.current.add(selected._id)

    const bumpView = async () => {
      try {
        const res = await api.patch(`/doubts/${selected._id}/view`)
        const nextViews = safeNumber(res.data?.views)
        setDoubts((current) =>
          current.map((item) => (item._id === selected._id ? { ...item, views: nextViews || safeNumber(item.views) + 1 } : item))
        )
        setSelected((current) =>
          current && current._id === selected._id
            ? { ...current, views: nextViews || safeNumber(current.views) + 1 }
            : current
        )
      } catch {
        // non-blocking
      }
    }

    bumpView()
  }, [selected, api, isLoggedIn])

  const refresh = async () => {
    await fetchDoubts()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      showToast('Please login to ask your doubt.', 'error')
      return
    }

    if (!form.title.trim() || !form.description.trim() || !form.category || !form.subject) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      setSaving(true)
      await api.post('/doubts', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        subject: form.subject,
        tags: form.tags,
      })

      setForm({
        title: '',
        description: '',
        category: 'Physiotherapy',
        subject: 'Physiotherapy',
        tags: '',
      })
      showToast('Your doubt has been submitted successfully.', 'success')
      await refresh()
      setPage(1)
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to submit doubt', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (item) => {
    if (!isLoggedIn) {
      showToast('Please login to like doubts.', 'error')
      navigate('/login')
      return
    }

    try {
      const res = await api.patch(`/doubts/${item._id}/like`)
      const nextLikes = safeNumber(res.data?.likes)
      setDoubts((current) =>
        current.map((row) => (row._id === item._id ? { ...row, likes: nextLikes || safeNumber(row.likes) + 1 } : row))
      )
      setSelected((current) =>
        current && current._id === item._id
          ? { ...current, likes: nextLikes || safeNumber(current.likes) + 1 }
          : current
      )
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Like failed', 'error')
    }
  }

  const openDetail = (item) => {
    setSelected(item)
  }

  const closeDetail = () => setSelected(null)

  return (
    <section className="page active" id="page-doubts">
      <div className="page-header" style={{ paddingBottom: 8 }}>
        <div className="eyebrow">Community Support</div>
        <h1>Ask Your Doubt</h1>
        <p style={{ color: 'var(--muted)', marginTop: 10, maxWidth: 820 }}>
          Ask your physiotherapy-related question and get guidance from experts.
        </p>
      </div>

      <div style={{ padding: '0 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 18, alignItems: 'start' }}>
          <div className="fcard light" style={{ padding: 24 }}>
            <div className="eyebrow">Ask Doubt</div>
            <h2 style={{ marginBottom: 10 }}>Submit your question</h2>

            {authLoading ? (
              <div className="fcard light" style={{ padding: 18 }}>Checking your session...</div>
            ) : isLoggedIn ? (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Title</label>
                  <input
                    className="admin-input"
                    value={form.title}
                    onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                    placeholder="Enter your doubt title"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Description</label>
                  <textarea
                    className="admin-textarea"
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
                    placeholder="Describe your physiotherapy doubt in detail"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Category</label>
                    <select
                      className="admin-select"
                      value={form.category}
                      onChange={(e) => setForm((cur) => ({ ...cur, category: e.target.value }))}
                    >
                      {CATEGORIES.filter((item) => item !== 'all').map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Subject</label>
                    <select
                      className="admin-select"
                      value={form.subject}
                      onChange={(e) => setForm((cur) => ({ ...cur, subject: e.target.value }))}
                    >
                      {SUBJECTS.filter((item) => item !== 'all').map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Tags</label>
                  <input
                    className="admin-input"
                    value={form.tags}
                    onChange={(e) => setForm((cur) => ({ ...cur, tags: e.target.value }))}
                    placeholder="comma separated tags"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--muted)' }}>
                    Submitted as <strong>{user?.fullName || user?.name || 'User'}</strong>
                  </div>
                  <button className="btn btn-dark" type="submit" disabled={saving}>
                    <FiSend /> {saving ? 'Submitting...' : 'Submit Doubt'}
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  padding: 22,
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, rgba(8,47,73,0.9), rgba(20,184,166,0.14))',
                  color: '#fff',
                }}
              >
                <h3 style={{ marginBottom: 8, color: '#fff' }}>Please login to ask your doubt.</h3>
                <p style={{ marginBottom: 14, color: 'rgba(255,255,255,0.8)' }}>
                  Your physiotherapy question can be sent to experts only after you sign in.
                </p>
                <button className="btn btn-dark" type="button" onClick={() => navigate('/login')}>
                  Login
                </button>
              </div>
            )}
          </div>

          <div className="fcard light" style={{ padding: 24 }}>
            <div className="eyebrow">Quick Tips</div>
            <h3 style={{ marginBottom: 12 }}>Ask better, get better answers</h3>
            <div style={{ display: 'grid', gap: 12, color: 'var(--ink)' }}>
              <div className="tag" style={{ width: 'fit-content' }}>Be specific about symptoms</div>
              <div className="tag" style={{ width: 'fit-content' }}>Mention duration and triggers</div>
              <div className="tag" style={{ width: 'fit-content' }}>Add tags for faster discovery</div>
              <div className="tag" style={{ width: 'fit-content' }}>Expert answers may take some time</div>
            </div>
          </div>
        </div>

        <div className="toolbar" style={{ flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          <div style={{ minWidth: 240, flex: '1 1 240px' }}>
            <SearchInput
              placeholder="Search doubts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div style={{ minWidth: 180, flex: '1 1 180px' }}>
            <SelectInput
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
            />
          </div>
          <div style={{ minWidth: 180, flex: '1 1 180px' }}>
            <SelectInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={SUBJECTS}
            />
          </div>
          <div style={{ minWidth: 180, flex: '1 1 180px' }}>
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUSES}
            />
          </div>
          <div style={{ minWidth: 180, flex: '1 1 180px' }}>
            <SelectInput
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORTS}
            />
          </div>
          <div style={{ minWidth: 120, flex: '0 0 120px' }}>
            <SelectInput
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              options={LIMITS}
            />
          </div>
        </div>

        <div style={{ color: 'var(--muted)', margin: '8px 0 14px' }}>
          Showing {doubts.length} of {count} doubts
        </div>

        {loading ? (
          <div className="fcard light" style={{ padding: 24 }}>Loading doubts...</div>
        ) : doubts.length === 0 ? (
          <div className="fcard light" style={{ padding: 24 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>No doubts found</strong>
            <div style={{ color: 'var(--muted)' }}>Try changing the filters or search terms.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, paddingBottom: 96 }}>
            {doubts.map((item) => (
              <article
                key={item._id}
                className="fcard light"
                style={{ minHeight: 'auto', padding: 20, cursor: 'pointer' }}
                onClick={() => openDetail(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
                    <div style={{ color: 'var(--muted)', marginBottom: 10 }}>
                      Asked by {item.userName} | {safeDate(item.createdAt)}
                    </div>
                  </div>
                  <span className="tag" style={statusBadgeStyle(item.status)}>{String(item.status || 'pending').toUpperCase()}</span>
                </div>

                <p style={{ color: 'var(--ink)', marginBottom: 12 }}>{item.description}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <span className="tag">{item.category}</span>
                  <span className="tag">{item.subject}</span>
                  {item.tags?.length ? item.tags.slice(0, 3).map((tag) => <span key={tag} className="tag">{tag}</span>) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Views</strong>
                    <div>{item.views.toLocaleString()}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Likes</strong>
                    <div>{item.likes.toLocaleString()}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Answer</strong>
                    <div>{item.status === 'answered' ? 'Available' : 'Pending'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <button
                    className="btn btn-dark btn-small"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDetail(item)
                    }}
                  >
                    <FiMessageSquare /> View
                  </button>
                  <button
                    className="btn btn-outline btn-small"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(item)
                    }}
                  >
                    <FiHeart /> Like
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && doubts.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20, paddingBottom: 40, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-dark btn-small"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-dark btn-small"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div
          onClick={closeDetail}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(2,6,23,0.74)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 980px)',
              borderRadius: 26,
              background: '#07111f',
              border: '1px solid rgba(20,184,166,0.2)',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div className="eyebrow">Doubt Details</div>
                <h3 style={{ color: '#fff', marginBottom: 8 }}>{selected.title}</h3>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {selected.category} | {selected.subject} | {selected.userName}
                </div>
              </div>
              <button className="btn btn-outline btn-small" type="button" onClick={closeDetail}>
                Close
              </button>
            </div>

            <div style={{ padding: '0 18px 18px' }}>
              <div className="fcard light" style={{ marginBottom: 14, padding: 18 }}>
                <p style={{ marginTop: 0, marginBottom: 12, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                  {selected.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="tag" style={statusBadgeStyle(selected.status)}>{String(selected.status || 'pending').toUpperCase()}</span>
                  <span className="tag">{selected.views.toLocaleString()} views</span>
                  <span className="tag">{selected.likes.toLocaleString()} likes</span>
                  <span className="tag">{safeDate(selected.createdAt)}</span>
                </div>
              </div>

              <div className="fcard light" style={{ padding: 18, marginBottom: 14 }}>
                <strong style={{ display: 'block', marginBottom: 10 }}>Answer</strong>
                {selected.status === 'answered' && selected.answer ? (
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{selected.answer}</div>
                ) : (
                  <div style={{ color: 'var(--muted)' }}>No answer yet.</div>
                )}
              </div>

              <div className="fcard light" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <strong>Like this doubt</strong>
                  <button
                    className="btn btn-outline btn-small"
                    type="button"
                    onClick={() => handleLike(selected)}
                  >
                    <FiHeart /> Like
                  </button>
                </div>
                {isLoggedIn ? (
                  <div style={{ color: 'var(--muted)' }}>You can like doubts while signed in.</div>
                ) : (
                  <div style={{ color: 'var(--muted)' }}>
                    Please login to like or track views on doubts.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
