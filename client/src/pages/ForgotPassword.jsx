import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'

export default function ForgotPassword() {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    showToast('Password reset link sent! Check your email.', 'success')
  }

  return (
    <section className="page active" style={{ padding: '90px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="eyebrow">Reset Password</div>
        <h1>Forgot Password</h1>
        <p>Enter your email and we&apos;ll send you a link to reset your password.</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '18px', padding: '28px', maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-dark" type="submit">Send Reset Link</button>
        </form>
      </div>
    </section>
  )
}
