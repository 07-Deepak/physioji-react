import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminNavbar from '../components/admin/AdminNavbar'

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // close drawer when route changes
  const location = useLocation()
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="admin-app">
      <AdminSidebar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="admin-main">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <div className="admin-content">{children ?? <Outlet />}</div>
      </div>
    </div>
  )
}


