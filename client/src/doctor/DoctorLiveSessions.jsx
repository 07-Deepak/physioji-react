import DoctorSectionPage from './DoctorSectionPage'

export default function DoctorLiveSessions() {
  return (
    <DoctorSectionPage
      title="Live Sessions"
      subtitle="Track upcoming or active live sessions from your dedicated doctor workspace."
    >
      <div className="doctor-empty-card">
        <div className="doctor-eyebrow">Live tools</div>
        <h3 style={{ marginTop: 10 }}>Live sessions will appear here</h3>
        <p style={{ marginTop: 8, color: '#a9c0d8' }}>
          The layout is ready for live stream scheduling, monitoring, and session handoff workflows.
        </p>
      </div>
    </DoctorSectionPage>
  )
}
