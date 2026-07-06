import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { FiSearch } from 'react-icons/fi'
import api from '../utils/api'
import { BACKEND_BASE_URL } from '../utils/apiUrl'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const PAGE_SIZE = 12
const fallbackImage = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=900&q=80'

const safeText = (value, fallback) => (String(value ?? '').trim() || fallback)

const getImageUrl = (value) => {
  if (!value) return fallbackImage
  if (/^https?:\/\//i.test(value)) return value
  return `${BACKEND_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

const shortBio = (value) => {
  const text = safeText(value, 'No bio added')
  return text.length > 120 ? `${text.slice(0, 117)}...` : text
}

export default function Doctors() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [specialization, setSpecialization] = useState('all')
  const [sort, setSort] = useState('Latest')

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const specializations = useMemo(() => {
    const values = doctors.map((doctor) => doctor.specialization || 'Physiotherapist')
    return ['all', ...new Set(values)]
  }, [doctors])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/doctors', {
        params: {
          q: search || undefined,
          specialization: specialization !== 'all' ? specialization : undefined,
          sort,
          page,
          limit: PAGE_SIZE,
        },
      })

      const items = Array.isArray(response.data?.doctors) ? response.data.doctors : []
      setDoctors(items)
      setCount(Number(response.data?.count || 0))
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to load doctors', 'error')
      setDoctors([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, specialization, sort])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleLike = async (doctor) => {
    if (!user) {
      showToast('Please login to like doctor profile.', 'error')
      navigate('/login')
      return
    }

    try {
      const response = await api.patch(`/doctors/${doctor._id}/like`)
      const liked = Boolean(response.data?.liked)
      const likes = Number(response.data?.likes || 0)

      setDoctors((current) =>
        current.map((item) =>
          item._id === doctor._id
            ? {
                ...item,
                likedByCurrentUser: liked,
                likes,
              }
            : item
        )
      )
    } catch (error) {
      showToast(error?.response?.data?.message || 'Unable to update like', 'error')
    }
  }

  return (
    <section className="page active" id="page-doctors">
      <div className="page-header">
        <div className="eyebrow">Meet the Team</div>
        <h1>Our Expert Doctors</h1>
        <p>Meet our experienced physiotherapy specialists and healthcare educators.</p>
      </div>

      <div className="doctor-toolbar" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr auto auto auto' }}>
        <div className="select-input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiSearch />
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Search doctors..."
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>

        <select
          className="select-input"
          value={specialization}
          onChange={(e) => {
            setPage(1)
            setSpecialization(e.target.value)
          }}
        >
          {specializations.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'All Specializations' : item}
            </option>
          ))}
        </select>

        <select
          className="select-input"
          value={sort}
          onChange={(e) => {
            setPage(1)
            setSort(e.target.value)
          }}
        >
          <option>Latest</option>
          <option>MostLiked</option>
          <option>MostExperienced</option>
          <option>Oldest</option>
        </select>

        <div style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: '0.92rem' }}>
          {count.toLocaleString()} doctor{count === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', color: 'var(--muted)' }}>Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="doctor-empty-card" style={{ marginTop: 18 }}>
          <h3>No doctors found</h3>
          <p style={{ color: 'var(--muted)' }}>Try a different search or filter.</p>
        </div>
      ) : (
        <>
          <div className="doctor-grid">
            {doctors.map((doctor) => {
              const liked = Boolean(doctor?.likedByCurrentUser)
              return (
                <article key={doctor._id} className="doctor-card" style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 74,
                        height: 74,
                        borderRadius: 18,
                        overflow: 'hidden',
                        flex: '0 0 auto',
                        background: 'linear-gradient(135deg, #d8f3ff, #e8fdf5)',
                      }}
                    >
                      <img
                        src={getImageUrl(doctor.profileImage)}
                        alt={doctor.name || 'Doctor'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{safeText(doctor.name, 'Doctor')}</h3>
                          <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                            {safeText(doctor.specialization, 'Physiotherapist')}
                          </div>
                        </div>
                        <span
                          className={`status-pill status-${String(doctor.status || 'active').toLowerCase()}`}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {doctor.status || 'active'}
                        </span>
                      </div>

                      <div style={{ marginTop: 10, color: 'var(--ink)', fontSize: '0.92rem' }}>
                        {safeText(doctor.qualification, 'N/A')} · {safeText(doctor.experience, 'N/A')}
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: 'var(--muted)', minHeight: 44 }}>{shortBio(doctor.bio)}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleLike(doctor)}
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
                      {liked ? <AiFillHeart size={20} /> : <AiOutlineHeart size={20} />}
                      <span>{Number(doctor.likes || 0).toLocaleString()} likes</span>
                    </button>

                    <Link className="btn btn-dark btn-small" to={`/doctors/${doctor._id}`}>
                      View Profile
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 12 }}>
            <div style={{ color: 'var(--muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-dark btn-small" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <button
                className="btn btn-dark btn-small"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
