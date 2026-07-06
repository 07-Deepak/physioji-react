import Doubt from '../models/Doubt.js'

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

const buildAdminFilter = (query = {}) => {
  const { q = '', category = 'all', subject = 'all', status = 'all' } = query
  const filter = {}
  const search = String(q).trim()

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { askedBy: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject
  if (status && status !== 'all') filter.status = normalizeStatus(status, ALL_STATUSES, 'pending')

  return filter
}

export const getAdminDoubts = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'Latest' } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l
    const filter = buildAdminFilter(req.query)

    const [count, doubts] = await Promise.all([
      Doubt.countDocuments(filter),
      Doubt.find(filter).sort(sortMap[sort] || sortMap.Latest).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count,
      page: p,
      limit: l,
      doubts: doubts.map(serializeDoubt),
    })
  } catch (err) {
    console.error('[getAdminDoubts] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id).lean()
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
    console.error('[getAdminDoubtById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const answerAdminDoubt = async (req, res) => {
  try {
    const answer = String(req.body.answer || '').trim()
    if (!answer) {
      return res.status(400).json({
        success: false,
        message: 'Answer text is required',
      })
    }

    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    doubt.answer = answer
    doubt.status = 'answered'
    doubt.answeredBy = req.admin?._id || null
    doubt.answeredAt = new Date()
    await doubt.save()

    return res.json({
      success: true,
      message: 'Doubt answered successfully',
      doubt: serializeDoubt(doubt.toObject()),
    })
  } catch (err) {
    console.error('[answerAdminDoubt] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminDoubtStatus = async (req, res) => {
  try {
    const nextStatus = normalizeStatus(req.body.status, ALL_STATUSES, 'pending')

    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    doubt.status = nextStatus
    if (nextStatus !== 'answered') {
      doubt.answeredAt = null
      if (nextStatus === 'rejected') {
        doubt.answer = ''
        doubt.answeredBy = null
      }
    }
    await doubt.save()

    return res.json({
      success: true,
      message: 'Doubt status updated successfully',
      doubt: serializeDoubt(doubt.toObject()),
    })
  } catch (err) {
    console.error('[patchAdminDoubtStatus] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const deleteAdminDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      })
    }

    await doubt.deleteOne()
    return res.json({
      success: true,
      message: 'Doubt deleted successfully',
    })
  } catch (err) {
    console.error('[deleteAdminDoubt] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminDoubtsStats = async (req, res) => {
  try {
    const [totalDoubts, pendingDoubts, answeredDoubts, rejectedDoubts, totalViewsAgg, totalLikesAgg, latestDoubt] =
      await Promise.all([
        Doubt.countDocuments({}),
        Doubt.countDocuments({ status: 'pending' }),
        Doubt.countDocuments({ status: 'answered' }),
        Doubt.countDocuments({ status: 'rejected' }),
        Doubt.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
        Doubt.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
        Doubt.findOne({}).sort({ createdAt: -1 }).lean(),
      ])

    return res.json({
      success: true,
      stats: {
        totalDoubts,
        pendingDoubts,
        answeredDoubts,
        rejectedDoubts,
        totalViews: totalViewsAgg?.[0]?.total || 0,
        totalLikes: totalLikesAgg?.[0]?.total || 0,
        latestDoubtDate: latestDoubt?.createdAt || null,
      },
    })
  } catch (err) {
    console.error('[getAdminDoubtsStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
