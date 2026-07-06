import bcrypt from 'bcrypt'
import Doctor from '../models/Doctor.js'
import { serializeDoctorProfile } from '../utils/serializeDoctorProfile.js'

const normalizeStatus = (value) => {
  const next = String(value || '').toLowerCase().trim()
  return next === 'blocked' ? 'blocked' : 'active'
}

const buildFilter = (query = {}) => {
  const { q = '' } = query
  const filter = {}
  const search = String(q).trim()
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { qualification: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
    ]
  }
  return filter
}

export const createAdminDoctor = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, qualification, experience, bio, profileImage } = req.body

    if (!name || !email || !phone || !password || !specialization || !qualification || !experience) {
      return res.status(400).json({
        success: false,
        message: 'name, email, phone, password, specialization, qualification, and experience are required',
      })
    }

    const existing = await Doctor.findOne({ email: String(email).toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      })
    }

    const doctor = await Doctor.create({
      name,
      email,
      phone,
      password,
      specialization,
      qualification,
      experience,
      bio: bio || '',
      profileImage: profileImage || '',
      status: 'active',
      createdBy: req.admin?._id,
    })

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor: serializeDoctorProfile(doctor.toObject()),
    })
  } catch (err) {
    console.error('[createAdminDoctor] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 12, status = 'all' } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l

    const filter = buildFilter(req.query)
    if (status && status !== 'all') filter.status = normalizeStatus(status)

    const [count, doctors] = await Promise.all([
      Doctor.countDocuments(filter),
      Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count,
      page: p,
      limit: l,
      doctors: doctors.map((doctor) => serializeDoctorProfile(doctor)),
    })
  } catch (err) {
    console.error('[getAdminDoctors] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).lean()
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    return res.json({
      success: true,
      doctor: serializeDoctorProfile(doctor),
    })
  } catch (err) {
    console.error('[getAdminDoctorById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const updateAdminDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('+password')
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    const nextEmail = String(req.body.email || doctor.email).toLowerCase().trim()
    if (nextEmail !== doctor.email) {
      const existing = await Doctor.findOne({ email: nextEmail, _id: { $ne: doctor._id } })
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        })
      }
    }

    doctor.name = req.body.name || doctor.name
    doctor.email = nextEmail
    doctor.phone = req.body.phone || doctor.phone
    doctor.specialization = req.body.specialization || doctor.specialization
    doctor.qualification = req.body.qualification || doctor.qualification
    doctor.experience = req.body.experience || doctor.experience
    doctor.bio = req.body.bio ?? doctor.bio
    doctor.profileImage = req.body.profileImage ?? doctor.profileImage

    if (req.body.password) {
      doctor.password = req.body.password
    }

    await doctor.save()

    return res.json({
      success: true,
      message: 'Doctor updated successfully',
      doctor: serializeDoctorProfile(doctor.toObject()),
    })
  } catch (err) {
    console.error('[updateAdminDoctor] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const deleteAdminDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    await doctor.deleteOne()
    return res.json({
      success: true,
      message: 'Doctor deleted successfully',
    })
  } catch (err) {
    console.error('[deleteAdminDoctor] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    doctor.status = normalizeStatus(req.body.status)
    await doctor.save()

    return res.json({
      success: true,
      message: 'Doctor status updated successfully',
      doctor: serializeDoctorProfile(doctor.toObject()),
    })
  } catch (err) {
    console.error('[patchAdminDoctorStatus] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminDoctorsStats = async (req, res) => {
  try {
    const [totalDoctors, activeDoctors, blockedDoctors, latestDoctor] = await Promise.all([
      Doctor.countDocuments({}),
      Doctor.countDocuments({ status: 'active' }),
      Doctor.countDocuments({ status: 'blocked' }),
      Doctor.findOne({}).sort({ createdAt: -1 }).lean(),
    ])

    return res.json({
      success: true,
      stats: {
        totalDoctors,
        activeDoctors,
        blockedDoctors,
        latestDoctorDate: latestDoctor?.createdAt || null,
      },
    })
  } catch (err) {
    console.error('[getAdminDoctorsStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
