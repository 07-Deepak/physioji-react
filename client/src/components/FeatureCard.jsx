export default function FeatureCard({ variant = 'light', icon, title, description }) {
  return (
    <div className={`fcard ${variant}`}>
      <div className="fcard-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
