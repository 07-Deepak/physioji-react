import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) return <div className="loader" aria-label="Loading profile" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
