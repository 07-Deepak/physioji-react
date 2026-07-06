import { FiTrendingUp } from 'react-icons/fi'
import { fiIconMap } from '../../utils/fiIconMap'

export default function StatsCard({ label, value, growth = 0, icon }) {
  const isPositive = growth >= 0
  const pct = Math.abs(Number(growth) || 0)

  return (
    <div className="admin-stats-card">
      <div className="admin-stats-top">
        <div className="admin-stats-icon" aria-hidden="true">
          {fiIconMap[icon] || '📊'}
        </div>
        <div className="admin-stats-label">{label}</div>
      </div>

      <div className="admin-stats-value">{Number(value || 0).toLocaleString()}</div>

      <div className="admin-stats-bottom">
        <span className={`growth ${isPositive ? 'pos' : 'neg'}`}>
          <FiTrendingUp className="growth-icon" />
          {isPositive ? '+' : '-'}
          {pct}%
        </span>
        <div className="admin-progress" aria-hidden="true">
          <div className="admin-progress-bar" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
    </div>
  )
}
