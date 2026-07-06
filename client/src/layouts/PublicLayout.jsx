import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

export default function PublicLayout() {
  const [isMenuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <Navbar
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <main>
        <ScrollToTop />
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
