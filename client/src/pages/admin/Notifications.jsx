import { useMemo, useState } from 'react'
import { FiBell, FiCheckCircle, FiEdit2, FiEye, FiPlus, FiTrash2, FiUser } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'
import DataTable from '../../components/admin/DataTable'

const makeUsers = () => {
  return [
    { id: 'u-1', name: 'Aarav', email: 'aarav@mail.com' },
    { id: 'u-2', name: 'Diya', email: 'diya@mail.com' },
    { id: 'u-3', name: 'Kabir', email: 'kabir@mail.com' },
    { id: 'u-4', name: 'Ananya', email: 'ananya@mail.com' },
    { id: 'u-5', name: 'Vihaan', email: 'vihaan@mail.com' },
  ]
}

const makeNotifications = () => {
  const types = ['info', 'success', 'warning']
  return Array.from({ length: 14 }).map((_, i) => {
    const createdAt = new Date(Date.now() - i * 3600000).toISOString()
    return {
      id: `nt-${i + 1}`,
      title: `Notification ${i + 1}`,
      message: `This is a dummy notification message #${i + 1}.`,
      audience: i % 3 === 0 ? 'All Users' : 'Selected Users',
      createdAt,
      sentToCount: 50 + i * 7,
      read: i % 4 === 0,
      type: types[i % types.length],
    }
  })
}

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function Notifications() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users] = useState(() => makeUsers())
  const [notifications, setNotifications] = useState(() => makeNotifications())

  const [sendOpen, setSendOpen] = useState(false)
  const [mode, setMode] = useState('all')
  const [selectedUserIds, setSelectedUserIds] = useState(['u-1', 'u-3'])

  const [form, setForm] = useState({ title: '', message: '' })

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const [confirm, setConfirm] = useState({ open: false, id: null })

  const recent = useMemo(() => [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4), [notifications])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const categories = useMemo(() => ['all'], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notifications
    return notifications.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q))
  }, [notifications, query])

  const total = filtered.length
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])

  const columns = useMemo(
    () => [
      { key: 'title', label: 'Title', tdClassName: 'admin-td-strong' },
      { key: 'audience', label: 'Send To' },
      { key: 'sentToCount', label: 'Recipients', render: (v) => Number(v).toLocaleString() },
      { key: 'createdAt', label: 'Created', render: (v) => formatDate(v) },
      { key: 'read', label: 'Status', render: (v) => (v ? <span style={{ color: '#0F766E', fontWeight: 900 }}>READ</span> : <span style={{ color: '#0ea5e9', fontWeight: 900 }}>UNREAD</span>) },
    ],
    []
  )

  const renderActions = (n) => (
    <div className="admin-row-actions">
      <button className="icon-btn" type="button" aria-label="Mark as read" onClick={() => {
        setNotifications((cur) => cur.map((x) => x.id === n.id ? { ...x, read: true } : x))
        showToast('Marked as read', 'success')
      }}>
        <FiCheckCircle />
      </button>
      <button className="icon-btn" type="button" aria-label="Delete notification" onClick={() => setConfirm({ open: true, id: n.id })}>
        <FiTrash2 />
      </button>
    </div>
  )

  if (loading) return <Loader text="Loading notifications..." />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Notifications</div>
        <h2>Send & manage notifications</h2>
      </div>

      <div className="admin-grid-charts" style={{ gridTemplateColumns: '1fr 0.95fr' }}>
        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">Recent Notifications</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map((n) => (
                <div key={n.id} className="admin-recent-row" style={{ padding: 12, borderRadius: 16, border: '1px solid var(--admin-border)', display: 'flex', gap: 12 }}>
                  <div className="admin-stats-icon" style={{ width: 42, height: 42 }}>
                    <FiBell />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 950 }}>{n.title}</div>
                    <div className="admin-muted">{formatDate(n.createdAt)}</div>
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    {n.read ? <span style={{ color: '#0F766E', fontWeight: 900 }}>Read</span> : <span style={{ color: '#0ea5e9', fontWeight: 900 }}>Unread</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">Unread</div>
            <div style={{ fontSize: 40, fontWeight: 1000, marginTop: 8 }}>{unreadCount}</div>
            <div className="admin-muted">Notifications awaiting admin review.</div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="button" onClick={() => setSendOpen(true)}>
                <FiPlus /> Send Notification
              </button>
              <button className="btn" type="button" onClick={() => showToast('Dummy action', 'success')}>
                <FiEdit2 /> Draft (dummy)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-filters">
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search notifications" />
        </div>
      </div>

      {total === 0 ? (
        <EmptyState title="No notifications" description="Send your first notification." />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey="id" renderRowActions={renderActions} />
          <div className="admin-page-footer">
            <div className="admin-muted">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => setPage(p)} />
          </div>
        </>
      )}

      {/* Send modal */}
      <FormModal
        open={sendOpen}
        title="Send Notification"
        onClose={() => setSendOpen(false)}
        submitText="Send"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.title.trim() || !form.message.trim()) {
            showToast('Title and message are required', 'error')
            return
          }
          const audience = mode === 'all' ? 'All Users' : 'Selected Users'
          setNotifications((cur) => [
            {
              id: `nt-${Math.random().toString(16).slice(2)}`,
              title: form.title.trim(),
              message: form.message.trim(),
              audience,
              createdAt: new Date().toISOString(),
              sentToCount: mode === 'all' ? users.length : selectedUserIds.length,
              read: false,
              type: 'info',
            },
            ...cur,
          ])
          setSendOpen(false)
          setForm({ title: '', message: '' })
          showToast('Notification sent (dummy)', 'success')
        }}
        width={820}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Message</label>
            <textarea className="admin-textarea" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          </div>

          <div className="admin-field">
            <label>Send to</label>
            <select className="admin-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">All Users</option>
              <option value="selected">Selected Users</option>
            </select>
          </div>

          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Recipients</label>
            {mode === 'all' ? (
              <div className="admin-readonly">All {users.length} users</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {users.map((u) => {
                  const checked = selectedUserIds.includes(u.id)
                  return (
                    <label key={u.id} className="checkbox" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedUserIds((cur) =>
                            cur.includes(u.id) ? cur.filter((id) => id !== u.id) : [...cur, u.id]
                          )
                        }}
                      />
                      <FiUser /> {u.name}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        danger
        title="Delete Notification?"
        description="This notification will be deleted (dummy action)."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={() => {
          setNotifications((cur) => cur.filter((n) => n.id !== confirm.id))
          showToast('Notification deleted', 'success')
          setConfirm({ open: false, id: null })
        }}
      />
    </div>
  )
}

