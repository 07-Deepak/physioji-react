import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SearchInput from '../components/SearchInput'
import SelectInput from '../components/SelectInput'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL, getPublicAssetUrl } from '../utils/apiUrl'

const CATEGORIES = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SEMESTERS = ['all', '1', '2', '3', '4', '5', '6', '7', '8']
const SORTS = ['Latest', 'Oldest', 'MostDownloaded']
const LIMITS = ['6', '12', '24', '48']

const FALLBACK_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" rx="32" fill="url(#g)"/>
      <circle cx="660" cy="96" r="68" fill="rgba(255,255,255,0.08)"/>
      <circle cx="130" cy="330" r="100" fill="rgba(255,255,255,0.06)"/>
      <rect x="90" y="110" width="620" height="54" rx="14" fill="rgba(255,255,255,0.15)"/>
      <rect x="90" y="190" width="470" height="32" rx="10" fill="rgba(255,255,255,0.12)"/>
      <rect x="90" y="244" width="540" height="22" rx="10" fill="rgba(255,255,255,0.10)"/>
      <text x="90" y="355" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">
        Study Notes
      </text>
    </svg>`
  )

const safeNumber = (value) => Number(value || 0)

const formatBytes = (bytes) => {
  const n = safeNumber(bytes)
  if (n === 0) return '0 B'
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
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const normalizeNote = (note) => ({
  ...note,
  title: note?.title || 'Untitled Note',
  description: note?.description || 'No description available',
  category: note?.category || 'General',
  subject: note?.subject || 'N/A',
  semester: note?.semester || 'N/A',
  year: note?.year || 'N/A',
  author: note?.author || 'Unknown',
  tags: normalizeTags(note?.tags),
  coverImage: note?.coverImage || '',
  fileName: note?.fileName || 'No file',
  fileSize: safeNumber(note?.fileSize),
  fileType: note?.fileType || 'Unknown',
  downloads: safeNumber(note?.downloads),
  createdAt: note?.createdAt || null,
})

const fileTypeBadge = (mime) => {
  if (!mime || mime === 'Unknown') return 'FILE'
  if (mime === 'application/pdf') return 'PDF'
  if (mime === 'application/msword') return 'DOC'
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX'
  if (mime === 'application/vnd.ms-excel') return 'XLS'
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX'
  if (mime === 'text/csv' || mime === 'application/csv') return 'CSV'
  if (mime === 'application/vnd.ms-powerpoint') return 'PPT'
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX'
  return 'FILE'
}

export default function Notes() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState([])
  const [count, setCount] = useState(0)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [semester, setSemester] = useState('all')
  const [sort, setSort] = useState('Latest')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')

  const pageSize = Number(limit) || 12
  const totalPages = Math.max(Math.ceil(count / pageSize), 1)

  const noteApi = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
      }),
    []
  )

  const fetchNotes = async () => {
    const params = {
      q: query.trim() || undefined,
      category: category === 'all' ? undefined : category,
      subject: subject === 'all' ? undefined : subject,
      semester: semester === 'all' ? undefined : semester,
      sort,
      page,
      limit: pageSize,
    }

    const response = await noteApi.get('/notes', { params })
    const notesData = response.data?.notes || []
    setNotes(Array.isArray(notesData) ? notesData.map(normalizeNote) : [])
    setCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    let alive = true

    const loadNotes = async () => {
      try {
        setLoading(true)
        setError('')
        await fetchNotes()
      } catch (err) {
        if (!alive) return
        const message = err?.response?.data?.message || err?.message || 'Failed to load notes'
        setError(message)
        showToast(message, 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadNotes()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, subject, semester, sort, page, limit])

  const handleDownload = (note) => {
    if (!note?._id) return
    window.location.href = `${API_BASE_URL}/notes/${note._id}/download`
  }

  return (
    <section className="page active" id="page-notes">
      <div className="page-header">
        <div className="eyebrow">Study Library</div>
        <h1>Notes & Study Materials</h1>
        <p className="admin-muted" style={{ marginTop: 8 }}>
          Live notes from the admin panel. Only active notes are shown here.
        </p>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 240, flex: '1 1 240px' }}>
          <SearchInput
            placeholder="Search notes..."
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
          />
        </div>
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <SelectInput
            value={category}
            onChange={(e) => {
              setPage(1)
              setCategory(e.target.value)
            }}
            options={CATEGORIES}
          />
        </div>
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <SelectInput
            value={subject}
            onChange={(e) => {
              setPage(1)
              setSubject(e.target.value)
            }}
            options={SUBJECTS}
          />
        </div>
        <div style={{ minWidth: 140, flex: '1 1 140px' }}>
          <SelectInput
            value={semester}
            onChange={(e) => {
              setPage(1)
              setSemester(e.target.value)
            }}
            options={SEMESTERS}
          />
        </div>
        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
          <SelectInput
            value={sort}
            onChange={(e) => {
              setPage(1)
              setSort(e.target.value)
            }}
            options={SORTS}
          />
        </div>
        <div style={{ minWidth: 120, flex: '0 0 120px' }}>
          <SelectInput
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(e.target.value)
            }}
            options={LIMITS}
          />
        </div>
      </div>

      <div style={{ padding: '0 48px 100px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 14, color: 'var(--muted)' }}>
          Showing {notes.length} of {count} notes
        </div>

        {loading ? (
          <div className="fcard light" style={{ padding: 24 }}>Loading notes...</div>
        ) : error ? (
          <div className="fcard light" style={{ padding: 24 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Could not load notes</strong>
            <div style={{ color: 'var(--muted)' }}>{error}</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="fcard light" style={{ padding: 24 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>No notes found</strong>
            <div style={{ color: 'var(--muted)' }}>Try widening your search or adjusting the filters.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18 }}>
            {notes.map((note) => {
              const coverSrc = getPublicAssetUrl(note.coverImage, FALLBACK_COVER)
              const downloadUrl = `${API_BASE_URL}/notes/${note._id}/download`

              return (
                <article key={note._id} className="fcard light" style={{ minHeight: 'auto', padding: 18 }}>
                  <div style={{ position: 'relative', marginBottom: 14 }}>
                    <img
                      src={coverSrc}
                      alt={note.title}
                      style={{
                        width: '100%',
                        height: 190,
                        objectFit: 'cover',
                        borderRadius: 20,
                        border: '1px solid rgba(20,184,166,0.18)',
                        background: '#0f172a',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_COVER
                      }}
                    />
                    <span
                      className="tag"
                      style={{ position: 'absolute', left: 12, top: 12, backdropFilter: 'blur(10px)' }}
                    >
                      {fileTypeBadge(note.fileType)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{note.title}</h3>
                      <div style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
                        By {note.author} · {formatDate(note.createdAt)}
                      </div>
                    </div>
                    <div className="tag" style={{ whiteSpace: 'nowrap' }}>
                      {safeNumber(note.downloads).toLocaleString()} downloads
                    </div>
                  </div>

                  <p style={{ color: 'var(--ink)', marginTop: 12, marginBottom: 14 }}>{note.description}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <span className="tag">{note.category}</span>
                    <span className="tag">{note.subject}</span>
                    <span className="tag">Semester {note.semester}</span>
                    <span className="tag">Year {note.year}</span>
                  </div>

                  {note.tags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {note.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 10,
                      fontSize: '0.92rem',
                      marginBottom: 14,
                      color: 'var(--muted)',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>File</strong>
                      <div>{note.fileName}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Size</strong>
                      <div>{formatBytes(note.fileSize)}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Type</strong>
                      <div>{note.fileType}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--ink)' }}>Downloads</strong>
                      <div>{safeNumber(note.downloads).toLocaleString()}</div>
                    </div>
                  </div>

                  <button className="btn btn-dark btn-small" type="button" onClick={() => handleDownload(note)}>
                    Download File
                  </button>

                  <a
                    href={downloadUrl}
                    style={{ display: 'block', marginTop: 10, fontSize: '0.88rem', color: 'var(--muted)' }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Direct download link
                  </a>
                </article>
              )
            })}
          </div>
        )}

        {!loading && notes.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-dark btn-small"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-dark btn-small"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
