import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import api from '../../utils/api'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import StatsCard from '../../components/admin/StatsCard'
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/admin/dashboard')
        setStats(res.data)
      } catch (err) {
        showToast(err?.response?.data?.message || 'Failed to load dashboard', 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [showToast])

  const cards = useMemo(() => {
    if (!stats) return []

    return [
      { key: 'users', label: 'Total Users', value: stats.totalUsers ?? 0, growth: stats.usersGrowth ?? 0, icon: 'users' },
      { key: 'notes', label: 'Total Notes', value: stats.totalNotes ?? 0, growth: stats.notesGrowth ?? 0, icon: 'notes' },
      { key: 'resources', label: 'Total Resources', value: stats.totalResources ?? 0, growth: stats.resourcesGrowth ?? 0, icon: 'resources' },
      { key: 'videos', label: 'Total Videos', value: stats.totalVideos ?? 0, growth: stats.videosGrowth ?? 0, icon: 'videos' },
      { key: 'tests', label: 'Total Tests', value: stats.totalTests ?? 0, growth: stats.testsGrowth ?? 0, icon: 'tests' },
      { key: 'doubts', label: 'Total Doubts', value: stats.totalDoubts ?? 0, growth: stats.doubtsGrowth ?? 0, icon: 'doubts' },
    ]
  }, [stats])

  if (loading) return <Loader text="Loading admin dashboard..." />
  if (!stats) return <EmptyState title="No dashboard data" />

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="kicker">Analytics</div>
          <h2>Physioji Admin Dashboard</h2>
        </div>
      </div>

      <div className="admin-grid-cards">
        {cards.map((c) => (
          <StatsCard key={c.key} {...c} />
        ))}
      </div>

      <div className="admin-grid-charts">
        <div className="admin-panel">
          <div className="admin-panel-title">Users Growth Chart</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.usersGrowthSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Tests Analytics</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.testsAnalyticsSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0F766E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Doubts Analytics</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.doubtsAnalyticsSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Content Upload Analytics</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.uploadAnalyticsSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="notes" stroke="#0F766E" strokeWidth={2} />
                <Line type="monotone" dataKey="resources" stroke="#14B8A6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

