import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

const formatDate = (value) => {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PJ'

const getImageUrl = (image) => {
  if (!image) return ''
  if (image.startsWith('http')) return image
  return `${apiOrigin}${image}`
}

export default function Profile() {
  const { showToast } = useToast()
  const { user, loading, updateProfile, uploadAvatar, updatePassword, refreshUser } = useAuth()
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        username: user.username || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (!loading) {
      refreshUser().catch(() => {})
    }
  }, [loading, refreshUser])

  const avatarUrl = getImageUrl(user?.profileImage)

  const accountRows = useMemo(
    () => [
      ['Full Name', user?.fullName || 'Not available'],
      ['Username', user?.username ? `@${user.username}` : 'Not available'],
      ['Email Address', user?.email || 'Not available'],
      ['Mobile Number', user?.phone || 'Not added'],
      ['Role', user?.role || 'Student'],
      ['Account Status', user?.accountStatus || 'Active'],
      ['User ID', user?.id || 'Not available'],
      ['Date Joined', formatDate(user?.createdAt)],
      ['Last Login', formatDate(user?.lastLogin)],
    ],
    [user]
  )

  const recentActivity = useMemo(
    () => [
      { title: 'Last login', value: formatDate(user?.lastLogin) },
      { title: 'Profile updated', value: formatDate(user?.updatedAt) },
      { title: 'Account created', value: formatDate(user?.createdAt) },
    ],
    [user]
  )

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileForm((current) => ({ ...current, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSavingProfile(true)

    try {
      await updateProfile(profileForm)
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Profile update failed', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Profile photo must be 2 MB or smaller', 'error')
      return
    }

    setUploadingAvatar(true)
    try {
      await uploadAvatar(file)
      showToast('Profile photo updated!', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Profile photo upload failed', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showToast('Password updated successfully!', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Password update failed', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading || !user) {
    return <div className="loader" aria-label="Loading profile" />
  }

  return (
    <section className="page active" id="page-profile">
      <div className="page-header profile-header">
        <div>
          <div className="eyebrow">Account</div>
          <h1>My Profile</h1>
          <p>Manage your public profile, account details, and security settings.</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="profile-avatar-wrap">
            {avatarUrl ? (
              <img className="profile-avatar" src={avatarUrl} alt={user.fullName} />
            ) : (
              <div className="profile-avatar fallback">{getInitials(user.fullName)}</div>
            )}
            <label className="avatar-upload">
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
          </div>
          <h2>{user.fullName}</h2>
          <p>@{user.username || 'student'}</p>
          <span className="status-pill">{user.accountStatus || 'Active'}</span>
          <div className="profile-bio">
            {user.bio || 'Add a short bio so doctors and classmates know a little more about you.'}
          </div>
        </aside>

        <div className="profile-main">
          <div className="profile-panel">
            <div className="panel-heading">
              <h2>Account Information</h2>
            </div>
            <div className="info-grid">
              {accountRows.map(([label, value]) => (
                <div className="info-item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <form className="profile-panel" onSubmit={handleProfileSubmit}>
            <div className="panel-heading">
              <h2>Edit Profile</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="fullName" type="text" value={profileForm.fullName} onChange={handleProfileChange} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input name="username" type="text" value={profileForm.username} onChange={handleProfileChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input name="phone" type="tel" value={profileForm.phone} onChange={handleProfileChange} placeholder="Add mobile number" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" value={profileForm.bio} onChange={handleProfileChange} maxLength={500} placeholder="Write a short bio" />
            </div>
            <button className="btn btn-dark" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <form className="profile-panel" onSubmit={handlePasswordSubmit}>
            <div className="panel-heading">
              <h2>Security Settings</h2>
            </div>
            <div className="form-group">
              <label>Current Password</label>
              <input name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} minLength={8} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} minLength={8} required />
              </div>
            </div>
            <button className="btn btn-outline" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="profile-panel">
            <div className="panel-heading">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div className="activity-item" key={activity.title}>
                  <span>{activity.title}</span>
                  <strong>{activity.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
