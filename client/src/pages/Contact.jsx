import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'

export default function Contact() {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    showToast('Message sent! We\'ll get back to you soon.', 'success')
  }

  return (
    <section className="page active" id="page-contact">
      <div className="page-header">
        <div className="eyebrow">Get in Touch</div>
        <h1>Contact Us</h1>
        <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>
      <div className="section">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" placeholder="How can we help?" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea placeholder="Tell us more..." value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-dark" type="submit">Send Message</button>
              <button className="btn btn-outline" type="button" onClick={() => { setName(''); setEmail(''); setSubject(''); setMessage('') }}>
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
