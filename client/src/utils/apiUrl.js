export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
export const API_ORIGIN = BACKEND_BASE_URL
export const LIVE_STREAM_SERVER_URL = import.meta.env.VITE_STREAM_SERVER_URL || 'rtmp://localhost:1935/live'

export const getPublicAssetUrl = (value, fallback = '') => {
  if (!value) return fallback
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('//')) {
    return value
  }

  const normalized = String(value)
  return `${BACKEND_BASE_URL}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}
