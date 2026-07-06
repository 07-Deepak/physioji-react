import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiBell,
  FiClipboard,
  FiDatabase,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlay,
  FiRadio,
  FiSettings,
  FiMessageSquare,
  FiUsers,
} from 'react-icons/fi'
import { useMemo } from 'react'
import { useAdmin } from '../../contexts/AdminContext'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/doctors', label: 'Doctors', icon: FiUsers },
  { to: '/admin/notes', label: 'Notes', icon: FiFileText },
  { to: '/admin/resources', label: 'Resources', icon: FiDatabase },
  { to: '/admin/videos', label: 'Videos', icon: FiPlay },
  { to: '/admin/live-streams', label: 'Live Streams', icon: FiRadio },
  { to: '/admin/doubts', label: 'Doubts', icon: FiMessageSquare },
  { to: '/admin/tests', label: 'Tests', icon: FiHelpCircle },
  { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
  { to: '/admin/profile', label: 'Profile', icon: FiClipboard },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
]

export default function AdminSidebar({ sidebarOpen, onToggleSidebar }) {
  const navigate = useNavigate()
  const { admin, adminLogout } = useAdmin()

  const roleLabel = useMemo(() => admin?.role || 'Admin', [admin?.role])

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-top">
        <div className="admin-sidebar-brand">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">PhysioJi</div>
            <div className="brand-role">{roleLabel}</div>
          </div>
        </div>
        <button className="admin-sidebar-close" type="button" onClick={onToggleSidebar} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => onToggleSidebar?.()}
            >
              <Icon className="admin-sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <button
        className="admin-sidebar-logout"
        type="button"
        onClick={() => {
          adminLogout()
          localStorage.removeItem('physiojiToken')
          navigate('/admin/login', { replace: true })
        }}
      >
        <FiLogOut />
        Logout
      </button>
    </aside>
  )
}
