export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="admin-loader" role="status" aria-live="polite">
      <div className="spinner" />
      {text ? <span>{text}</span> : null}
    </div>
  )
}
