import { useMemo, useState } from 'react'
import { FiEdit2, FiEye, FiMinusCircle, FiPlus, FiRefreshCw, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import DataTable from '../../components/admin/DataTable'
import SearchBar from '../../components/admin/SearchBar'
import ConfirmModal from '../../components/admin/ConfirmModal'
import FormModal from '../../components/admin/FormModal'
import Pagination from '../../components/admin/Pagination'

const initialUsers = () => {
  const roles = ['student', 'admin', 'instructor']
  const statuses = ['active', 'blocked']
  const names = ['Aarav Verma', 'Diya Sharma', 'Kabir Singh', 'Ananya Gupta', 'Vihaan Rao', 'Sara Khan', 'Rohan Mehta', 'Ishita Nair', 'Arjun Patel', 'Meera Joshi']
  const emails = names.map((n) => n.toLowerCase().replace(/\s+/g, '.') + '@mail.com')

  return names.map((name, i) => {
    const role = roles[i % roles.length]
    const status = statuses[(i + 2) % statuses.length]
    return {
      id: `u-${i + 1}`,
      name,
      email: emails[i],
      phone: `+91-9${i}98${i}${i}12${i}`.replace(/\D/g, '').slice(0, 13),
      role: role === 'admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1),
      status,
      joinedAt: new Date(Date.now() - (i + 3) * 86400000).toISOString(),
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&radius=10&backgroundColor=14B8A6&textColor=0F766E`,
    }
  })
}

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

export default function Users() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState(() => initialUsers())

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [viewId, setViewId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, type: null, id: null })
  const [addOpen, setAddOpen] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Student',
    status: 'active',
  })

  const roles = useMemo(() => ['all', 'Student', 'Instructor', 'Admin'], [])
  const statuses = useMemo(() => ['all', 'active', 'blocked'], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.phone).includes(q)

      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter

      return matchesQuery && matchesRole && matchesStatus
    })
  }, [users, query, roleFilter, statusFilter])

  const total = filtered.length
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  const selectedUser = useMemo(() => users.find((u) => u.id === viewId) || null, [users, viewId])
  const editingUser = useMemo(() => users.find((u) => u.id === editId) || null, [users, editId])

  const openEdit = (u) => {
    setEditId(u.id)
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
    })
  }

  const openAdd = () => {
    setAddOpen(true)
    setEditId(null)
    setForm({ name: '', email: '', phone: '', role: 'Student', status: 'active' })
  }

  const columns = useMemo(
    () => [
      {
        key: 'avatar',
        label: 'Profile Image',
        render: (_, row) => (
          <img
            src={row.avatar}
            alt={`${row.name} avatar`}
            style={{ width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(20,184,166,0.25)' }}
          />
        ),
      },
      { key: 'name', label: 'Name', tdClassName: 'admin-td-strong' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status', render: (v) => <span style={{ fontWeight: 800, color: v === 'blocked' ? '#ef4444' : '#0F766E' }}>{String(v).toUpperCase()}</span> },
      { key: 'joinedAt', label: 'Joined Date', render: (v) => formatDate(v) },
    ],
    []
  )

  const renderActions = (u) => (
    <div className="admin-row-actions">
      <button className="icon-btn" type="button" aria-label="View user" onClick={() => setViewId(u.id)}>
        <FiEye />
      </button>
      <button className="icon-btn" type="button" aria-label="Edit user" onClick={() => openEdit(u)}>
        <FiEdit2 />
      </button>
      <button
        className="icon-btn"
        type="button"
        aria-label={u.status === 'blocked' ? 'Unblock user' : 'Block user'}
        onClick={() => setConfirm({ open: true, type: 'toggleBlock', id: u.id })}
      >
        {u.status === 'blocked' ? <FiUserCheck /> : <FiUserX />}
      </button>
      <button className="icon-btn" type="button" aria-label="Delete user" onClick={() => setConfirm({ open: true, type: 'delete', id: u.id })}>
        <FiTrash2 />
      </button>
    </div>
  )

  const handleSubmit = (e) => {
    e?.preventDefault?.()

    const payload = {
      id: editingUser?.id || `u-${Math.random().toString(16).slice(2)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.status,
      joinedAt: editingUser?.joinedAt || new Date().toISOString(),
      avatar: editingUser?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(form.name || 'User')}&radius=10&backgroundColor=14B8A6&textColor=0F766E`,
    }

    if (!payload.name || !payload.email) {
      showToast('Name and Email required', 'error')
      return
    }

    if (editingUser) {
      setUsers((cur) => cur.map((u) => (u.id === editingUser.id ? payload : u)))
      showToast('User updated', 'success')
      setEditId(null)
      setAddOpen(false)
      return
    }

    setUsers((cur) => [payload, ...cur])
    showToast('User added', 'success')
    setAddOpen(false)
  }

  if (loading) {
    // simulate loading once
    return <Loader text="Loading users..." />
  }

  if (!users.length) {
    return <EmptyState title="No users" description="Upload your first user from the Add New User button." />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Users</div>
        <h2>Manage registered users</h2>
      </div>

      <div className="admin-filters">
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBar
            value={query}
            onChange={(v) => {
              setPage(1)
              setQuery(v)
            }}
            placeholder="Search users by name, email, phone"
          />
        </div>

        <div className="admin-filter-selects">
          <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All Roles' : r}
              </option>
            ))}
          </select>

          <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : s}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setQuery('')
              setRoleFilter('all')
              setStatusFilter('all')
              setPage(1)
              showToast('Filters reset', 'success')
            }}
          >
            <FiRefreshCw /> Reset
          </button>

          <button className="btn btn-primary" type="button" onClick={openAdd}>
            <FiPlus /> Add New User
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching users" description="Try changing search or filters." />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey="id" renderRowActions={renderActions} />

          <div className="admin-page-footer">
            <div className="admin-muted">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p) => setPage(p)} />
          </div>
        </>
      )}

      {/* View */}
      <FormModal
        open={!!viewId}
        title="User Details"
        onClose={() => setViewId(null)}
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault()
          setViewId(null)
        }}
        width={720}
      >
        {selectedUser ? (
          <div className="admin-form-grid">
            <div className="admin-profile-preview">
              <img
                src={selectedUser.avatar}
                alt={`${selectedUser.name} avatar`}
                style={{ width: 82, height: 82, borderRadius: 26, border: '1px solid rgba(20,184,166,0.25)' }}
              />
              <div>
                <div style={{ fontWeight: 950, fontSize: 18 }}>{selectedUser.name}</div>
                <div className="admin-muted">{selectedUser.role}</div>
              </div>
            </div>

            <div className="admin-field">
              <label>Name</label>
              <div className="admin-readonly">{selectedUser.name}</div>
            </div>
            <div className="admin-field">
              <label>Email</label>
              <div className="admin-readonly">{selectedUser.email}</div>
            </div>
            <div className="admin-field">
              <label>Phone</label>
              <div className="admin-readonly">{selectedUser.phone}</div>
            </div>
            <div className="admin-field">
              <label>Status</label>
              <div className="admin-readonly" style={{ color: selectedUser.status === 'blocked' ? '#ef4444' : '#0F766E', fontWeight: 900 }}>
                {selectedUser.status.toUpperCase()}
              </div>
            </div>
            <div className="admin-field">
              <label>Joined</label>
              <div className="admin-readonly">{formatDate(selectedUser.joinedAt)}</div>
            </div>
          </div>
        ) : (
          <EmptyState title="User not found" description="This user may have been removed." />
        )}
      </FormModal>

      {/* Edit/Add */}
      <FormModal
        open={!!addOpen || !!editId}
        title={editId ? 'Edit User' : 'Add New User'}
        onClose={() => {
          setEditId(null)
          setAddOpen(false)
        }}
        submitText={editId ? 'Update User' : 'Create User'}
        onSubmit={handleSubmit}
        width={760}
      >
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Role</label>
            <select className="admin-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {['Student', 'Instructor', 'Admin'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Status</label>
            <select className="admin-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">active</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
        </div>
      </FormModal>

      {/* Confirm */}
      <ConfirmModal
        open={confirm.open}
        danger={confirm.type === 'delete'}
        title={confirm.type === 'delete' ? 'Delete User?' : confirm.type === 'toggleBlock' ? 'Change User Status?' : 'Confirm'}
        description={
          confirm.type === 'delete'
            ? 'This action cannot be undone. The user will be removed from the table.'
            : 'User status will be updated (block/unblock).'
        }
        confirmText={confirm.type === 'delete' ? 'Delete' : 'Proceed'}
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, type: null, id: null })}
        onConfirm={() => {
          const id = confirm.id
          if (confirm.type === 'delete') {
            setUsers((cur) => cur.filter((u) => u.id !== id))
            showToast('User deleted', 'success')
          } else if (confirm.type === 'toggleBlock') {
            setUsers((cur) =>
              cur.map((u) =>
                u.id === id
                  ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' }
                  : u
              )
            )
            showToast('User status updated', 'success')
          }

          setConfirm({ open: false, type: null, id: null })
          setViewId(null)
          setEditId(null)
        }}
      />
    </div>
  )
}

