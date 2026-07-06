import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi'

function Avatar({ name, profileImage }) {
  if (profileImage) {
    return (
      <img
        className="admin-avatar-img"
        src={profileImage}
        alt={`${name} profile`}
        loading="lazy"
      />
    )
  }

  const letter = (name || '?').trim().charAt(0).toUpperCase()
  return <div className="admin-avatar-fallback">{letter}</div>
}

function Badge({ children, variant }) {
  return <span className={`admin-badge admin-badge--${variant}`}>{children}</span>
}

function roleToVariant(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'admin') return 'purple'
  return 'blue'
}

function statusToVariant(status) {
  const s = String(status || '').toLowerCase()
  return s === 'active' ? 'green' : 'red'
}

export default function UserTable({ users, onView, onEdit, onDelete }) {
  if (!Array.isArray(users) || users.length === 0) return null

  return (
    <div className="admin-user-table-wrap">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th className="admin-col-profile">Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined Date</th>
            <th className="admin-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''

            return (
              <tr key={u._id} className="admin-user-row">
                <td className="admin-col-profile">
                  <Avatar name={u.name} profileImage={u.profileImage} />
                </td>
                <td className="admin-td-strong">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <Badge variant={roleToVariant(u.role)}>{u.role}</Badge>
                </td>
                <td>
                  <Badge variant={statusToVariant(u.status)}>{u.status}</Badge>
                </td>
                <td>{joined}</td>
                <td className="admin-col-actions">
                  <div className="admin-user-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label="View"
                      onClick={() => onView?.(u)}
                    >
                      <FiEye />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label="Edit"
                      onClick={() => onEdit?.(u)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label="Delete"
                      onClick={() => onDelete?.(u)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile cards layout */}
      <div className="admin-user-cards">
        {users.map((u) => {
          const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
          return (
            <div key={u._id} className="admin-user-card">
              <div className="admin-user-card-top">
                <Avatar name={u.name} profileImage={u.profileImage} />
                <div className="admin-user-card-meta">
                  <div className="admin-td-strong">{u.name}</div>
                  <div className="admin-muted">{u.email}</div>
                </div>
              </div>

              <div className="admin-user-card-badges">
                <Badge variant={roleToVariant(u.role)}>{u.role}</Badge>
                <Badge variant={statusToVariant(u.status)}>{u.status}</Badge>
              </div>

              <div className="admin-user-card-joined">Joined: {joined}</div>

              <div className="admin-user-card-actions">
                <button type="button" className="admin-btn-mini" onClick={() => onView?.(u)}>
                  View
                </button>
                <button type="button" className="admin-btn-mini" onClick={() => onEdit?.(u)}>
                  Edit
                </button>
                <button type="button" className="admin-btn-mini admin-btn-mini--danger" onClick={() => onDelete?.(u)}>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

