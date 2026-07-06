import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const authMiddleware = async (req, res, next) => {
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
    req.user = await User.findById(decoded.userId).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: invalid token' })
    }
    next()
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired', code: 'TOKEN_EXPIRED' })
    }

    return res.status(401).json({ message: 'Unauthorized', code: 'INVALID_TOKEN' })
  }
}

export default authMiddleware
