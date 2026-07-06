import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { showToast } = useToast()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [field, setField] = useState('Select field')
  const [year, setYear] = useState('Select year')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        fullName,
        username,
        email,
        password,
        // Backend schema only needs phone/role optionally; keep existing fields but don’t invent extra schema.
        role: 'Student',
        phone: '',
      })
      showToast('Account created successfully!', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Signup failed', 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="page active" id="page-signup">
      <div className="auth-wrap">
        <div className="auth-form-side" style={{ order: 1 }}>
          <div className="auth-box">
            <Link className="back-link" to="/">← Back home</Link>
            <h1>Create Account</h1>
            <p className="sub">Join 50,000+ medical students learning with verified doctors.</p>
            <button className="btn-google" type="button" onClick={() => showToast('Continue with Google clicked', 'success')}>
              Continue with Google
            </button>
            <div className="divider">or use email</div>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Field of Study</label>
                  <select value={field} onChange={(e) => setField(e.target.value)}>
                    <option>Select field</option>
                    <option>Physiotherapy</option>
                    <option>Medicine (MBBS)</option>
                    <option>Nursing</option>
                    <option>Dental</option>
                    <option>Pharmacy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option>Select year</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Intern</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-dark btn-full" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
            <div className="auth-foot">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
        <div className="auth-visual" style={{ order: 2 }}>
          <svg viewBox="0 0 400 500">
            <circle cx="330" cy="80" r="140" fill="#ffffff" opacity="0.05" />
            <circle cx="40" cy="420" r="180" fill="#ffffff" opacity="0.05" />
          </svg>
          <div className="brand-line">Join Physio Ji</div>
          <p>Ask doubts, save notes, track test scores, and earn certificates — free, forever, for students.</p>
        </div>
      </div>
    </section>
  )
}
