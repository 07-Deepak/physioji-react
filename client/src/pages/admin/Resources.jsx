import { useMemo, useState } from 'react'
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiLink } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'

const makeResources = () => {
  const categories = ['Anatomy', 'Physiology', 'Exercise', 'Rehab']
  const items = ['PDF Guide', 'Worksheet', 'Reference', 'Case Study', 'Cheat Sheet', 'Workbook']

  return Array.from({ length: 16 }).map((_, i) => {
    const category = categories[i % categories.length]
    const title = `${category}: ${items[i % items.length]}`
    return {
      id: `r-${i + 1}`,
      title,
      description: `Curated resource for ${category}.`,
      category,
      fileUrl: 'https://example.com/resource.pdf',
      externalLink: 'https://example.com',
      thumbnail: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(title)}&backgroundColor=14B8A6&textColor=0F766E`,
    }
  })
}

export default function Resources() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState(() => makeResources())

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState({ open: false, id: null })

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Anatomy',
    externalLink: '',
    thumbnail: null,
    file: null,
  })

  const categories = useMemo(() => ['all', ...Array.from(new Set(resources.map((r) => r.category)))], [resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesQ = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      const matchesC = categoryFilter === 'all' || r.category === categoryFilter
      return matchesQ && matchesC
    })
  }, [resources, query, categoryFilter])

  const total = filtered.length
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])

  const selected = useMemo(() => resources.find((r) => r.id === viewId) || null, [resources, viewId])
  const editing = useMemo(() => resources.find((r) => r.id === editId) || null, [resources, editId])

  const openAdd = () => {
    setAddOpen(true)
    setEditId(null)
    setForm({ title: '', description: '', category: categories[1] || 'Anatomy', externalLink: '', thumbnail: null, file: null })
  }

  const openEdit = (r) => {
    setAddOpen(false)
    setEditId(r.id)
    setForm({ title: r.title, description: r.description, category: r.category, externalLink: r.externalLink, thumbnail: null, file: null })
  }

  const submit = (e) => {
    e.preventDefault()

    const payload = {
      id: editing?.id || `r-${Math.random().toString(16).slice(2)}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      fileUrl: editing?.fileUrl || 'https://example.com/resource.pdf',
      externalLink: form.externalLink.trim() || 'https://example.com',
      thumbnail:
        editing?.thumbnail ||
        `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(form.title || 'resource')}&backgroundColor=14B8A6&textColor=0F766E`,
    }

    if (!payload.title) {
      showToast('Title is required', 'error')
      return
    }

    if (editing) {
      setResources((cur) => cur.map((x) => (x.id === editing.id ? payload : x)))
      showToast('Resource updated', 'success')
    } else {
      setResources((cur) => [payload, ...cur])
      showToast('Resource added', 'success')
    }

    setAddOpen(false)
    setEditId(null)
  }

  const stats = useMemo(() => {
    const total = resources.length
    const byCat = new Map(resources.map((r) => [r.category, 0]))
    resources.forEach((r) => byCat.set(r.category, (byCat.get(r.category) || 0) + 1))
    const topCat = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    return { total, topCat }
  }, [resources])

  if (loading) return <Loader text="Loading resources..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Resources</div>
        <h2>Curated resources library</h2>
      </div>

      <div className="admin-filters">
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder="Search resources by title or description"
          />
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-actions">
          <button className="btn btn-primary" type="button" onClick={openAdd}>
            <FiPlus /> Add Resource
          </button>
        </div>
      </div>

      <div className="admin-grid-cards" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="admin-stats-card">
          <div className="admin-panel-title">Total Resources</div>
          <div style={{ fontSize: 28, fontWeight: 950, marginTop: 8 }}>{stats.total}</div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-panel-title">Top Category</div>
          <div style={{ fontSize: 18, fontWeight: 950, marginTop: 8 }}>{stats.topCat}</div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-panel-title">File Uploads</div>
          <div style={{ fontSize: 18, fontWeight: 950, marginTop: 8 }}>Enabled (dummy)</div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-panel-title">External Links</div>
          <div style={{ fontSize: 18, fontWeight: 950, marginTop: 8 }}>Enabled (dummy)</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No resources found" description="Try changing your filters." />
      ) : (
        <>
          <div className="admin-resources-grid">
            {pageRows.map((r) => (
              <div key={r.id} className="admin-resource-card">
                <img src={r.thumbnail} alt="thumbnail" className="admin-resource-thumb" />
                <div className="admin-resource-meta">
                  <div className="admin-resource-title">{r.title}</div>
                  <div className="admin-muted">{r.category}</div>
                  <div className="admin-resource-desc">{r.description}</div>
                  <div className="admin-resource-actions">
                    <button className="btn" type="button" onClick={() => setViewId(r.id)}>
                      <FiEye /> View
                    </button>
                    <button className="btn" type="button" onClick={() => openEdit(r)}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="btn" type="button" onClick={() => setConfirm({ open: true, id: r.id })}>
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                  <div className="admin-resource-link">
                    <FiLink /> <a href={r.externalLink} target="_blank" rel="noreferrer">Open link</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-page-footer">
            <div className="admin-muted">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => setPage(p)} />
          </div>
        </>
      )}

      {/* View modal */}
      <FormModal
        open={!!viewId}
        title="Resource Details"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault()
          setViewId(null)
        }}
        width={760}
      >
        {selected ? (
          <div className="admin-form-grid">
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Title</label>
              <div className="admin-readonly" style={{ fontWeight: 950 }}>{selected.title}</div>
            </div>
            <div className="admin-field">
              <label>Category</label>
              <div className="admin-readonly">{selected.category}</div>
            </div>
            <div className="admin-field">
              <label>External Link</label>
              <a className="link" href={selected.externalLink} target="_blank" rel="noreferrer">Open</a>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <div className="admin-readonly">{selected.description}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="Resource not found" description="This resource may have been removed." />
        )}
      </FormModal>

      {/* Add/Edit modal */}
      <FormModal
        open={addOpen || !!editId}
        title={editId ? 'Edit Resource' : 'Add Resource'}
        onClose={() => {
          setAddOpen(false)
          setEditId(null)
        }}
        submitText={editId ? 'Update Resource' : 'Create Resource'}
        onSubmit={submit}
        width={760}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Description</label>
            <textarea className="admin-textarea" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Category</label>
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>External Link</label>
            <input value={form.externalLink} onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))} />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>File Upload</label>
            <input type="file" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Thumbnail</label>
            <input type="file" onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.files?.[0] || null }))} />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Resource?"
        description="This action will remove the resource from the grid."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => {
          setResources((cur) => cur.filter((r) => r.id !== confirm.id))
          showToast('Resource deleted', 'success')
          setConfirm({ open: false, id: null })
          setViewId(null)
          setEditId(null)
          setAddOpen(false)
        }}
      />
    </div>
  )
}

