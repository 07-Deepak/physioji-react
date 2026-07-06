import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import api from '../utils/api'
import { BACKEND_BASE_URL } from '../utils/apiUrl'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const fallbackImage = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=900&q=80'

const getImageUrl = (value) => {
  if (!value) return fallbackImage
  if (/^https?:\/\//i.test(value)) return value
  return `${BACKEND_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

const safeText = (value, fallback) => (String(value ?? '').trim() || fallback)

export default function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState(null)

  const loadDoctor = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/doctors/${id}`)
      setDoctor(response.data?.doctor || null)
    } catch (error) {
      showToast(error?.response?.data?.message || 'Doctor profile not found', 'error')
      setDoctor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleLike = async () => {
    if (!user) {
      showToast('Please login to like doctor profile.', 'error')
      navigate('/login')
      return
    }

    try {
      const response = await api.patch(`/doctors/${id}/like`)
      setDoctor((current) =>
        current
          ? {
              ...current,
              likedByCurrentUser: Boolean(response.data?.liked),
              likes: Number(response.data?.likes || 0),
            }
          : current
      )
    } catch (error) {
      showToast(error?.response?.data?.message || 'Unable to update like', 'error')
    }
  }

  if (loading) {
    return <section className="page active" id="page-doctor-profile"><div style={{ padding: 32 }}>Loading doctor profile...</div></section>
  }

  if (!doctor) {
    return (
      <section className="page active" id="page-doctor-profile">
        <div className="doctor-empty-card" style={{ marginTop: 24 }}>
          <h2>Doctor not found</h2>
          <p style={{ color: 'var(--muted)' }}>The requested doctor profile is unavailable or inactive.</p>
          <Link className="btn btn-dark btn-small" to="/doctors">
            Back to Doctors
          </Link>
        </div>
      </section>
    )
  }

  const liked = Boolean(doctor.likedByCurrentUser)

  return (
    <section className="page active" id="page-doctor-profile">
      <div className="page-header">
        <div className="eyebrow">Doctor Profile</div>
        <h1>{safeText(doctor.name, 'Doctor')}</h1>
        <p>View profile details, qualifications, and doctor engagement on PhysioJi.</p>
      </div>

      <div className="doctor-card" style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ borderRadius: 22, overflow: 'hidden', minHeight: 220, background: '#e9f1f8' }}>
            <img
              src={getImageUrl(doctor.profileImage)}
              alt={doctor.name || 'Doctor'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = fallbackImage
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div className="tag" style={{ marginBottom: 8 }}>
                  {safeText(doctor.specialization, 'Physiotherapist')}
                </div>
                <h2 style={{ margin: 0 }}>{safeText(doctor.name, 'Doctor')}</h2>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>
                  {safeText(doctor.qualification, 'N/A')} · {safeText(doctor.experience, 'N/A')}
                </div>
              </div>

              <span className={`status-pill status-${String(doctor.status || 'active').toLowerCase()}`}>
                {doctor.status || 'active'}
              </span>
            </div>

            <p style={{ color: 'var(--muted)', margin: 0 }}>{safeText(doctor.bio, 'No bio added')}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLike}
                style={{
                  border: 'none',
                  background: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: liked ? '#e11d48' : 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {liked ? <AiFillHeart size={22} /> : <AiOutlineHeart size={22} />}
                <span>{Number(doctor.likes || 0).toLocaleString()} likes</span>
              </button>

              <Link className="btn btn-dark btn-small" to="/doctors">
                Back to Doctors
              </Link>
            </div>
          </div>
        </div>

        <div className="doctor-grid cols-3">
          <div className="doctor-empty-card">
            <div className="eyebrow">Specialization</div>
            <h3>{safeText(doctor.specialization, 'Physiotherapist')}</h3>
          </div>
          <div className="doctor-empty-card">
            <div className="eyebrow">Qualification</div>
            <h3>{safeText(doctor.qualification, 'N/A')}</h3>
          </div>
          <div className="doctor-empty-card">
            <div className="eyebrow">Experience</div>
            <h3>{safeText(doctor.experience, 'N/A')}</h3>
          </div>
        </div>
      </div>
    </section>
  )
}
