import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useAdmin } from '../../contexts/AdminContext'

export default function AdminLogin() {
  const navigate = useNavigate()

  const { showToast } = useToast()
  const { adminLogin } = useAdmin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!email.trim() || !password) {
        showToast('Email and password are required', 'error')
        return
      }

      const { adminData } = await adminLogin({ email, password })

      showToast('Logged in successfully!', 'success')

      if (adminData?.role === 'admin' || adminData?.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/admin/login', { replace: true })
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Admin login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page active" id="page-admin-login">
      <div className="admin-auth-wrap">
        <div className="admin-auth-visual">
          <div className="admin-brand">Physioji Admin</div>
          <h1 className="admin-auth-title">Welcome back</h1>
          <p className="admin-auth-sub">
            Manage users, notes, resources, videos, doubts, tests, and notifications.
          </p>
          <div className="admin-auth-badges">
            <span className="badge">SaaS Dashboard</span>
            <span className="badge badge-teal">Secure</span>
          </div>
        </div>

        <div className="admin-auth-form-side">
          <div className="admin-auth-box">
            <Link className="back-link" to="/">
              ← Back to site
            </Link>
            <h1>Admin Login</h1>
            <p className="sub">Sign in to continue to your dashboard.</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <Link className="link" to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>

              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="auth-foot">
                <span>
                  Admin access is required.
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}



