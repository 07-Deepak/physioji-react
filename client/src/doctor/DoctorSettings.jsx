import DoctorSectionPage from './DoctorSectionPage'

export default function DoctorSettings() {
  return (
    <DoctorSectionPage
      title="Settings"
      subtitle="Manage doctor panel preferences and account-related options."
    >
      <div className="doctor-empty-card">
        <div className="doctor-eyebrow">Settings</div>
        <h3 style={{ marginTop: 10 }}>Professional settings hub</h3>
        <p style={{ marginTop: 8, color: '#a9c0d8' }}>
          This placeholder keeps the panel complete and ready for future doctor settings controls.
        </p>
      </div>
    </DoctorSectionPage>
  )
}
