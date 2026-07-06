import bcrypt from 'bcrypt'
import Doctor from '../models/Doctor.js'
import generateDoctorToken from '../utils/generateDoctorToken.js'
import { serializeDoctorProfile } from '../utils/serializeDoctorProfile.js'

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const doctor = await Doctor.findOne({ email: String(email).toLowerCase().trim() }).select('+password')
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    if (doctor.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Doctor account is blocked',
      })
    }

    const isMatch = await bcrypt.compare(String(password), doctor.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const doctorToken = generateDoctorToken(doctor._id)

    return res.json({
      success: true,
      doctorToken,
      doctor: serializeDoctorProfile(doctor.toObject()),
    })
  } catch (err) {
    console.error('[loginDoctor] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getDoctorProfile = async (req, res) => {
  try {
    if (!req.doctor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    return res.json({
      success: true,
      doctor: serializeDoctorProfile(req.doctor),
    })
  } catch (err) {
    console.error('[getDoctorProfile] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
