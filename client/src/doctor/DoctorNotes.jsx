import DoctorSectionPage from './DoctorSectionPage'

export default function DoctorNotes() {
  return (
    <DoctorSectionPage
      title="My Notes"
      subtitle="This area will show your authored notes, upload history, and related moderation tools."
    >
      <div className="doctor-empty-card">
        <div className="doctor-eyebrow">Coming Soon</div>
        <h3 style={{ marginTop: 10 }}>Notes workspace is ready for expansion</h3>
        <p style={{ marginTop: 8, color: '#a9c0d8' }}>
          We have the separate doctor panel in place. The next integration can connect your authored notes and editorial workflow here.
        </p>
      </div>
    </DoctorSectionPage>
  )
}
