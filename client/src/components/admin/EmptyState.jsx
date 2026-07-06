export default function EmptyState({ title = 'Nothing here', description = 'Try again later.' }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-title">{title}</div>
      <div className="admin-empty-desc">{description}</div>
    </div>
  )
}
