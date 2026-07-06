import jwt from 'jsonwebtoken'
import Doctor from '../models/Doctor.js'

const requireDoctor = async (req, res, next) => {
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
    const doctorId = decoded.doctorId
    if (!doctorId) {
      return res.status(401).json({ message: 'Unauthorized: invalid doctor token' })
    }

    const doctor = await Doctor.findById(doctorId).select('-password')
    if (!doctor) {
      return res.status(401).json({ message: 'Unauthorized: doctor not found' })
    }

    if (doctor.status === 'blocked') {
      return res.status(403).json({ message: 'Doctor account is blocked' })
    }

    req.doctor = doctor
    next()
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired', code: 'TOKEN_EXPIRED' })
    }

    return res.status(401).json({ message: 'Unauthorized', code: 'INVALID_TOKEN' })
  }
}

export default requireDoctor
