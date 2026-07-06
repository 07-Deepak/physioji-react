export default function StaticPage({ title, children }) {
  return (
    <section className="page active" style={{ padding: '90px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '18px', padding: '28px' }}>
        {children}
      </div>
    </section>
  )
}
