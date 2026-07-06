export const createUsernameCandidate = (value = '') => {
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  return normalized || `user${Date.now()}`
}

export const generateUniqueUsername = async (User, preferredValue) => {
  const baseUsername = createUsernameCandidate(preferredValue)

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? '' : `${attempt + 1}`
    const username = `${baseUsername}${suffix}`
    const existingUser = await User.exists({ username })

    if (!existingUser) {
      return username
    }
  }

  return `${baseUsername}${Date.now()}`
}

export const ensureProfileDefaults = async (user, UserModel) => {
  let changed = false

  if (!user.username) {
    user.username = UserModel
      ? await generateUniqueUsername(UserModel, user.fullName || user.email?.split('@')[0])
      : createUsernameCandidate(user.fullName || user.email?.split('@')[0])
    changed = true
  }

  if (!user.accountStatus) {
    user.accountStatus = 'Active'
    changed = true
  }

  if (typeof user.bio !== 'string') {
    user.bio = ''
    changed = true
  }

  if (changed) {
    await user.save()
  }

  return user
}

export const serializeUserProfile = (user) => ({
  id: user._id,
  fullName: user.fullName || '',
  username: user.username || '',
  email: user.email || '',
  phone: user.phone || '',
  profileImage: user.profileImage || '',
  bio: user.bio || '',
  role: user.role || 'Student',
  accountStatus: user.accountStatus || 'Active',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLogin: user.lastLogin || null,
})
