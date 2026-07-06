import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import { generateUniqueUsername, serializeUserProfile } from '../utils/userProfile.js'

export const registerUser = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { fullName, username, email, password, phone, role } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  const safeUsername = await generateUniqueUsername(User, username || fullName || email.split('@')[0])

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const user = await User.create({
    fullName,
    username: safeUsername,
    email,
    password: hashedPassword,
    phone,
    role: role || 'Student',
    accountStatus: 'Active',
    lastLogin: new Date(),
  })

  const token = generateToken(user._id)
  res.status(201).json({
    token,
    user: serializeUserProfile(user),
  })
}

export const loginUser = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // Keep admin accounts out of the normal user login flow
  if (user.role === 'Admin') {
    return res.status(403).json({ message: 'Please login via Admin panel' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }


  user.lastLogin = new Date()
  if (!user.username) {
    user.username = await generateUniqueUsername(User, user.fullName || user.email.split('@')[0])
  }
  if (!user.accountStatus) {
    user.accountStatus = 'Active'
  }
  await user.save()

  const token = generateToken(user._id)
  res.json({
    token,
    user: serializeUserProfile(user),
  })
}
