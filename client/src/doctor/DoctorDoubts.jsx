import DoctorSectionPage from './DoctorSectionPage'

export default function DoctorDoubts() {
  return (
    <DoctorSectionPage
      title="Assigned Doubts"
      subtitle="Answer patient doubts from your own professional doctor workspace."
    >
      <div className="doctor-empty-card">
        <div className="doctor-eyebrow">Doubts</div>
        <h3 style={{ marginTop: 10 }}>Doubt management will be connected here</h3>
        <p style={{ marginTop: 8, color: '#a9c0d8' }}>
          This screen is set up for future doctor-only doubts handling and response workflows.
        </p>
      </div>
    </DoctorSectionPage>
  )
}
