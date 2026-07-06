export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="page-header">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
