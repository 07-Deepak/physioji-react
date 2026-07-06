import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FiActivity, FiBookOpen, FiChevronDown, FiLogOut, FiMenu, FiMessageCircle, FiPlay, FiSettings, FiUser, FiVideo } from 'react-icons/fi'
import './doctor-panel.css'

const navItems = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: FiActivity, end: true },
  { to: '/doctor/profile', label: 'My Profile', icon: FiUser },
  { to: '/doctor/notes', label: 'My Notes', icon: FiBookOpen },
  { to: '/doctor/videos', label: 'My Videos', icon: FiVideo },
  { to: '/doctor/live-sessions', label: 'Live Sessions', icon: FiPlay },
  { to: '/doctor/doubts', label: 'Assigned Doubts', icon: FiMessageCircle },
  { to: '/doctor/settings', label: 'Settings', icon: FiSettings },
]

const fallbackDoctor = {
  name: 'Doctor',
  specialization: 'Physiotherapist',
  qualification: 'N/A',
  experience: 'N/A',
  status: 'active',
}

function readDoctor() {
  try {
    return JSON.parse(localStorage.getItem('doctor') || 'null')
  } catch {
    return null
  }
}

export default function DoctorLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const doctor = useMemo(() => readDoctor() || fallbackDoctor, [])

  const handleLogout = () => {
    localStorage.removeItem('doctorToken')
    localStorage.removeItem('doctor')
    navigate('/doctor-login', { replace: true })
  }

  return (
    <div className="doctor-shell">
      <aside className={`doctor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="doctor-sidebar-top">
          <div className="doctor-brand">
            <div className="doctor-brand-mark">P</div>
            <div>
              <div className="doctor-brand-title">PhysioJi</div>
              <div className="doctor-brand-subtitle">Doctor Panel</div>
            </div>
          </div>
          <button className="doctor-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            ×
          </button>
        </div>

        <div className="doctor-profile-mini">
          <div className="doctor-avatar">{String(doctor?.name || 'D').charAt(0).toUpperCase()}</div>
          <div>
            <strong>{doctor?.name || fallbackDoctor.name}</strong>
            <span>{doctor?.specialization || fallbackDoctor.specialization}</span>
          </div>
          <button className="doctor-mini-toggle" type="button" aria-label="Doctor menu">
            <FiChevronDown />
          </button>
        </div>

        <nav className="doctor-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `doctor-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <button className="doctor-logout" type="button" onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>
      </aside>

      <div className="doctor-main">
        <header className="doctor-header">
          <button className="doctor-menu-btn" type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle doctor sidebar">
            <FiMenu />
          </button>

          <div className="doctor-header-copy">
            <div className="doctor-eyebrow">Professional Workspace</div>
            <div className="doctor-header-title">Welcome back, {doctor?.name || fallbackDoctor.name}</div>
          </div>

          <div className="doctor-header-card">
            <div className="doctor-header-card-label">Account Status</div>
            <div className={`doctor-status-badge status-${String(doctor?.status || fallbackDoctor.status).toLowerCase()}`}>
              {doctor?.status || fallbackDoctor.status}
            </div>
          </div>
        </header>

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
