import bcrypt from 'bcrypt'
import Admin from '../models/Admin.js'
import User from '../models/User.js'
import Note from '../models/Note.js'
import Resource from '../models/Resource.js'
import Doubt from '../models/Doubt.js'
import Notification from '../models/Notification.js'
import generateAdminToken from '../utils/generateAdminToken.js'
import { serializeAdminProfile } from '../utils/serializeAdminProfile.js'

export const adminRegister = async (req, res) => {
  const { name, email, password, avatar, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' })
  }

  const existing = await Admin.findOne({ email })
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await Admin.create({
    name,
    email,
    password: hashedPassword,
    avatar: avatar || '',
    role: role || 'admin',
  })

  const token = generateAdminToken(admin._id)

  res.status(201).json({
    adminToken: token,
    adminData: serializeAdminProfile(admin),
  })
}

export const adminLogin = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const admin = await Admin.findOne({ email }).select('+password')
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const isMatch = await bcrypt.compare(password, admin.password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = generateAdminToken(admin._id)

  res.json({
    adminToken: token,
    adminData: serializeAdminProfile(admin),
  })
}

export const getAdminMe = async (req, res) => {
  const admin = req.admin
  if (!admin) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  res.json({ adminData: serializeAdminProfile(admin) })
}

export const getDashboard = async (req, res) => {
  const [totalUsers, totalNotes, totalResources, totalDoubts, totalNotifications] = await Promise.all([
    User.countDocuments({}),
    Note.countDocuments({}),
    Resource.countDocuments({}),
    Doubt.countDocuments({}),
    Notification.countDocuments({}),
  ])

  res.json({
    totalUsers,
    totalNotes,
    totalResources,
    totalVideos: 0,
    totalTests: 0,
    totalDoubts,

    usersGrowth: 7,
    notesGrowth: 4,
    resourcesGrowth: 6,
    videosGrowth: 0,
    testsGrowth: 0,
    doubtsGrowth: 3,

    usersGrowthSeries: [
      { label: 'W1', value: Math.max(totalUsers - 10, 0) },
      { label: 'W2', value: Math.max(totalUsers - 6, 0) },
      { label: 'W3', value: Math.max(totalUsers - 3, 0) },
      { label: 'W4', value: totalUsers },
    ],
    testsAnalyticsSeries: [
      { label: 'Published', value: 0 },
      { label: 'Draft', value: 0 },
      { label: 'Attempts', value: 0 },
      { label: 'Results', value: 0 },
    ],
    doubtsAnalyticsSeries: [
      { label: 'Open', value: Math.max(totalDoubts - 2, 0) },
      { label: 'Solved', value: Math.min(2, totalDoubts) },
    ],
    uploadAnalyticsSeries: [
      { label: 'Notes', notes: totalNotes, resources: totalResources },
      { label: 'Resources', notes: Math.floor(totalNotes / 2), resources: totalResources },
      { label: 'Doubts', notes: Math.floor(totalNotes / 3), resources: Math.floor(totalResources / 3) },
    ],

    totalNotifications,
  })
}

export const getAdminUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query

    const normalizedQ = (q || '').toString().trim()

    const filter = {}
    if (normalizedQ) {
      filter.$or = [
        { fullName: { $regex: normalizedQ, $options: 'i' } },
        { email: { $regex: normalizedQ, $options: 'i' } },
        { username: { $regex: normalizedQ, $options: 'i' } },
      ]
    }

    const p = Number(page)
    const l = Number(limit)

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .select('-password'),
    ])

    const mappedUsers = (users || []).map((u) => {
      const accountStatus = String(u.accountStatus || '')
      const status = accountStatus === 'Active' ? 'Active' : 'Inactive'

      return {
        _id: u._id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        profileImage: u.profileImage || '',
        status,
        createdAt: u.createdAt,
      }
    })

    return res.json({
      success: true,
      count: total,
      users: mappedUsers,
    })
  } catch (error) {
    console.error('getAdminUsers error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    })
  }
}


export const placeholderNotImplemented = (req, res) => {
  res.status(501).json({ message: 'Not implemented in this phase' })
}


