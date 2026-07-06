import { Navigate } from 'react-router-dom'
import { useAdmin } from '../contexts/AdminContext'
import Loader from '../components/admin/Loader'

export default function AdminRoute({ children }) {
  const { admin, loading } = useAdmin()

  if (loading) return <Loader text="Loading admin..." />
  if (!admin) return <Navigate to="/admin/login" replace />

  return children
}


