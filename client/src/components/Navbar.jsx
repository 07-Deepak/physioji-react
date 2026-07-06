import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Doubts', path: '/doubts' },
  { label: 'Notes', path: '/notes' },
  { label: 'Videos', path: '/videos' },
  { label: 'Tests', path: '/tests' },
  { label: 'Doctors', path: '/doctors' },
  { label: 'Resources', path: '/resources' },
]

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PJ'

const getImageUrl = (image) => {
  if (!image) return ''
  if (image.startsWith('http')) return image
  return `${apiOrigin}${image}`
}

export default function Navbar({ isMenuOpen, onToggleMenu, onCloseMenu }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loginMenuOpen, setLoginMenuOpen] = useState(false)
  const avatarUrl = getImageUrl(user?.profileImage)

  const handleLogout = () => {
    logout()
    onCloseMenu?.()
    setLoginMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <nav className={`navbar ${isMenuOpen ? 'is-menu-open' : ''}`}>
      <NavLink className="brand" to="/" onClick={onCloseMenu}>
        <span className="brand-mark">Pj</span> Physio Ji
      </NavLink>
      <div className={`nav-links${isMenuOpen ? ' mobile-open' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link mobile-item${isActive ? ' active' : ''}`
            }
            onClick={onCloseMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <NavLink className="link-plain" to="/notifications" aria-label="Notifications">
              <span className="nav-icon">N</span>
              <span className="notification-badge">3</span>
            </NavLink>
            <NavLink className="link-plain" to="/bookmarks" aria-label="Bookmarks">
              <span className="nav-icon">B</span>
            </NavLink>
            <div className="user-menu">
              <button className="user-menu-trigger" type="button" aria-label="Open user menu">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.fullName} className="nav-avatar" />
                ) : (
                  <span className="nav-avatar fallback">{getInitials(user.fullName)}</span>
                )}
                <span className="nav-user-name">{user.fullName}</span>
              </button>
              <div className="user-menu-panel">
                <NavLink to="/profile" onClick={onCloseMenu}>Profile</NavLink>
                <NavLink to="/profile" onClick={onCloseMenu}>Settings</NavLink>
                <button type="button" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </>
        ) : (
          <div className="user-menu">
            <button
              className="btn btn-dark btn-small"
              type="button"
              onClick={() => setLoginMenuOpen((current) => !current)}
              aria-expanded={loginMenuOpen}
            >
              Log in
            </button>
            {loginMenuOpen ? (
              <div className="user-menu-panel">
                <NavLink
                  to="/login"
                  onClick={() => {
                    setLoginMenuOpen(false)
                    onCloseMenu?.()
                  }}
                >
                  Login as User
                </NavLink>
                <NavLink
                  to="/doctor-login"
                  onClick={() => {
                    setLoginMenuOpen(false)
                    onCloseMenu?.()
                  }}
                >
                  Login as Doctor
                </NavLink>
              </div>
            ) : null}
          </div>
        )}
        <button className="hamburger" id="hamburger" type="button" onClick={onToggleMenu} aria-expanded={isMenuOpen}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
