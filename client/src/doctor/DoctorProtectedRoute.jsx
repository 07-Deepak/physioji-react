import { Navigate, useLocation } from 'react-router-dom'

export default function DoctorProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('doctorToken') || ''
  const doctor = localStorage.getItem('doctor')

  if (!token || !doctor) {
    return <Navigate to="/doctor-login" replace state={{ from: location.pathname }} />
  }

  return children
}
