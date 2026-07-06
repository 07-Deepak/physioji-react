import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!email.trim() || !password) {
        showToast('Email and password are required', 'error')
        return
      }
      await login({ email, password })
      showToast('Logged in successfully!', 'success')
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      showToast(err?.response?.data?.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page active" id="page-login">
      <div className="auth-wrap">
        <div className="auth-visual">
          <svg viewBox="0 0 400 500">
            <circle cx="330" cy="80" r="140" fill="#ffffff" opacity="0.05" />
            <circle cx="40" cy="420" r="180" fill="#ffffff" opacity="0.05" />
          </svg>
          <div className="brand-line">Welcome Back</div>
          <p>Continue your medical learning journey. Access your doubts, notes, tests, and certificates.</p>
        </div>
        <div className="auth-form-side">
          <div className="auth-box">
            <Link className="back-link" to="/">← Back home</Link>
            <h1>Log in</h1>
            <p className="sub">Continue with your account to access all features.</p>
            <button className="btn-google" type="button" onClick={() => showToast('Continue with Google clicked', 'success')}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.4 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.4 6.5 29.5 4.5 24 4.5 15.9 4.5 8.9 9 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44.5c5.4 0 10.2-1.9 13.9-5.1l-6.4-5.4c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.5-11.3-8.3l-6.6 5.1C9 39.9 15.9 44.5 24 44.5z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C41.5 35.9 44.5 30.4 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
              </svg>
              Continue with Google
            </button>
            <div className="divider">or with email</div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
<button className="btn btn-dark btn-full" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            <div className="auth-foot">
              <Link to="/forgot-password">Forgot password?</Link> · Don&apos;t have account? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
