import jwt from 'jsonwebtoken'
import Doctor from '../models/Doctor.js'

const normalizePage = (value, fallback = 1) => Math.max(Number(value) || fallback, 1)
const normalizeLimit = (value, fallback = 12) => Math.min(Math.max(Number(value) || fallback, 1), 48)

const serializeDoctor = (doctor, currentUserId = null) => {
  if (!doctor) return null

  const raw = typeof doctor.toObject === 'function' ? doctor.toObject() : doctor
  const likedBy = Array.isArray(raw.likedBy) ? raw.likedBy.map((id) => String(id)) : []
  const currentUserLike = currentUserId ? likedBy.includes(String(currentUserId)) : false

  delete raw.password
  delete raw.likedBy
  delete raw.__v

  return {
    ...raw,
    id: raw._id,
    likedByCount: likedBy.length,
    likedByCurrentUser: currentUserLike,
  }
}

const getCurrentUserId = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  try {
    if (!process.env.JWT_SECRET) return null
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded?.userId || null
  } catch {
    return null
  }
}

const buildFilter = (query = {}) => {
  const filter = { status: 'active' }
  const q = String(query.q || '').trim()
  const specialization = String(query.specialization || '').trim()

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { specialization: { $regex: q, $options: 'i' } },
      { qualification: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
    ]
  }

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' }
  }

  return filter
}

const buildSort = (sort = 'Latest') => {
  const value = String(sort || 'Latest').toLowerCase()
  if (value === 'mostliked') return { likes: -1, createdAt: -1 }
  if (value === 'oldest') return { createdAt: 1 }
  return { createdAt: -1 }
}

const parseExperience = (value) => {
  const match = String(value || '').match(/(\d+(\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

export const getPublicDoctors = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const page = normalizePage(req.query.page, 1)
    const limit = normalizeLimit(req.query.limit, 12)
    const skip = (page - 1) * limit
    const filter = buildFilter(req.query)
    const sortType = String(req.query.sort || 'Latest').toLowerCase()

    const [count, doctors] = await Promise.all([
      Doctor.countDocuments(filter),
      sortType === 'mostexperienced'
        ? Doctor.find(filter).lean()
        : Doctor.find(filter).sort(buildSort(req.query.sort)).skip(skip).limit(limit).lean(),
    ])

    const sortedDoctors =
      sortType === 'mostexperienced'
        ? doctors
            .slice()
            .sort((a, b) => parseExperience(b.experience) - parseExperience(a.experience) || new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + limit)
        : doctors

    return res.json({
      success: true,
      count,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      doctors: sortedDoctors.map((doctor) => serializeDoctor(doctor, currentUserId)),
    })
  } catch (err) {
    console.error('[getPublicDoctors] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getPublicDoctorById = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const doctor = await Doctor.findOne({ _id: req.params.id, status: 'active' }).lean()

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    return res.json({
      success: true,
      doctor: serializeDoctor(doctor, currentUserId),
    })
  } catch (err) {
    console.error('[getPublicDoctorById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const likeDoctorProfile = async (req, res) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to like doctor profile.',
      })
    }

    const doctor = await Doctor.findOne({ _id: req.params.id, status: 'active' })
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
    }

    const likedBy = Array.isArray(doctor.likedBy) ? doctor.likedBy.map((id) => String(id)) : []
    const hasLiked = likedBy.includes(String(userId))

    if (hasLiked) {
      doctor.likedBy = doctor.likedBy.filter((id) => String(id) !== String(userId))
      doctor.likes = Math.max(0, Number(doctor.likes || 0) - 1)
    } else {
      doctor.likedBy.addToSet(userId)
      doctor.likes = Number(doctor.likes || 0) + 1
    }

    await doctor.save()

    return res.json({
      success: true,
      liked: !hasLiked,
      likes: Number(doctor.likes || 0),
    })
  } catch (err) {
    console.error('[likeDoctorProfile] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
