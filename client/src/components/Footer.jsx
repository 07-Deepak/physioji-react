import { NavLink } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="footer-links">
        <NavLink to="/about">About</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/privacy">Privacy Policy</NavLink>
        <NavLink to="/terms">Terms of Service</NavLink>
      </div>
      <p>© 2026 Physio Ji. All rights reserved. | Built for medical students, by doctors.</p>
    </footer>
  )
}
