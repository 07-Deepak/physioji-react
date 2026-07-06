import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'

import PublicLayout from './layouts/PublicLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/ToastContainer'

import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import DoubtsPublic from './pages/Doubts'
import NotesPublic from './pages/Notes'
import VideosPublic from './pages/Videos'
import TestsPublic from './pages/Tests'
import Doctors from './pages/Doctors'
import DoctorProfilePage from './pages/DoctorProfile'
import ResourcesPublic from './pages/Resources'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Contact from './pages/Contact'
import ForgotPassword from './pages/ForgotPassword'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Dashboard from './pages/Dashboard'
import Bookmarks from './pages/Bookmarks'
import NotificationsPublic from './pages/Notifications'
import ProfilePublic from './pages/Profile'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './layouts/AdminLayout'
import AdminRoute from './routes/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminNotes from './pages/admin/AdminNotes'
import AdminResources from './pages/admin/AdminResources'
import AdminVideos from './pages/admin/AdminVideos'
import AdminLiveStreams from './pages/admin/AdminLiveStreams'
import AdminDoubts from './pages/admin/AdminDoubts'
import AdminDoctors from './pages/admin/Doctors'
import AdminTests from './pages/admin/AdminTests'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminProfile from './pages/admin/AdminProfile'
import AdminSettings from './pages/admin/AdminSettings'

import DoctorLogin from './pages/DoctorLogin'
import DoctorProtectedRoute from './doctor/DoctorProtectedRoute'
import DoctorLayout from './doctor/DoctorLayout'
import DoctorDashboard from './doctor/DoctorDashboard'
import DoctorProfile from './doctor/DoctorProfile'
import DoctorNotes from './doctor/DoctorNotes'
import DoctorVideos from './doctor/DoctorVideos'
import DoctorLiveSessions from './doctor/DoctorLiveSessions'
import DoctorDoubts from './doctor/DoctorDoubts'
import DoctorSettings from './doctor/DoctorSettings'

import { AdminProvider } from './contexts/AdminContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}

function AppContent() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/admin/*" element={<AdminArea />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route
          path="/doctor"
          element={
            <DoctorProtectedRoute>
              <DoctorLayout />
            </DoctorProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="notes" element={<DoctorNotes />} />
          <Route path="videos" element={<DoctorVideos />} />
          <Route path="live-sessions" element={<DoctorLiveSessions />} />
          <Route path="doubts" element={<DoctorDoubts />} />
          <Route path="settings" element={<DoctorSettings />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doubts" element={<DoubtsPublic />} />
          <Route path="/notes" element={<NotesPublic />} />
          <Route path="/videos" element={<VideosPublic />} />
          <Route path="/tests" element={<TestsPublic />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          <Route path="/resources" element={<ResourcesPublic />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Bookmarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPublic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePublic />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function AdminArea() {
  return (
    <AdminProvider>
      <div className="admin-only-root">
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route
            path="dashboard"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route path="users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
          <Route path="notes" element={<AdminRoute><AdminLayout><AdminNotes /></AdminLayout></AdminRoute>} />
          <Route path="resources" element={<AdminRoute><AdminLayout><AdminResources /></AdminLayout></AdminRoute>} />
          <Route path="videos" element={<AdminRoute><AdminLayout><AdminVideos /></AdminLayout></AdminRoute>} />
          <Route path="live-streams" element={<AdminRoute><AdminLayout><AdminLiveStreams /></AdminLayout></AdminRoute>} />
          <Route path="doubts" element={<AdminRoute><AdminLayout><AdminDoubts /></AdminLayout></AdminRoute>} />
          <Route path="doctors" element={<AdminRoute><AdminLayout><AdminDoctors /></AdminLayout></AdminRoute>} />
          <Route path="tests" element={<AdminRoute><AdminLayout><AdminTests /></AdminLayout></AdminRoute>} />
          <Route path="notifications" element={<AdminRoute><AdminLayout><AdminNotifications /></AdminLayout></AdminRoute>} />
          <Route path="profile" element={<AdminRoute><AdminLayout><AdminProfile /></AdminLayout></AdminRoute>} />
          <Route path="settings" element={<AdminRoute><AdminLayout><AdminSettings /></AdminLayout></AdminRoute>} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </div>
    </AdminProvider>
  )
}

export default App
