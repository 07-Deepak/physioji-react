import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiBookOpen, FiMessageCircle, FiPlay, FiUser, FiVideo } from 'react-icons/fi'
import doctorApi from '../utils/doctorApi'
import DoctorSectionPage from './DoctorSectionPage'

const fallbackDoctor = {
  name: 'Doctor',
  specialization: 'Physiotherapist',
  qualification: 'N/A',
  experience: 'N/A',
  status: 'active',
  bio: 'No bio added',
}

const safeNumber = (value) => Number(value || 0)

const safeDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

const readDoctor = () => {
  try {
    return JSON.parse(localStorage.getItem('doctor') || 'null')
  } catch {
    return null
  }
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('doctorToken') || ''
  const storedDoctor = useMemo(() => readDoctor() || fallbackDoctor, [])
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState(storedDoctor)
  const [stats, setStats] = useState({
    myNotes: 0,
    myVideos: 0,
    liveSessions: 0,
    assignedDoubts: 0,
    answeredDoubts: 0,
    pendingDoubts: 0,
  })

  useEffect(() => {
    if (!token) {
      navigate('/doctor-login', { replace: true })
      return
    }

    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const [profileRes, statsRes] = await Promise.allSettled([
          doctorApi.get('/doctor/profile'),
          doctorApi.get('/doctor/dashboard/stats'),
        ])

        if (profileRes.status === 'fulfilled') {
          const nextDoctor = profileRes.value.data?.doctor || profileRes.value.data?.doctorData || storedDoctor
          if (nextDoctor) {
            localStorage.setItem('doctor', JSON.stringify(nextDoctor))
            if (active) setDoctor(nextDoctor)
          }
        }

        if (statsRes.status === 'fulfilled') {
          const payload = statsRes.value.data?.stats || statsRes.value.data || {}
          if (active) {
            setStats({
              myNotes: safeNumber(payload.myNotes ?? payload.totalNotes),
              myVideos: safeNumber(payload.myVideos ?? payload.totalVideos),
              liveSessions: safeNumber(payload.liveSessions ?? payload.activeLiveStreams),
              assignedDoubts: safeNumber(payload.assignedDoubts ?? payload.totalDoubts),
              answeredDoubts: safeNumber(payload.answeredDoubts),
              pendingDoubts: safeNumber(payload.pendingDoubts),
            })
          }
        }
      } catch {
        // fall back silently
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const doc = doctor || fallbackDoctor

  return (
    <DoctorSectionPage
      title={`Welcome, ${doc.name || fallbackDoctor.name}`}
      subtitle="Your dedicated PhysioJi doctor workspace with a clean overview of performance and quick access to key areas."
      action={
        <div className="doctor-hero-actions">
          <Link className="doctor-secondary-btn" to="/doctor/profile">
            <FiUser /> View Profile
          </Link>
          <Link className="doctor-primary-btn" to="/doctor/doubts">
            <FiMessageCircle /> Open Doubts
          </Link>
        </div>
      }
    >
      <div className="doctor-hero">
        <div className="doctor-eyebrow">Doctor Panel Overview</div>
        <h2>{loading ? 'Loading your workspace...' : `Dr. ${doc.name || fallbackDoctor.name}`}</h2>
        <p>
          {doc.specialization || fallbackDoctor.specialization} | {doc.qualification || fallbackDoctor.qualification} |{' '}
          {doc.experience || fallbackDoctor.experience}
        </p>
      </div>

      <div className="doctor-grid cols-3" style={{ marginTop: 18 }}>
        {[
          { label: 'My Notes', value: stats.myNotes, icon: FiBookOpen },
          { label: 'My Videos', value: stats.myVideos, icon: FiVideo },
          { label: 'Live Sessions', value: stats.liveSessions, icon: FiPlay },
          { label: 'Assigned Doubts', value: stats.assignedDoubts, icon: FiMessageCircle },
          { label: 'Answered Doubts', value: stats.answeredDoubts, icon: FiMessageCircle },
          { label: 'Pending Doubts', value: stats.pendingDoubts, icon: FiMessageCircle },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="doctor-card doctor-stat">
              <Icon size={22} />
              <div className="doctor-stat-value">{item.value.toLocaleString()}</div>
              <div className="doctor-stat-label">{item.label}</div>
            </div>
          )
        })}
      </div>

      <div className="doctor-grid cols-2" style={{ marginTop: 18 }}>
        <div className="doctor-profile-card">
          <div className="doctor-eyebrow">Profile Summary</div>
          <h3 style={{ margin: '10px 0 16px' }}>{doc.name || fallbackDoctor.name}</h3>
          <div className="meta-grid">
            <div className="doctor-meta">
              <span>Specialization</span>
              <strong>{doc.specialization || fallbackDoctor.specialization}</strong>
            </div>
            <div className="doctor-meta">
              <span>Qualification</span>
              <strong>{doc.qualification || fallbackDoctor.qualification}</strong>
            </div>
            <div className="doctor-meta">
              <span>Experience</span>
              <strong>{doc.experience || fallbackDoctor.experience}</strong>
            </div>
            <div className="doctor-meta">
              <span>Status</span>
              <strong>{doc.status || fallbackDoctor.status}</strong>
            </div>
          </div>
          <div style={{ marginTop: 16, color: '#a9c0d8' }}>
            <strong style={{ color: '#f8fbff' }}>Bio: </strong>
            {doc.bio || fallbackDoctor.bio}
          </div>
          <div style={{ marginTop: 10, color: '#a9c0d8' }}>
            <strong style={{ color: '#f8fbff' }}>Last Updated: </strong>
            {safeDate(doc.updatedAt)}
          </div>
        </div>

        <div className="doctor-card">
          <div className="doctor-eyebrow">Quick Actions</div>
          <h3 style={{ marginTop: 10 }}>Move faster today</h3>
          <div className="doctor-grid" style={{ marginTop: 16 }}>
            <Link className="doctor-secondary-btn" to="/doctor/notes">
              <FiBookOpen /> Manage Notes
            </Link>
            <Link className="doctor-secondary-btn" to="/doctor/videos">
              <FiVideo /> Review Videos
            </Link>
            <Link className="doctor-secondary-btn" to="/doctor/live-sessions">
              <FiPlay /> Live Sessions
            </Link>
            <Link className="doctor-secondary-btn" to="/doctor/doubts">
              <FiMessageCircle /> Answer Doubts
            </Link>
          </div>
        </div>
      </div>
    </DoctorSectionPage>
  )
}
