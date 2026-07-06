import RatingStars from './RatingStars'

export default function ResourceCard({ type, title, description, footer }) {
  return (
    <div className="resource-card">
      <div className="resource-thumbnail">{type.icon}</div>
      <div className="resource-body">
        <div className="resource-type">{type.label}</div>
        <div className="resource-title">{title}</div>
        <div className="resource-desc">{description}</div>
        <div className="resource-footer">
          <span>{footer.left}</span>
          <span>{footer.right}</span>
        </div>
      </div>
    </div>
  )
}
