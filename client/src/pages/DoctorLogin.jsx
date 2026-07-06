import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../utils/apiUrl'
import '../doctor/doctor-panel.css'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      showToast('Doctor ID / Email and password are required', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_BASE_URL}/doctor/login`, {
        email,
        password,
      })

      const doctorToken = response.data?.doctorToken
      const doctor = response.data?.doctor

      if (!doctorToken || !doctor) {
        throw new Error('Invalid server response')
      }

      localStorage.setItem('doctorToken', doctorToken)
      localStorage.setItem('doctor', JSON.stringify(doctor))

      showToast('Welcome to the Doctor Panel', 'success')
      navigate('/doctor/dashboard', { replace: true })
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Doctor login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="doctor-login-shell">
      <div className="doctor-login-visual">
        <div className="doctor-login-brand">PhysioJi Doctor Access</div>
        <h1>Doctor Login</h1>
        <p>Access your professional PhysioJi doctor panel.</p>

        <div className="doctor-login-highlights">
          <div className="doctor-login-highlight">
            <strong>Professional Workspace</strong>
            <span>Separate from the public patient website</span>
          </div>
          <div className="doctor-login-highlight">
            <strong>Secure Access</strong>
            <span>Login with the credentials created by admin</span>
          </div>
          <div className="doctor-login-highlight">
            <strong>Doctor Tools</strong>
            <span>Dashboard, notes, videos, live sessions, doubts</span>
          </div>
        </div>
      </div>

      <div className="doctor-login-card">
        <div className="doctor-login-card-head">
          <div className="doctor-eyebrow">Secure sign in</div>
          <h2>Login to Doctor Panel</h2>
          <p>Use your Doctor ID or email and password to continue.</p>
        </div>

        <form className="doctor-login-form" onSubmit={handleLogin}>
          <label className="doctor-field">
            <span>Doctor ID / Email</span>
            <input
              type="text"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="doctor-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="doctor-primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login to Doctor Panel'}
          </button>
        </form>

        <div className="doctor-login-links">
          <Link to="/login">Login as User</Link>
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
