import { useEffect, useMemo, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import Pagination from '../../components/admin/Pagination'
import UserTable from '../../components/admin/UserTable'
import SearchBar from '../../components/admin/SearchBar'
import './AdminUsers.css'
import { getAllUsers } from '../../services/adminService'

function safeLower(v) {
  return String(v ?? '').toLowerCase()
}

function mapRoleLabel(role) {
  const r = String(role ?? '').toLowerCase()
  if (r === 'admin') return 'Admin'
  return 'User'
}

function mapStatusLabel(status) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'active') return 'Active'
  return 'Inactive'
}

export default function AdminUsers() {
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [users, setUsers] = useState([])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const fetchUsers = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await getAllUsers()
      const rawUsers = data?.users ?? []

      setUsers(
        rawUsers.map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: mapRoleLabel(u.role),
          status: mapStatusLabel(u.status),
          profileImage: u.profileImage,
          createdAt: u.createdAt,
        }))
      )
    } catch (err) {
      setErrorMsg('Failed to load users')
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = safeLower(search).trim()
    if (!q) return users

    return users.filter((u) => {
      const name = safeLower(u.name)
      const email = safeLower(u.email)
      return name.includes(q) || email.includes(q)
    })
  }, [users, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const currentPage = Math.min(page, totalPages)
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const stats = useMemo(() => {
    const active = filtered.filter((u) => String(u.status).toLowerCase() === 'active').length
    const inactive = filtered.filter((u) => String(u.status).toLowerCase() === 'inactive').length
    return {
      total: filtered.length,
      active,
      inactive,
    }
  }, [filtered])

  const handleView = () => {}
  const handleEdit = () => {}
  const handleDelete = () => {}

  if (loading) return <Loader text="Loading users..." />

  if (errorMsg) {
    return (
      <div className="admin-page-users">
        <EmptyState title="Something went wrong" description={errorMsg} />
      </div>
    )
  }

  return (
    <div className="admin-page-users">
      <div className="admin-users-header">
        <div className="admin-users-title">
          <div className="admin-kicker">Users Management</div>
          <h2>Users</h2>
        </div>

        <div className="admin-users-actions">
          <button className="btn" type="button" onClick={fetchUsers}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-users-cards">
        <div className="admin-users-card">
          <div className="label">Total Users</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="admin-users-card">
          <div className="label">Active Users</div>
          <div className="value">{stats.active}</div>
        </div>
        <div className="admin-users-card">
          <div className="label">Inactive Users</div>
          <div className="value">{stats.inactive}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <div className="admin-users-search">
          <SearchBar
            value={search}
            onChange={(v) => {
              setPage(1)
              setSearch(v)
            }}
            placeholder="Search by name or email"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ marginTop: 18 }}>
          <EmptyState title="No users found" description="There are no registered users in the database." />
        </div>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
            <UserTable
              users={pagedUsers}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          <div className="admin-users-footer">
            <div className="left">
              Page {currentPage} of {totalPages}
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={total}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}
    </div>
  )
}


