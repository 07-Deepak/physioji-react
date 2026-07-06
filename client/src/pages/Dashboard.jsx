import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const topics = [
  { icon: '🧠', title: 'Neurology', accuracy: 42, attempted: 8 },
  { icon: '💊', title: 'Pharmacology', accuracy: 58, attempted: 12 },
  { icon: '🧬', title: 'Pathology', accuracy: 65, attempted: 15 },
]

export default function Dashboard() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [chartValues] = useState([60, 70, 75, 82, 85, 89])

  return (
    <section className="page active" id="page-dashboard">
      <div className="page-header">
        <div className="eyebrow">Your Learning Journey</div>
        <h1>Dashboard</h1>
        {user && (
          <p>
            Welcome back, {user.fullName}. Your {user.role || 'Student'} account is {user.accountStatus || 'Active'}.
          </p>
        )}
      </div>
      {user && (
        <div className="dashboard-profile-strip">
          <div>
            <span>Profile</span>
            <strong>{user.fullName}</strong>
          </div>
          <div>
            <span>Username</span>
            <strong>@{user.username || 'student'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{user.accountStatus || 'Active'}</strong>
          </div>
        </div>
      )}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">42</div>
          <div className="stat-label">Doubts Asked</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">89%</div>
          <div className="stat-label">Avg. Test Score</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">7</div>
          <div className="stat-label">Day Streak 🔥</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">156</div>
          <div className="stat-label">Learning Points</div>
        </div>
      </div>

      <div className="progress-chart">
        <div className="chart-title">Your Test Performance Over 6 Weeks</div>
        <div className="chart-bars">
          {chartValues.map((value, index) => (
            <div key={index} className={`bar ${index === 0 ? 'weak' : index === 1 ? 'average' : ''}`} style={{ height: `${value}%` }}>
              <span className="bar-label">Week {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-header" style={{ padding: '20px 48px 0' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Topics to Focus On</h2>
      </div>
      <div className="dashboard-grid" style={{ paddingBottom: '100px' }}>
        {topics.map((topic) => (
          <div key={topic.title} className="fcard light">
            <div className="fcard-icon">{topic.icon}</div>
            <h3>{topic.title}</h3>
            <p>
              {topic.accuracy}% accuracy · {topic.attempted} questions attempted ·{' '}
              <button className="btn btn-dark btn-small" type="button" onClick={() => showToast('Study session started!', 'success')} style={{ marginTop: '12px' }}>
                Study Now
              </button>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
