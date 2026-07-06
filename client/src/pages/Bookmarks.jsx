import { useToast } from '../contexts/ToastContext'

const bookmarks = [
  {
    title: 'Anatomy of the Shoulder Joint',
    type: '📄 Note',
    saved: 'Saved 2 days ago',
    field: 'From: Physiotherapy',
    actions: ['View', 'Remove'],
  },
  {
    title: 'How to diagnose ACL tear?',
    type: '❓ Doubt',
    saved: 'Saved 5 days ago',
    field: 'Answered by Dr. Jaya',
    actions: ['View', 'Remove'],
  },
  {
    title: 'Mock Test: Musculoskeletal System',
    type: '🧪 Test',
    saved: 'Saved 1 week ago',
    field: '50 questions · Your score: 42/50',
    actions: ['Retake', 'Remove'],
  },
]

export default function Bookmarks() {
  const { showToast } = useToast()

  return (
    <section className="page active" id="page-bookmarks">
      <div className="page-header">
        <div className="eyebrow">Saved Content</div>
        <h1>Your Bookmarks</h1>
      </div>
      <div className="bookmark-grid">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.title} className="bookmark-item">
            <div className="bookmark-title">{bookmark.title}</div>
            <div className="bookmark-meta">{bookmark.type} · {bookmark.saved}</div>
            <div className="bookmark-meta" style={{ color: 'var(--ink)' }}>{bookmark.field}</div>
            <div className="bookmark-actions">
              {bookmark.actions.map((action) => (
                <button
                  key={action}
                  className="bookmark-btn"
                  type="button"
                  onClick={() => showToast(`${action} action clicked`, 'success')}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
