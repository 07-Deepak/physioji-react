import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import {
  createUsernameCandidate,
  ensureProfileDefaults,
  generateUniqueUsername,
  serializeUserProfile,
} from '../utils/userProfile.js'

const getAuthenticatedUser = async (userId) => User.findById(userId)

export const getMe = async (req, res) => {
  const user = await getAuthenticatedUser(req.user?._id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  await ensureProfileDefaults(user, User)
  res.json(serializeUserProfile(user))
}

export const updateProfile = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const user = await getAuthenticatedUser(req.user?._id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const { fullName, username, phone, bio, profileImage } = req.body

  if (fullName !== undefined) {
    user.fullName = fullName.trim()
  }

  if (username !== undefined) {
    const nextUsername = createUsernameCandidate(username)
    const usernameOwner = await User.findOne({ username: nextUsername, _id: { $ne: user._id } })

    if (usernameOwner) {
      return res.status(409).json({ message: 'Username is already taken' })
    }

    user.username = nextUsername
  } else if (!user.username) {
    user.username = await generateUniqueUsername(User, user.fullName || user.email.split('@')[0])
  }

  if (phone !== undefined) {
    user.phone = phone.trim()
  }

  if (bio !== undefined) {
    user.bio = bio.trim()
  }

  if (profileImage !== undefined) {
    user.profileImage = profileImage.trim()
  }

  if (!user.accountStatus) {
    user.accountStatus = 'Active'
  }

  const updatedUser = await user.save()
  res.json(serializeUserProfile(updatedUser))
}

export const updatePassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password)
  if (!passwordMatches) {
    return res.status(400).json({ message: 'Current password is incorrect' })
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  await user.save()

  res.json({ message: 'Password updated successfully' })
}

export const updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Profile image is required' })
  }

  const user = await getAuthenticatedUser(req.user?._id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  user.profileImage = `/uploads/profiles/${req.file.filename}`
  const updatedUser = await user.save()

  res.status(201).json({
    message: 'Profile image uploaded successfully',
    user: serializeUserProfile(updatedUser),
  })
}
