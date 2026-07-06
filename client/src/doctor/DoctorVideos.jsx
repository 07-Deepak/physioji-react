import DoctorSectionPage from './DoctorSectionPage'

export default function DoctorVideos() {
  return (
    <DoctorSectionPage
      title="My Videos"
      subtitle="Review uploaded video content, training assets, and future doctor media tools."
    >
      <div className="doctor-empty-card">
        <div className="doctor-eyebrow">Coming Soon</div>
        <h3 style={{ marginTop: 10 }}>Video workspace placeholder</h3>
        <p style={{ marginTop: 8, color: '#a9c0d8' }}>
          This page is reserved for doctor-specific media management and review tools.
        </p>
      </div>
    </DoctorSectionPage>
  )
}
