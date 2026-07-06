import { useMemo, useState } from 'react'
import { FiEdit2, FiLock, FiUpload, FiUser, FiLogIn } from 'react-icons/fi'
import { useToast } from '../../contexts/ToastContext'
import Loader from '../../components/admin/Loader'
import EmptyState from '../../components/admin/EmptyState'
import FormModal from '../../components/admin/FormModal'
import ConfirmModal from '../../components/admin/ConfirmModal'

const makeActivity = () => {
  return Array.from({ length: 9 }).map((_, i) => ({
    id: `act-${i + 1}`,
    ip: `192.168.${i + 1}.${10 + i}`,
    location: i % 2 === 0 ? 'Mumbai, IN' : 'Delhi, IN',
    time: new Date(Date.now() - i * 7200000).toISOString(),
    device: i % 3 === 0 ? 'Chrome' : i % 3 === 1 ? 'Firefox' : 'Edge',
    action: i % 2 === 0 ? 'Login' : 'Logout',
  }))
}

const formatDate = (iso) => {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

export default function Profile() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)

  const [admin] = useState(() => ({
    fullName: 'Admin User',
    email: 'admin@physioji.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=Admin&radius=10&backgroundColor=14B8A6&textColor=0F766E',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  }))

  const [activity] = useState(() => makeActivity())

  const [editOpen, setEditOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [profileForm, setProfileForm] = useState({ fullName: admin.fullName })
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const stats = useMemo(() => ({
    totalLogins: activity.filter((a) => a.action === 'Login').length,
    lastLogin: admin.lastLogin,
    securityLevel: 'Strong',
  }), [activity, admin.lastLogin])

  if (loading) {
    setTimeout(() => setLoading(false), 400)
    return <Loader text="Loading admin profile..." />
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="kicker">Profile</div>
        <h2>Admin information</h2>
      </div>

      <div className="admin-grid-charts" style={{ gridTemplateColumns: '1.15fr 0.85fr' }}>
        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">Admin Profile</div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <img
                src={admin.avatar}
                alt="Profile"
                style={{ width: 76, height: 76, borderRadius: 26, border: '1px solid rgba(20,184,166,0.25)' }}
              />
              <div>
                <div style={{ fontWeight: 1000, fontSize: 22 }}>{admin.fullName}</div>
                <div className="admin-muted">{admin.email}</div>
                <div className="admin-muted">Role: {admin.role}</div>
                <div className="admin-muted">Last Login: {formatDate(admin.lastLogin)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="button" onClick={() => setEditOpen(true)}>
                <FiEdit2 /> Edit Profile
              </button>
              <button className="btn" type="button" onClick={() => setPwdOpen(true)}>
                <FiLock /> Change Password
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => showToast('Profile image upload (dummy)', 'success')}
              >
                <FiUpload /> Upload Image
              </button>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: 14 }}>
            <div className="admin-panel-title">Login Activity</div>
            {activity.length === 0 ? (
              <EmptyState title="No activity" description="No logins recorded." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Location</th>
                      <th>IP</th>
                      <th>Device</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((a) => (
                      <tr key={a.id}>
                        <td className="admin-td-strong">{a.action}</td>
                        <td>{a.location}</td>
                        <td>{a.ip}</td>
                        <td>{a.device}</td>
                        <td>{formatDate(a.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="admin-panel">
            <div className="admin-panel-title">Account Statistics</div>

            <div className="admin-grid-cards" style={{ gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }}>
              <div className="admin-stats-card">
                <div className="admin-stats-top">
                  <div className="admin-stats-icon"><FiLogIn /></div>
                  <div className="admin-stats-label">Total Logins</div>
                </div>
                <div className="admin-stats-value">{stats.totalLogins}</div>
                <div className="admin-muted">Dummy activity stats</div>
              </div>

              <div className="admin-stats-card">
                <div className="admin-stats-top">
                  <div className="admin-stats-icon"><FiUser /></div>
                  <div className="admin-stats-label">Security</div>
                </div>
                <div className="admin-stats-value" style={{ fontSize: 22 }}>{stats.securityLevel}</div>
                <div className="admin-muted">Change password anytime</div>
              </div>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: 14 }}>
            <div className="admin-panel-title">Admin Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <button className="btn" type="button" onClick={() => setDeleteOpen(true)}>
                <FiLock /> Revoke Sessions (dummy)
              </button>
              <button className="btn" type="button" onClick={() => showToast('Dummy notification (dummy)', 'success')}>
                <span style={{ fontWeight: 900 }}>Test notification</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <FormModal
        open={editOpen}
        title="Edit Profile"
        onClose={() => setEditOpen(false)}
        submitText="Save"
        onSubmit={(e) => {
          e.preventDefault()
          if (!profileForm.fullName.trim()) {
            showToast('Name required', 'error')
            return
          }
          showToast('Profile updated (dummy)', 'success')
          setEditOpen(false)
        }}
        width={760}
      >
        <div className="admin-form-grid">
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Full Name</label>
            <input value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
        </div>
      </FormModal>

      {/* Password modal */}
      <FormModal
        open={pwdOpen}
        title="Change Password"
        onClose={() => setPwdOpen(false)}
        submitText="Update"
        onSubmit={(e) => {
          e.preventDefault()
          if (!pwdForm.newPassword || pwdForm.newPassword !== pwdForm.confirmPassword) {
            showToast('Passwords do not match', 'error')
            return
          }
          showToast('Password changed (dummy)', 'success')
          setPwdOpen(false)
          setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        }}
        width={820}
      >
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Old Password</label>
            <input type="password" value={pwdForm.oldPassword} onChange={(e) => setPwdForm((f) => ({ ...f, oldPassword: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>New Password</label>
            <input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))} />
          </div>
          <div className="admin-field" style={{ gridColumn: 'span 2' }}>
            <label>Confirm Password</label>
            <input type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={deleteOpen}
        danger
        title="Revoke sessions?"
        description="This will revoke all active sessions for the admin (dummy action)."
        confirmText="Revoke"
        cancelText="Cancel"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          showToast('Sessions revoked (dummy)', 'success')
        }}
      />
    </div>
  )
}

