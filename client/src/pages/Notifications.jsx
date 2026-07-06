import { useToast } from '../contexts/ToastContext'

const notifications = [
  {
    icon: '✓',
    title: 'Your doubt was answered!',
    description:
      'Dr. Jaya answered your question about ACL rehabilitation with 3 attachments and detailed explanation.',
    time: '2 hours ago',
  },
  {
    icon: '🔥',
    title: "You're on a 7-day streak!",
    description: 'Keep it up! You’re 3 days away from unlocking the Consistent Learner badge.',
    time: '1 day ago',
  },
  {
    icon: '⭐',
    title: 'New resource: Spinal Cord Anatomy video',
    description: 'A new high-rated video has been added to your favorite topic. 25 minutes of detailed explanations.',
    time: '3 days ago',
  },
]

export default function Notifications() {
  const { showToast } = useToast()

  return (
    <section className="page active" id="page-notifications">
      <div className="page-header">
        <div className="eyebrow">Updates</div>
        <h1>Notifications</h1>
      </div>
      <div className="notifications-panel">
        {notifications.map((notification) => (
          <div key={notification.title} className="notification-item" onClick={() => showToast('Notification clicked', 'success')}>
            <div className="notification-icon">{notification.icon}</div>
            <div className="notification-content">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-desc">{notification.description}</div>
              <div className="notification-time">{notification.time}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
