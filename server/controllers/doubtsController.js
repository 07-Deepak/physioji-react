import Doubt from '../models/Doubt.js'

const PUBLIC_STATUSES = ['pending', 'answered']
const ALL_STATUSES = ['pending', 'answered', 'rejected']

const safeArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeStatus = (value, allowed = ALL_STATUSES, fallback = 'pending') => {
  const normalized = String(value || '').toLowerCase().trim()
  return allowed.includes(normalized) ? normalized : fallback
}

const buildPublicFilter = (query = {}) => {
  const { q = '', category = 'all', subject = 'all', status = 'all' } = query
  const filter = { status: { $in: PUBLIC_STATUSES } }
  const search = String(q).trim()

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { askedBy: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject
  if (status && status !== 'all') {
    const nextStatus = String(status || '').toLowerCase().trim()
    filter.status = PUBLIC_STATUSES.includes(nextStatus) ? nextStatus : '__none__'
  }

  return filter
}

const sortMap = {
  Latest: { createdAt: -1 },
  Oldest: { createdAt: 1 },
  MostViewed: { views: -1, createdAt: -1 },
  MostLiked: { likes: -1, createdAt: -1 },
}

const serializeDoubt = (doc) => {
  if (!doc) return doc
  return {
    ...doc,
    title: doc.title || 'Untitled Doubt',
    description: doc.description || 'No description available',
    category: doc.category || 'General',
    subject: doc.subject || 'N/A',
    askedBy: doc.askedBy || 'User',
    userName: doc.userName || doc.askedBy || 'User',
    userEmail: doc.userEmail || '',
    status: doc.status || 'pending',
    answer: doc.answer || '',
    views: Number(doc.views || 0),
    likes: Number(doc.likes || 0),
    tags: Array.isArray(doc.tags) ? doc.tags : safeArray(doc.tags),
  }
}

export const getPublicDoubts = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'Latest' } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l
    const filter = buildPublicFilter(req.query)
    const sortObj = sortMap[sort] || sortMap.Latest

    const [count, doubts] = await Promise.all([
      Doubt.countDocuments(filter),
      Doubt.find(filter).sort(sortObj).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count,
      page: p,
      limit: l,
      doubts: doubts.map(serializeDoubt),
    })
  } catch (err) {
    console.error('[getPublicDoubts] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const createUserDoubt = async (req, res) => {
  try {
    const user = req.user
    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Please login to ask your doubt.',
      })
    }

    const title = String(req.body.title || '').trim()
    const description = String(req.body.description || '').trim()
    const category = String(req.body.category || '').trim()
    const subject = String(req.body.subject || '').trim()

    if (!title || !description || !category || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and subject are required',
      })
    }

    const displayName = String(user.fullName || user.name || user.username || 'User').trim() || 'User'
    const doubt = await Doubt.create({
      title,
      description,
      category,
      subject,
      askedBy: displayName,
      user: user._id,
      userName: displayName,
      userEmail: String(user.email || '').toLowerCase(),
      status: 'pending',
      answer: '',
      answeredBy: null,
      answeredAt: null,
      views: 0,
      likes: 0,
      tags: safeArray(req.body.tags),
    })

    return res.status(201).json({
      success: true,
      message: 'Your doubt has been submitted successfully.',
      doubt: serializeDoubt(doubt.toObject()),
    })
  } catch (err) {
    console.error('[createUserDoubt] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getPublicDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findOne({
      _id: req.params.id,
      status: { $in: PUBLIC_STATUSES },
    }).lean()

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    return res.json({
      success: true,
      doubt: serializeDoubt(doubt),
    })
  } catch (err) {
    console.error('[getPublicDoubtById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const incrementDoubtView = async (req, res) => {
  try {
    const doubt = await Doubt.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: PUBLIC_STATUSES },
      },
      { $inc: { views: 1 } },
      { new: true }
    ).lean()

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    return res.json({
      success: true,
      views: Number(doubt.views || 0),
    })
  } catch (err) {
    console.error('[incrementDoubtView] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const likeDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: PUBLIC_STATUSES },
      },
      { $inc: { likes: 1 } },
      { new: true }
    ).lean()

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    return res.json({
      success: true,
      likes: Number(doubt.likes || 0),
    })
  } catch (err) {
    console.error('[likeDoubt] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
