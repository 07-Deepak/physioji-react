import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import SearchInput from '../components/SearchInput'
import SelectInput from '../components/SelectInput'
import { API_BASE_URL, BACKEND_BASE_URL } from '../utils/apiUrl'

const CATEGORIES = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SUBJECTS = ['all', 'Physiotherapy', 'Anatomy', 'MBBS', 'Nursing', 'Dental', 'Pharmacy', 'Other']
const SORTS = ['Latest', 'Oldest', 'MostViewed']
const LIMITS = ['6', '12', '24']

const FALLBACK_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#082f49"/>
          <stop offset="100%" stop-color="#14b8a6"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" rx="40" fill="url(#g)"/>
      <circle cx="790" cy="110" r="84" fill="rgba(255,255,255,0.08)"/>
      <circle cx="150" cy="390" r="130" fill="rgba(255,255,255,0.07)"/>
      <polygon points="430,190 430,350 580,270" fill="rgba(255,255,255,0.88)"/>
      <text x="80" y="468" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700">
        Watch & Learn
      </text>
    </svg>`
  )

const safeNumber = (value) => Number(value || 0)

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const normalizeVideo = (video) => ({
  ...video,
  title: video?.title || 'Untitled Video',
  description: video?.description || 'No description available',
  category: video?.category || 'General',
  subject: video?.subject || 'N/A',
  duration: video?.duration || 'N/A',
  author: video?.author || 'Unknown',
  tags: normalizeTags(video?.tags),
  thumbnail: video?.thumbnail || '',
  videoUrl: video?.videoUrl || '',
  videoType: video?.videoType || 'video/mp4',
  views: safeNumber(video?.views),
  createdAt: video?.createdAt || null,
})

const normalizeLiveStream = (item) => ({
  ...item,
  title: item?.title || 'Untitled Live Stream',
  description: item?.description || 'No description available',
  category: item?.category || 'General',
  subject: item?.subject || 'N/A',
  instructor: item?.instructor || 'Unknown',
  streamKey: item?.streamKey || '',
  hlsUrl: item?.hlsUrl || '',
  thumbnail: item?.thumbnail || '',
  scheduledAt: item?.scheduledAt || null,
  status: item?.status || 'upcoming',
  isFeatured: !!item?.isFeatured,
  viewers: safeNumber(item?.viewers),
  tags: normalizeTags(item?.tags),
  createdAt: item?.createdAt || null,
})

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not scheduled' : date.toLocaleString()
}

const resolveAssetUrl = (value, fallback = '') => {
  if (!value) return fallback
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('//')) return value
  return `${BACKEND_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function LiveHlsPlayer({ src, type = 'application/vnd.apple.mpegurl', onPlay }) {
  const videoRef = useRef(null)

  useEffect(() => {
    let hlsInstance = null
    let cancelled = false
    const video = videoRef.current

    const attach = async () => {
      if (!video || !src) return

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        return
      }

      try {
        const module = await import('hls.js')
        const Hls = module.default
        if (cancelled || !video) return

        if (Hls?.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          })
          hlsInstance.loadSource(src)
          hlsInstance.attachMedia(video)
          return
        }
      } catch {
        // Fallback below
      }

      video.src = src
    }

    attach()

    return () => {
      cancelled = true
      if (hlsInstance) {
        hlsInstance.destroy()
      }
      if (video) {
        video.removeAttribute('src')
        video.load?.()
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      preload="metadata"
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      onPlay={onPlay}
      style={{ width: '100%', maxHeight: 560, borderRadius: 20, background: '#000' }}
    >
      <source src={src} type={type} />
      Your browser does not support the video tag.
    </video>
  )
}

const liveStreamInitial = null

export default function Videos() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const token = localStorage.getItem('physiojiToken') || ''
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('uploaded')
  const [videos, setVideos] = useState([])
  const [liveStreams, setLiveStreams] = useState([])
  const [count, setCount] = useState(0)
  const [liveCount, setLiveCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState('12')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [sort, setSort] = useState('Latest')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedLiveStream, setSelectedLiveStream] = useState(liveStreamInitial)
  const videoViewedIdsRef = useRef(new Set())
  const liveViewedIdsRef = useRef(new Set())

  const pageSize = Number(limit) || 12
  const totalPages = Math.max(Math.ceil((activeTab === 'uploaded' ? count : liveCount) / pageSize), 1)

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      }),
    [token]
  )

  const registerVideoView = async (video) => {
    if (!video?._id || videoViewedIdsRef.current.has(video._id)) return
    videoViewedIdsRef.current.add(video._id)

    try {
      await api.patch(`/videos/${video._id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setVideos((current) =>
        current.map((item) =>
          item._id === video._id ? { ...item, views: safeNumber(item.views) + 1 } : item
        )
      )
      setSelectedVideo((current) =>
        current?._id === video._id ? { ...current, views: safeNumber(current.views) + 1 } : current
      )
    } catch {
      // Non-blocking
    }
  }

  const registerLiveStreamView = async (item) => {
    if (!item?._id || liveViewedIdsRef.current.has(item._id)) return
    liveViewedIdsRef.current.add(item._id)

    try {
      await api.patch(`/live-streams/${item._id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setLiveStreams((current) =>
        current.map((stream) =>
          stream._id === item._id ? { ...stream, viewers: safeNumber(stream.viewers) + 1 } : stream
        )
      )
      setSelectedLiveStream((current) =>
        current?._id === item._id ? { ...current, viewers: safeNumber(current.viewers) + 1 } : current
      )
    } catch {
      // Non-blocking
    }
  }

  const fetchVideos = async () => {
    const response = await api.get('/videos', {
      params: {
        q: query.trim() || undefined,
        category: category === 'all' ? undefined : category,
        subject: subject === 'all' ? undefined : subject,
        sort,
        page,
        limit: pageSize,
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    const rows = response.data?.videos || []
    setVideos(Array.isArray(rows) ? rows.map(normalizeVideo) : [])
    setCount(Number(response.data?.count || 0))
  }

  const fetchLiveStreams = async () => {
    const response = await api.get('/live-streams', {
      params: {
        q: query.trim() || undefined,
        category: category === 'all' ? undefined : category,
        subject: subject === 'all' ? undefined : subject,
        sort,
        page,
        limit: pageSize,
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    const rows = response.data?.liveStreams || []
    setLiveStreams(Array.isArray(rows) ? rows.map(normalizeLiveStream) : [])
    setLiveCount(Number(response.data?.count || 0))
  }

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        setLoading(true)
        if (activeTab === 'uploaded') {
          await fetchVideos()
        } else {
          await fetchLiveStreams()
        }
      } catch (err) {
        if (!alive) return
        showToast(err?.response?.data?.message || err?.message || 'Failed to load content', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (!authLoading && token && user) {
      load()
    } else if (!authLoading) {
      setLoading(false)
    }

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, limit, query, category, subject, sort, token, user, authLoading])

  const handleOpenVideo = (video) => {
    setSelectedLiveStream(null)
    setSelectedVideo(video)
    registerVideoView(video)
  }

  const handleOpenLiveStream = (stream) => {
    setSelectedVideo(null)
    setSelectedLiveStream(stream)
    registerLiveStreamView(stream)
  }

  const closeVideoModal = () => setSelectedVideo(null)
  const closeLiveModal = () => setSelectedLiveStream(null)

  if (authLoading) {
    return (
      <section className="page active" id="page-videos">
        <div style={{ padding: '48px' }}>
          <div className="fcard light" style={{ padding: 24 }}>Loading your session...</div>
        </div>
      </section>
    )
  }

  if (!token || !user) {
    return (
      <section className="page active" id="page-videos">
        <div style={{ padding: '48px' }}>
          <div className="fcard light" style={{ padding: 28, maxWidth: 720, margin: '0 auto', textAlign: 'center', borderRadius: 24 }}>
            <h2 style={{ marginBottom: 10 }}>Please login to watch videos</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 18 }}>
              Video learning content is available only for registered users.
            </p>
            <button className="btn btn-dark" type="button" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </section>
    )
  }

  const videoSrc = selectedVideo?.videoUrl ? resolveAssetUrl(selectedVideo.videoUrl) : ''
  const videoThumbSrc = selectedVideo?.thumbnail ? resolveAssetUrl(selectedVideo.thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB

  const liveThumbSrc = selectedLiveStream?.thumbnail ? resolveAssetUrl(selectedLiveStream.thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB
  const isLiveNow = selectedLiveStream?.status === 'live'
  const livePlaybackUrl = selectedLiveStream?.hlsUrl ? resolveAssetUrl(selectedLiveStream.hlsUrl) : ''

  return (
    <section className="page active" id="page-videos">
      <div className="page-header" style={{ paddingBottom: 8 }}>
        <div className="eyebrow">Watch & Learn</div>
        <h1>Videos</h1>
        <p style={{ color: 'var(--muted)', marginTop: 10, maxWidth: 760 }}>
          Explore expert physiotherapy videos, uploaded sessions, and live learning streams.
        </p>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <button
          className={`btn ${activeTab === 'uploaded' ? 'btn-dark' : 'btn-outline'}`}
          type="button"
          onClick={() => setActiveTab('uploaded')}
        >
          Uploaded Videos
        </button>
        <button
          className={`btn ${activeTab === 'live' ? 'btn-dark' : 'btn-outline'}`}
          type="button"
          onClick={() => setActiveTab('live')}
        >
          Live Streaming
        </button>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 240, flex: '1 1 240px' }}>
          <SearchInput
            placeholder="Search videos..."
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
          />
        </div>
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <SelectInput
            value={category}
            onChange={(e) => {
              setPage(1)
              setCategory(e.target.value)
            }}
            options={CATEGORIES}
          />
        </div>
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <SelectInput
            value={subject}
            onChange={(e) => {
              setPage(1)
              setSubject(e.target.value)
            }}
            options={SUBJECTS}
          />
        </div>
        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
          <SelectInput
            value={sort}
            onChange={(e) => {
              setPage(1)
              setSort(e.target.value)
            }}
            options={SORTS}
          />
        </div>
        <div style={{ minWidth: 120, flex: '0 0 120px' }}>
          <SelectInput
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(e.target.value)
            }}
            options={LIMITS}
          />
        </div>
      </div>

      {activeTab === 'uploaded' ? (
        <div style={{ padding: '0 48px 100px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: 14, color: 'var(--muted)' }}>
            Showing {videos.length} of {count} videos
          </div>

          {loading ? (
            <div className="fcard light" style={{ padding: 24 }}>Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="fcard light" style={{ padding: 24 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>No videos found</strong>
              <div style={{ color: 'var(--muted)' }}>Try adjusting the filters or search terms.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18 }}>
              {videos.map((video) => {
                const thumbSrc = video.thumbnail ? resolveAssetUrl(video.thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB
                return (
                  <article
                    key={video._id}
                    className="fcard light"
                    style={{ minHeight: 'auto', padding: 18, cursor: 'pointer' }}
                    onClick={() => handleOpenVideo(video)}
                  >
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                      <img
                        src={thumbSrc}
                        alt={video.title}
                        style={{
                          width: '100%',
                          height: 190,
                          objectFit: 'cover',
                          borderRadius: 20,
                          border: '1px solid rgba(20,184,166,0.18)',
                          background: '#0f172a',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_THUMB
                        }}
                      />
                      <span className="tag" style={{ position: 'absolute', left: 12, top: 12 }}>
                        {video.category}
                      </span>
                    </div>

                    <h3 style={{ marginBottom: 8 }}>{video.title}</h3>
                    <p style={{ color: 'var(--ink)', marginBottom: 12 }}>{video.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <span className="tag">{video.subject}</span>
                      <span className="tag">{video.duration}</span>
                      <span className="tag">{video.author}</span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 10,
                        fontSize: '0.92rem',
                        color: 'var(--muted)',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>Views</strong>
                        <div>{safeNumber(video.views).toLocaleString()}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>Uploaded</strong>
                        <div>{formatDate(video.createdAt)}</div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {!loading && videos.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <div style={{ color: 'var(--muted)' }}>
                Page {page} of {totalPages}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-dark btn-small"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </button>
                <button
                  className="btn btn-dark btn-small"
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ padding: '0 48px 100px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <div className="fcard light" style={{ padding: 24, minHeight: 440 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <div className="eyebrow">Live Streams</div>
                  <h2 style={{ marginBottom: 8 }}>Watch Live Learning</h2>
                  <p style={{ color: 'var(--ink)', marginBottom: 0 }}>
                    View upcoming sessions or join live physiotherapy streams when they are active.
                  </p>
                </div>
                <span className="tag">
                  {liveStreams.length} sessions
                </span>
              </div>

              {loading ? (
                <div className="fcard light" style={{ padding: 24 }}>Loading live streams...</div>
              ) : liveStreams.length === 0 ? (
                <div
                  style={{
                    minHeight: 340,
                    borderRadius: 24,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    padding: 24,
                    background:
                      'linear-gradient(135deg, rgba(8,47,73,0.95), rgba(20,184,166,0.22)), radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 35%)',
                    border: '1px solid rgba(20,184,166,0.18)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 14px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        marginBottom: 14,
                        fontWeight: 700,
                      }}
                    >
                      No live session right now
                    </div>
                    <h3 style={{ color: '#fff', marginBottom: 10 }}>Upcoming live sessions will appear here.</h3>
                    <p style={{ color: 'rgba(255,255,255,0.76)', marginBottom: 0 }}>
                      Stay tuned for expert-guided physiotherapy sessions and interactive learning streams.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {liveStreams.map((stream) => {
                    const thumbSrc = stream.thumbnail ? resolveAssetUrl(stream.thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB
                    return (
                      <article
                        key={stream._id}
                        className="fcard light"
                        style={{ minHeight: 'auto', padding: 18, cursor: 'pointer' }}
                        onClick={() => handleOpenLiveStream(stream)}
                      >
                        <div style={{ position: 'relative', marginBottom: 14 }}>
                          <img
                            src={thumbSrc}
                            alt={stream.title}
                            style={{
                              width: '100%',
                              height: 175,
                              objectFit: 'cover',
                              borderRadius: 20,
                              border: '1px solid rgba(20,184,166,0.18)',
                              background: '#0f172a',
                            }}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_THUMB
                            }}
                          />
                          {stream.isFeatured ? (
                            <span className="tag" style={{ position: 'absolute', left: 12, top: 12 }}>
                              Featured
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                          <h3 style={{ marginBottom: 6 }}>{stream.title}</h3>
                          <span className="tag">{stream.status}</span>
                        </div>
                        <p style={{ color: 'var(--ink)', marginBottom: 12 }}>{stream.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          <span className="tag">{stream.category}</span>
                          <span className="tag">{stream.subject}</span>
                          <span className="tag">{stream.instructor}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, color: 'var(--muted)' }}>
                          <div>
                            <strong style={{ color: 'var(--ink)' }}>Scheduled</strong>
                            <div>{formatDateTime(stream.scheduledAt)}</div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--ink)' }}>Viewers</strong>
                            <div>{safeNumber(stream.viewers).toLocaleString()}</div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="fcard light" style={{ padding: 24 }}>
              <div className="eyebrow">Next Up</div>
              <h3 style={{ marginBottom: 12 }}>Featured / Upcoming</h3>
              {liveStreams[0] ? (
                <div>
                  <img
                    src={liveStreams[0].thumbnail ? resolveAssetUrl(liveStreams[0].thumbnail, FALLBACK_THUMB) : FALLBACK_THUMB}
                    alt={liveStreams[0].title}
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 18, marginBottom: 14, border: '1px solid rgba(20,184,166,0.18)' }}
                  />
                  <h4 style={{ marginBottom: 8 }}>{liveStreams[0].title}</h4>
                  <p style={{ color: 'var(--ink)' }}>{liveStreams[0].description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <span className="tag">{liveStreams[0].status}</span>
                    {liveStreams[0].isFeatured ? <span className="tag">Featured</span> : null}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No live session scheduled yet.</p>
              )}
            </div>
          </div>

          <div className="fcard light" style={{ padding: 24, marginTop: 18 }}>
            <h3 style={{ marginBottom: 10 }}>Coming Soon</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
              No live session is active at the moment. Live learning sessions will show up here when they go live.
            </p>
          </div>
        </div>
      )}

      {selectedVideo ? (
        <div
          onClick={closeVideoModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 980px)',
              borderRadius: 26,
              background: '#07111f',
              border: '1px solid rgba(20,184,166,0.2)',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div className="eyebrow">Uploaded Video</div>
                <h3 style={{ color: '#fff', marginBottom: 8 }}>{selectedVideo.title}</h3>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {selectedVideo.category} | {selectedVideo.subject} | {selectedVideo.author}
                </div>
              </div>
              <button className="btn btn-outline btn-small" type="button" onClick={closeVideoModal}>
                Close
              </button>
            </div>

            <div style={{ padding: '0 18px 18px' }}>
              <video
                controls
                autoPlay
                preload="metadata"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onPlay={() => registerVideoView(selectedVideo)}
                style={{ width: '100%', maxHeight: 560, borderRadius: 20, background: '#000' }}
              >
                <source src={videoSrc} type={selectedVideo.videoType || 'video/mp4'} />
                Your browser does not support the video tag.
              </video>

              <div className="fcard light" style={{ margin: '14px 0 0', padding: 18 }}>
                <p style={{ marginTop: 0, marginBottom: 12, color: 'var(--ink)' }}>{selectedVideo.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="tag">{selectedVideo.duration}</span>
                  <span className="tag">{safeNumber(selectedVideo.views).toLocaleString()} views</span>
                  <span className="tag">{formatDate(selectedVideo.createdAt)}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <img
                    src={videoThumbSrc}
                    alt="thumbnail"
                    style={{ width: 190, height: 110, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(20,184,166,0.18)' }}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_THUMB
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedLiveStream ? (
        <div
          onClick={closeLiveModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 61,
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 1040px)',
              borderRadius: 26,
              background: '#07111f',
              border: '1px solid rgba(20,184,166,0.2)',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div className="eyebrow">Live Stream</div>
                <h3 style={{ color: '#fff', marginBottom: 8 }}>{selectedLiveStream.title}</h3>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {selectedLiveStream.category} | {selectedLiveStream.subject} | {selectedLiveStream.instructor}
                </div>
              </div>
              <button className="btn btn-outline btn-small" type="button" onClick={closeLiveModal}>
                Close
              </button>
            </div>

            <div style={{ padding: '0 18px 18px' }}>
              {isLiveNow && livePlaybackUrl ? (
                <LiveHlsPlayer
                  src={livePlaybackUrl}
                  onPlay={() => registerLiveStreamView(selectedLiveStream)}
                />
              ) : isLiveNow ? (
                <div
                  style={{
                    minHeight: 340,
                    borderRadius: 24,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    padding: 24,
                    background:
                      'linear-gradient(135deg, rgba(8,47,73,0.95), rgba(20,184,166,0.22)), radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 35%)',
                    border: '1px solid rgba(20,184,166,0.18)',
                  }}
                >
                  <div>
                    <div className="tag" style={{ marginBottom: 14 }}>
                      {selectedLiveStream.status === 'live' ? 'LIVE NOW' : 'Coming Soon'}
                    </div>
                    <h3 style={{ color: '#fff', marginBottom: 10 }}>{selectedLiveStream.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.76)', marginBottom: 0 }}>
                      {selectedLiveStream.status === 'live'
                        ? 'This live session is currently active. The player will connect as soon as the HLS feed is ready.'
                        : 'This live session is scheduled for later. Check back at the scheduled time.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    minHeight: 340,
                    borderRadius: 24,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    padding: 24,
                    background:
                      'linear-gradient(135deg, rgba(8,47,73,0.95), rgba(20,184,166,0.22)), radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 35%)',
                    border: '1px solid rgba(20,184,166,0.18)',
                  }}
                >
                  <div>
                    <div className="tag" style={{ marginBottom: 14 }}>
                      Coming Soon
                    </div>
                    <h3 style={{ color: '#fff', marginBottom: 10 }}>{selectedLiveStream.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.76)', marginBottom: 0 }}>
                      This live session is scheduled for later. Check back at the scheduled time.
                    </p>
                  </div>
                </div>
              )}

              <div className="fcard light" style={{ margin: '14px 0 0', padding: 18 }}>
                <p style={{ marginTop: 0, marginBottom: 12, color: 'var(--ink)' }}>{selectedLiveStream.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="tag">{selectedLiveStream.status}</span>
                  {selectedLiveStream.isFeatured ? <span className="tag">Featured</span> : null}
                  <span className="tag">{safeNumber(selectedLiveStream.viewers).toLocaleString()} viewers</span>
                  <span className="tag">{formatDateTime(selectedLiveStream.scheduledAt)}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <img
                    src={liveThumbSrc}
                    alt="thumbnail"
                    style={{ width: 190, height: 110, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(20,184,166,0.18)' }}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_THUMB
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
