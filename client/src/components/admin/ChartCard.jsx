import { ResponsiveContainer } from 'recharts'

export default function ChartCard({ title, children }) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-title">{title}</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

