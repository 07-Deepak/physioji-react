import DoctorSectionPage from './DoctorSectionPage'
import { FiShield, FiPhone, FiMail } from 'react-icons/fi'

const readDoctor = () => {
  try {
    return JSON.parse(localStorage.getItem('doctor') || 'null')
  } catch {
    return null
  }
}

export default function DoctorProfile() {
  const doctor = readDoctor() || {}

  return (
    <DoctorSectionPage title="My Profile" subtitle="Review your doctor account information and contact details.">
      <div className="doctor-grid cols-2">
        <div className="doctor-profile-card">
          <div className="doctor-eyebrow">Account</div>
          <h3 style={{ marginTop: 10 }}>{doctor?.name || 'Doctor'}</h3>
          <div className="meta-grid" style={{ marginTop: 16 }}>
            <div className="doctor-meta">
              <span>Specialization</span>
              <strong>{doctor?.specialization || 'Physiotherapist'}</strong>
            </div>
            <div className="doctor-meta">
              <span>Qualification</span>
              <strong>{doctor?.qualification || 'N/A'}</strong>
            </div>
            <div className="doctor-meta">
              <span>Experience</span>
              <strong>{doctor?.experience || 'N/A'}</strong>
            </div>
            <div className="doctor-meta">
              <span>Status</span>
              <strong>{doctor?.status || 'active'}</strong>
            </div>
          </div>
        </div>

        <div className="doctor-card">
          <div className="doctor-eyebrow">Contact & Security</div>
          <div className="doctor-grid" style={{ marginTop: 16 }}>
            <div className="doctor-meta">
              <span>
                <FiMail style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Email
              </span>
              <strong>{doctor?.email || 'N/A'}</strong>
            </div>
            <div className="doctor-meta">
              <span>
                <FiPhone style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Phone
              </span>
              <strong>{doctor?.phone || 'N/A'}</strong>
            </div>
            <div className="doctor-meta">
              <span>
                <FiShield style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Role
              </span>
              <strong>{doctor?.role || 'doctor'}</strong>
            </div>
          </div>
        </div>
      </div>
    </DoctorSectionPage>
  )
}
