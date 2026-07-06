import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import { API_BASE_URL } from '../../utils/apiUrl'

const safeNumber = (value) => Number(value || 0)

const safeDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

const fallbackDoctor = {
  name: 'Doctor',
  specialization: 'General',
  qualification: 'N/A',
  experience: 'N/A',
  bio: 'No bio added',
  status: 'active',
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const token = localStorage.getItem('doctorToken') || ''

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      }),
    [token]
  )

  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doctor') || 'null')
    } catch {
      return null
    }
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalVideos: 0,
    totalDoubts: 0,
    pendingDoubts: 0,
    answeredDoubts: 0,
    activeLiveStreams: 0,
  })

  useEffect(() => {
    if (!token) {
      navigate('/doctor-login', { replace: true })
      return
    }

    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        const [profileRes, statsRes] = await Promise.all([
          api.get('/doctor/me'),
          api.get('/doctor/dashboard/stats'),
        ])

        const nextDoctor = profileRes.data?.doctor || profileRes.data?.data?.doctor || profileRes.data?.doctorData || doctor
        if (nextDoctor) {
          localStorage.setItem('doctor', JSON.stringify(nextDoctor))
          if (alive) setDoctor(nextDoctor)
        }

        if (alive) {
          setStats({
            totalUsers: safeNumber(statsRes.data?.stats?.totalUsers),
            totalNotes: safeNumber(statsRes.data?.stats?.totalNotes),
            totalVideos: safeNumber(statsRes.data?.stats?.totalVideos),
            totalDoubts: safeNumber(statsRes.data?.stats?.totalDoubts),
            pendingDoubts: safeNumber(statsRes.data?.stats?.pendingDoubts),
            answeredDoubts: safeNumber(statsRes.data?.stats?.answeredDoubts),
            activeLiveStreams: safeNumber(statsRes.data?.stats?.activeLiveStreams),
          })
        }
      } catch (err) {
        localStorage.removeItem('doctorToken')
        localStorage.removeItem('doctor')
        showToast(err?.response?.data?.message || err?.message || 'Session expired', 'error')
        navigate('/doctor-login', { replace: true })
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const doc = doctor || fallbackDoctor

  if (loading) {
    return (
      <section className="page active" id="page-doctor-dashboard">
        <div style={{ padding: 48 }}>
          <div className="fcard light" style={{ padding: 24 }}>Loading doctor dashboard...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="page active" id="page-doctor-dashboard">
      <div className="page-header">
        <div className="eyebrow">Doctor Portal</div>
        <h1>Welcome, {doc.name || fallbackDoctor.name}</h1>
        <p>
          Your limited dashboard gives you access to your profile and a quick snapshot of platform activity.
        </p>
      </div>

      <div className="dashboard-profile-strip">
        <div>
          <span>Name</span>
          <strong>{doc.name || fallbackDoctor.name}</strong>
        </div>
        <div>
          <span>Specialization</span>
          <strong>{doc.specialization || fallbackDoctor.specialization}</strong>
        </div>
        <div>
          <span>Qualification</span>
          <strong>{doc.qualification || fallbackDoctor.qualification}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{doc.status || fallbackDoctor.status}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalDoubts.toLocaleString()}</div>
          <div className="stat-label">Total Doubts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pendingDoubts.toLocaleString()}</div>
          <div className="stat-label">Pending Doubts</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">{stats.answeredDoubts.toLocaleString()}</div>
          <div className="stat-label">Answered Doubts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeLiveStreams.toLocaleString()}</div>
          <div className="stat-label">Live Streams</div>
        </div>
      </div>

      <div className="fcard light" style={{ padding: 24, margin: '0 48px 18px' }}>
        <div className="eyebrow">Profile</div>
        <h2 style={{ marginBottom: 10 }}>{doc.name || fallbackDoctor.name}</h2>
        <div style={{ display: 'grid', gap: 10, color: 'var(--ink)' }}>
          <div><strong>Specialization:</strong> {doc.specialization || fallbackDoctor.specialization}</div>
          <div><strong>Qualification:</strong> {doc.qualification || fallbackDoctor.qualification}</div>
          <div><strong>Experience:</strong> {doc.experience || fallbackDoctor.experience}</div>
          <div><strong>Email:</strong> {doc.email || 'N/A'}</div>
          <div><strong>Phone:</strong> {doc.phone || 'N/A'}</div>
          <div><strong>Bio:</strong> {doc.bio || fallbackDoctor.bio}</div>
          <div><strong>Last Updated:</strong> {safeDate(doc.updatedAt)}</div>
        </div>
      </div>
    </section>
  )
}
