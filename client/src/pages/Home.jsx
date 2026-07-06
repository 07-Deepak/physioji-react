import { Link } from 'react-router-dom'
import FeatureCard from '../components/FeatureCard'

const features = [
  {
    variant: 'dark',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 12c0 4.4-4 8-9 8-1.2 0-2.4-.2-3.4-.6L3 21l1.7-4.5C3.6 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
      </svg>
    ),
    title: 'Doubt solving',
    description: 'Post it, we auto-tag it, a specialist answers it — with images, PDFs and clear explanations.',
  },
  {
    variant: 'light',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="1.6">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
    title: 'Notes & PDFs',
    description: 'Organized by field → subject → topic. Bookmark for later. Download for offline.',
  },
  {
    variant: 'olive',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="1.6">
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 3h6v3H9z" />
      </svg>
    ),
    title: 'Mock MCQ tests',
    description: 'Timed, auto-graded, with explanations and negative marking. Track your progress.',
  },
  {
    variant: 'light',
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="1.6">
        <path d="M12 22s7-4.4 7-11V5l-7-3-7 3v6c0 6.6 7 11 7 11z" />
      </svg>
    ),
    title: 'Verified doctors',
    description: 'Every answer is signed by a real specialist you can look up. No anonymous advice.',
  },
]

export default function Home() {
  return (
    <section className="page active" id="page-home">
      <div className="hero">
        <div>
          <div className="badge">✦ Trusted by 50,000+ medical students across India</div>
          <h1>
            Learn medicine with <span className="accent">real doctors</span>, not random forums.
          </h1>
          <p className="lead">
            Post your doubts, get answered by verified specialists, download curated notes, and sharpen your prep with MCQ tests — all in one calm, mobile-first place.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-dark" to="/signup">Start free — I'm a student →</Link>
            <Link className="btn btn-outline" to="/doctors">Meet the doctors</Link>
          </div>
          <div className="hero-flags">
            <div className="flag">🛡️ Verified doctors only</div>
            <div className="flag">⚡ 2-hour response time</div>
            <div className="flag">✦ AI-tagged doubts</div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image">
            <svg viewBox="0 0 200 200" fill="none">
              <path d="M100 40c-22 0-38 16-38 38 0 30 38 74 38 74s38-44 38-74c0-22-16-38-38-38z" stroke="#fff" strokeWidth="4" opacity="0.85" />
              <circle cx="100" cy="78" r="14" fill="#fff" opacity="0.85" />
            </svg>
          </div>
          <div className="float-card">
            <div className="avatar">Dj</div>
            <div>
              <div className="name">Dr. Jaya · Physiotherapy</div>
              <div className="sub">answered 284 doubts this month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ paddingTop: '60px' }}>
        <div className="eyebrow">Everything you need</div>
        <h2>One quiet corner of the internet for your medical prep.</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              variant={feature.variant}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      <div className="cta-banner">
        <h2>Ready to ask your first doubt?</h2>
        <p>
          Sign up in 30 seconds with Google or email. Your first answer usually lands within a few hours.
        </p>
        <div className="cta-ctas">
          <Link className="btn btn-terracotta" to="/signup">Create free account</Link>
          <Link className="btn btn-outline-light" to="/doubts">Browse solved doubts</Link>
        </div>
      </div>
    </section>
  )
}
