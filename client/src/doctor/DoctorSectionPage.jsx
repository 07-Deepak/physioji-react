export default function DoctorSectionPage({ title, subtitle, children, action }) {
  return (
    <section className="doctor-section">
      <div className="doctor-section-header">
        <div>
          <div className="doctor-eyebrow">Doctor Panel</div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="doctor-section-action">{action}</div> : null}
      </div>
      <div className="doctor-section-body">{children}</div>
    </section>
  )
}
