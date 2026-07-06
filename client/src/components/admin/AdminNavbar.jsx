import { useAuth } from '../../contexts/AuthContext'
import { useMemo, useState } from 'react'
import { FiBell, FiMenu, FiSearch, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

export default function AdminNavbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const adminName = useMemo(() => user?.fullName || user?.email || 'Admin', [user?.fullName, user?.email])

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button className="admin-hamburger" type="button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <FiMenu />
        </button>

        <div className="admin-search">
          <FiSearch className="admin-search-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search admin..." />
        </div>
      </div>

      <div className="admin-navbar-right">
        <button className="icon-btn" type="button" aria-label="Notifications">
          <FiBell />
        </button>

        <div className="admin-avatar">
          <div className="avatar-circle">
            <FiUser />
          </div>
          <div className="admin-avatar-meta">
            <div className="admin-avatar-name">{adminName}</div>
            <div className="admin-avatar-role">Admin</div>
          </div>
        </div>

        <div className="admin-profile-dropdown">
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/admin/profile')}>
            Profile
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              logout()
              navigate('/admin/login', { replace: true })
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
