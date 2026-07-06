import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: missing token' })
  }

  const token = authHeader.split(' ')[1]
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({ message: 'Server misconfiguration' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const adminId = decoded.adminId
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized: invalid admin token' })
    }

    const admin = await Admin.findById(adminId)
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized: admin not found' })
    }

    if (admin.role !== 'admin' && admin.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' })
    }

    req.admin = admin
    next()
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired', code: 'TOKEN_EXPIRED' })
    }

    return res.status(401).json({ message: 'Unauthorized', code: 'INVALID_TOKEN' })
  }
}

export default requireAdmin


