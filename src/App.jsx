import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider, useToast } from './contexts/ToastContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ToastContainer from './components/ToastContainer'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Doubts from './pages/Doubts'
import Notes from './pages/Notes'
import Tests from './pages/Tests'
import Doctors from './pages/Doctors'
import Resources from './pages/Resources'
import Dashboard from './pages/Dashboard'
import Bookmarks from './pages/Bookmarks'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Contact from './pages/Contact'
import ForgotPassword from './pages/ForgotPassword'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function App() {
  const [isMenuOpen, setMenuOpen] = useState(false)

  const handleToggleMenu = () => setMenuOpen((value) => !value)
  const handleCloseMenu = () => setMenuOpen(false)

  return (
    <ToastProvider>
      <AppContent
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        onCloseMenu={handleCloseMenu}
      />
    </ToastProvider>
  )
}

function AppContent({ isMenuOpen, onToggleMenu, onCloseMenu }) {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="app-shell">
      <Navbar
        isMenuOpen={isMenuOpen}
        onToggleMenu={onToggleMenu}
        onCloseMenu={onCloseMenu}
      />

      <main>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doubts" element={<Doubts />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <ToastContainer onDismiss={dismissToast} toasts={toasts} />
    </div>
  )
}

export default App
