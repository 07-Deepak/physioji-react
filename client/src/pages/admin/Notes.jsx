import { useEffect, useMemo, useRef, useState } from 'react'
import { FiEdit2, FiEye, FiFilePlus, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import DataTable from '../../components/admin/DataTable'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import { useAdmin } from '../../contexts/AdminContext'

const CATEGORIES = [
  'Physiotherapy',
  'Anatomy',
  'MBBS',
  'Nursing',
  'Dental',
  'Pharmacy',
  'Other',
]

const SUBJECTS_FALLBACK = ['Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']

const STAT_CARD_STYLE = { minHeight: 120 }

const formatDate = (iso) => {
  if (!iso) return 'N/A'
  try {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

const safeNumber = (value) => Number(value || 0)

const safeLocaleString = (value) => safeNumber(value).toLocaleString()

const normalizeNote = (note) => ({
  ...note,
  title: note?.title || 'Untitled Note',
  description: note?.description || 'No description available',
  category: note?.category || 'General',
  subject: note?.subject || 'N/A',
  semester: note?.semester || 'N/A',
  author: note?.author || 'Unknown',
  downloads: safeNumber(note?.downloads),
  fileSize: safeNumber(note?.fileSize),
  fileName: note?.fileName || 'No file',
  fileType: note?.fileType || 'Unknown',
  status: note?.status ?? true,
  createdAt: note?.createdAt || null,
  updatedAt: note?.updatedAt || null,
  views: safeNumber(note?.views),
  price: note?.price ?? 0,
  totalDownloads: safeNumber(note?.totalDownloads),
})

const normalizeStats = (incoming = {}) => {
  const totalNotes = safeNumber(incoming.totalNotes)
  const pdfCount = safeNumber(incoming.pdfCount)
  const wordCount = safeNumber(incoming.wordCount ?? incoming.docCount)
  const docCount = safeNumber(incoming.docCount ?? incoming.wordCount)
  const excelCount = safeNumber(incoming.excelCount)
  const csvCount = safeNumber(incoming.csvCount)
  const pptCount = safeNumber(incoming.pptCount)
  const totalDownloads = safeNumber(incoming.totalDownloads)
  const lastUploaded = incoming.lastUploaded || incoming.lastUploadedNote?.createdAt || incoming.lastUploadedNote || null

  return {
    totalNotes,
    pdfCount,
    wordCount,
    docCount,
    excelCount,
    csvCount,
    pptCount,
    totalDownloads,
    lastUploaded,
    lastUploadedNote: incoming.lastUploadedNote || null,
  }
}

const formatBytes = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let idx = -1
  let num = n
  do {
    num /= 1024
    idx++
  } while (num >= 1024 && idx < units.length - 1)
  return `${num.toFixed(1)} ${units[idx]}`
}

const fileTypeLabel = (mime) => {
  if (!mime) return '—'
  if (mime === 'application/pdf') return 'PDF'
  if (mime === 'application/msword') return 'DOC'
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX'
  if (mime === 'application/vnd.ms-powerpoint') return 'PPT'
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX'
  return mime
}

export default function Notes() {
  const { showToast } = useToast()
  const { adminToken, checkAdmin } = useAdmin()

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const adminApi = useMemo(
    () =>
      axios.create({
        baseURL: apiBase,
        headers: {
          Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
        },
        withCredentials: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiBase, adminToken]
  )

  const categories = useMemo(() => CATEGORIES, [])

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalNotes: 0,
    pdfCount: 0,
    docCount: 0,
    wordCount: 0,
    excelCount: 0,
    csvCount: 0,
    pptCount: 0,
    lastUploaded: null,
    lastUploadedNote: null,
    totalDownloads: 0,
  })

  const [notes, setNotes] = useState([])
  const [count, setCount] = useState(0)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [semester, setSemester] = useState('all')
  const [sort, setSort] = useState('Latest')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  const [viewId, setViewId] = useState(null)

  const [confirm, setConfirm] = useState({ open: false, type: null, id: null })
  const [progress, setProgress] = useState({ uploading: false, pct: 0 })

  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0] || 'Physiotherapy',
    subject: SUBJECTS_FALLBACK[0],
    semester: '1',
    year: '',
    tags: '',
    author: '',
    status: true,
    file: null,
    coverImage: null,
  })

  const [uploadError, setUploadError] = useState(null)

  const semesters = useMemo(() => ['1', '2', '3', '4', '5', '6', '7', '8'], [])

  const subjectOptions = useMemo(() => {
    // backend doesn't provide subject list, so show only a reasonable fallback.
    // user can still type via input.
    return ['all', ...Array.from(new Set([...SUBJECTS_FALLBACK]))]
  }, [])

  const refreshStats = async () => {
    const res = await adminApi.get('/admin-notes/notes/stats')
    setStats(normalizeStats(res.data?.stats || res.data || {}))
  }

  const fetchNotes = async () => {
    const params = {
      page,
      limit: pageSize,
      q: query || undefined,
      category: category === 'all' ? undefined : category,
      subject: subject === 'all' ? undefined : subject,
      semester: semester === 'all' ? undefined : semester,
      sort,
    }

    const res = await adminApi.get('/admin-notes/notes', { params })
    const notesData = res.data?.notes || []
    setNotes(Array.isArray(notesData) ? notesData.map(normalizeNote) : [])
    setCount(res.data?.count || 0)
  }

  useEffect(() => {
    let alive = true
    const bootstrap = async () => {
      try {
        setLoading(true)
        // if token missing/expired, try checkAdmin quickly
        if (!adminToken) await checkAdmin?.()
        const [s] = await Promise.all([refreshStats()])
        if (!alive) return
        await fetchNotes()
      } catch (err) {
        if (!alive) return
        showToast(err?.response?.data?.message || err?.message || 'Failed to load notes', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, query, category, subject, semester, adminToken])

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: categories[0] || 'Physiotherapy',
      subject: SUBJECTS_FALLBACK[0],
      semester: '1',
      year: '',
      tags: '',
      author: '',
      status: true,
      file: null,
      coverImage: null,
    })
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openUpload = () => {
    setUploadOpen(true)
    setEditId(null)
    setViewId(null)
    resetForm()
  }

  const openEdit = (n) => {
    setUploadOpen(true)
    setEditId(n._id)
    setViewId(null)
    setUploadError(null)
    setProgress({ uploading: false, pct: 0 })

    setForm({
      title: n?.title || '',
      description: n?.description || '',
      category: n?.category || categories[0],
      subject: n?.subject || SUBJECTS_FALLBACK[0],
      semester: n?.semester || '1',
      year: String(n?.year || ''),
      tags: Array.isArray(n?.tags) ? n.tags.join(',') : (n?.tags || ''),
      author: n?.author || '',
      status: !!n?.status,
      file: null,
      coverImage: null,
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submitUpload = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return showToast('Note Title is required', 'error')
    if (!form.description.trim()) return showToast('Description is required', 'error')
    if (!form.category) return showToast('Category is required', 'error')
    if (!form.subject) return showToast('Subject is required', 'error')
    if (!form.semester) return showToast('Semester is required', 'error')
    if (!form.year.trim()) return showToast('Year is required', 'error')
    if (!form.author.trim()) return showToast('Author is required', 'error')
    if (!editId && !form.file) return showToast('PDF/File is required', 'error')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('category', form.category)
    fd.append('subject', form.subject)
    fd.append('semester', String(form.semester))
    fd.append('year', form.year.trim())
    fd.append('author', form.author.trim())
    fd.append('tags', form.tags || '')
    fd.append('status', String(form.status))

    if (form.file) fd.append('file', form.file)
    if (form.coverImage) fd.append('coverImage', form.coverImage)

    try {
      setUploadError(null)
      setProgress({ uploading: true, pct: 0 })

      if (editId) {
        await adminApi.put(`/admin-notes/notes/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0
            setProgress({ uploading: true, pct })
          },
        })
        showToast('Note updated successfully', 'success')
      } else {
        await adminApi.post('/admin-notes/notes', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0
            setProgress({ uploading: true, pct })
          },
        })
        showToast('Note uploaded successfully', 'success')
      }

      setUploadOpen(false)
      setEditId(null)
      resetForm()

      await refreshStats()
      await fetchNotes()
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message
      setUploadError(message || 'Upload failed')
      showToast(message || 'Upload failed', 'error')
    } finally {
      setProgress({ uploading: false, pct: 0 })
    }
  }

  const deleteNote = async (id) => {
    try {
      await adminApi.delete(`/admin-notes/notes/${id}`)
      showToast('Note deleted', 'success')
      setConfirm({ open: false, type: null, id: null })
      if (viewId === id) setViewId(null)
      await refreshStats()
      await fetchNotes()
    } catch (err) {
      const message = err?.response?.data?.message || err?.message
      showToast(message || 'Delete failed', 'error')
    }
  }

  const toggleStatus = async (n) => {
    try {
      await adminApi.patch(`/admin-notes/notes/${n._id}/status`, { status: !n.status })
      showToast(`Status updated: ${!n.status ? 'Active' : 'Inactive'}`, 'success')
      await fetchNotes()
      await refreshStats()
    } catch (err) {
      const message = err?.response?.data?.message || err?.message
      showToast(message || 'Status update failed', 'error')
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'coverImage',
        label: 'Cover Image',
        render: (_, row) => (
          <img
            alt="cover"
            src={row?.coverImage || ''}
            style={{ width: 48, height: 48, borderRadius: 14, border: '1px solid rgba(20,184,166,0.25)', objectFit: 'cover' }}
          />
        ),
      },
      { key: 'title', label: 'Title', tdClassName: 'admin-td-strong' },
      { key: 'category', label: 'Category' },
      { key: 'subject', label: 'Subject' },
      { key: 'semester', label: 'Semester' },
      { key: 'author', label: 'Author' },
      {
        key: 'fileType',
        label: 'File Type',
        render: (v) => fileTypeLabel(v),
      },
      {
        key: 'fileSize',
        label: 'Size',
        render: (v) => formatBytes(v),
      },
      {
        key: 'createdAt',
        label: 'Upload Date',
        render: (v) => formatDate(v),
      },
      {
        key: 'downloads',
        label: 'Downloads',
        render: (v) => safeLocaleString(v),
      },
      {
        key: 'status',
        label: 'Status',
        render: (v) => (
          <span
            className="admin-status-pill"
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(20,184,166,0.3)',
              background: v ? 'rgba(20,184,166,0.10)' : 'rgba(255,107,107,0.10)',
              color: v ? 'rgba(16,185,129,1)' : 'rgba(239,68,68,1)',
              fontWeight: 800,
            }}
          >
            {v ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    []
  )

  const renderRowActions = (n) => (
    <div className="admin-row-actions">
      <button className="icon-btn" type="button" aria-label="View" onClick={() => setViewId(n._id)}>
        <FiEye />
      </button>
      <a
        className="icon-btn"
        href={`${apiBase}/admin-notes/notes/${n._id}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        target="_blank"
        rel="noreferrer"
        aria-label="View in new tab"
      >
        <FiEye />
      </a>
      <button
        className="icon-btn"
        type="button"
        aria-label="Download"
        onClick={async () => {
          try {
            // public download endpoint increments counter
            const url = `${apiBase}/notes/${n._id}/download`
            window.location.href = url
          } catch {}
        }}
      >
        ⬇️
      </button>
      <button className="icon-btn" type="button" aria-label="Edit" onClick={() => openEdit(n)}>
        <FiEdit2 />
      </button>
      <button
        className="icon-btn"
        type="button"
        aria-label="Delete"
        onClick={() => setConfirm({ open: true, type: 'delete', id: n._id })}
      >
        <FiTrash2 />
      </button>
      <button
        className="btn btn-small"
        type="button"
        onClick={() => toggleStatus(n)}
        style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 999 }}
      >
        {n.status ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )

  const selected = useMemo(() => notes.find((n) => n._id === viewId) || null, [notes, viewId])

  if (loading) return <Loader text="Loading notes..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Admin • Notes</div>
        <h2>Notes Management</h2>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="glass-card" style={STAT_CARD_STYLE}>
          <div className="admin-panel-title">Total Notes</div>
          <div className="admin-stat-value">{safeLocaleString(stats?.totalNotes)}</div>
        </div>
        <div className="glass-card" style={STAT_CARD_STYLE}>
          <div className="admin-panel-title">PDF Notes</div>
          <div className="admin-stat-value">{safeLocaleString(stats?.pdfCount)}</div>
        </div>
        <div className="glass-card" style={STAT_CARD_STYLE}>
          <div className="admin-panel-title">DOC Notes</div>
          <div className="admin-stat-value">{safeLocaleString(stats?.docCount ?? stats?.wordCount)}</div>
        </div>
        <div className="glass-card" style={STAT_CARD_STYLE}>
          <div className="admin-panel-title">Last Uploaded</div>
          <div className="admin-stat-value" style={{ fontSize: 14 }}>{formatDate(stats?.lastUploaded)}</div>
        </div>
        <div className="glass-card" style={STAT_CARD_STYLE}>
          <div className="admin-panel-title">Total Downloads</div>
          <div className="admin-stat-value">{safeLocaleString(stats?.totalDownloads)}</div>
        </div>
      </div>

      {/* Filters + Upload */}
      <div className="admin-filters" style={{ marginTop: 18 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder="Search by title"
          />
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <input
            className="admin-input"
            value={subject === 'all' ? '' : subject}
            placeholder="Subject (optional)"
            onChange={(e) => {
              const v = e.target.value.trim()
              setSubject(v ? v : 'all')
              setPage(1)
            }}
          />
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-selects">
          <select
            className="admin-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setPage(1)
            }}
          >
            <option value="Latest">Latest</option>
            <option value="Oldest">Oldest</option>
            <option value="MostDownloaded">Most Downloaded</option>
          </select>
        </div>

        <div className="admin-filter-actions">
          <button className="btn btn-primary" type="button" onClick={openUpload}>
            <FiFilePlus /> Upload New Note
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ marginTop: 14 }}>
        {notes.length === 0 ? (
          <EmptyState title="No notes found" description="Upload a new note or adjust your filters." />
        ) : (
          <>
            <DataTable columns={columns} rows={notes} rowKey="_id" renderRowActions={renderRowActions} />
            <div className="admin-page-footer">
              <div className="admin-muted">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, count)} of {count}
              </div>
              <Pagination page={page} pageSize={pageSize} total={count} onPageChange={(p) => setPage(p)} />
            </div>
          </>
        )}
      </div>

      {/* View */}
      <FormModal
        open={!!viewId}
        title="Note Details"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault()
          setViewId(null)
        }}
        width={820}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Cover Image</label>
              <div>
                {selected.coverImage ? (
                  <img
                    src={selected.coverImage}
                    alt="cover"
                    style={{ width: 140, height: 90, borderRadius: 16, objectFit: 'cover', border: '1px solid rgba(20,184,166,0.25)' }}
                  />
                ) : (
                  <div className="admin-muted">No cover image</div>
                )}
              </div>
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
              <label>Semester</label>
              <div className="admin-readonly">{selected.semester}</div>
            </div>
            <div className="admin-field">
              <label>Year</label>
              <div className="admin-readonly">{selected.year}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <div className="admin-readonly">{selected.description}</div>
            </div>
            <div className="admin-field">
              <label>Author</label>
              <div className="admin-readonly">{selected.author}</div>
            </div>
            <div className="admin-field">
              <label>Tags</label>
              <div className="admin-readonly">{Array.isArray(selected.tags) ? selected.tags.join(', ') : selected.tags}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>File</label>
              <div>
                <div className="admin-muted" style={{ marginBottom: 8 }}>
                  {fileTypeLabel(selected?.fileType)} • {formatBytes(selected?.fileSize)}
                </div>
                <a className="link" href={selected?.fileUrl || '#'} target="_blank" rel="noreferrer">
                  Open / Preview
                </a>
              </div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Downloads</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{safeLocaleString(selected?.downloads)}</div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Status</label>
              <div className="admin-readonly">{selected.status ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Note not found" description="This note may have been removed." />
        )}
      </FormModal>

      {/* Upload/Edit */}
      <FormModal
        open={uploadOpen}
        title={editId ? 'Edit Note' : 'Upload Note'}
        onClose={() => {
          setUploadOpen(false)
          setEditId(null)
        }}
        submitText={editId ? 'Update Note' : 'Upload'}
        onSubmit={submitUpload}
        width={920}
        submitDisabled={progress.uploading}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Note Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Description</label>
            <textarea
              className="admin-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="admin-field">
            <label>Category</label>
            <select className="admin-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Subject</label>
            <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>

          <div className="admin-field">
            <label>Semester</label>
            <select className="admin-select" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Year</label>
            <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. knee, anatomy, rehab" />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Author</label>
            <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Upload PDF/File {editId ? '(optional for edit)' : ''}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
            />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Cover Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.files?.[0] || null }))}
            />
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Status</label>
            <select className="admin-select" value={form.status ? 'active' : 'inactive'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value === 'active' }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {progress.uploading ? (
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Uploading...</label>
              <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${progress.pct}%`, height: '100%', background: 'rgba(20,184,166,0.9)' }} />
              </div>
              <div className="admin-muted" style={{ marginTop: 8 }}>{progress.pct}%</div>
            </div>
          ) : null}

          {uploadError ? (
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <div style={{ padding: 10, borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,1)', fontWeight: 800 }}>
                {uploadError}
              </div>
            </div>
          ) : null}
        </div>

        {/* Reset button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={() => resetForm()}
            disabled={progress.uploading}
          >
            Reset
          </button>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Note?"
        description="This note will be removed permanently."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, type: null, id: null })}
        onConfirm={() => {
          if (confirm.id) deleteNote(confirm.id)
        }}
      />
    </div>
  )
}

