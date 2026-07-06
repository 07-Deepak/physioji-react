import Video from '../models/Video.js'

const buildFilter = (query = {}) => {
  const {
    q = '',
    category = 'all',
    subject = 'all',
    sort = 'Latest',
  } = query

  const filter = { status: true }

  const search = String(q).trim()
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject

  const sortMap = {
    Latest: { createdAt: -1 },
    Oldest: { createdAt: 1 },
    MostViewed: { views: -1 },
  }

  return { filter, sortObj: sortMap[sort] || sortMap.Latest }
}

export const getPublicVideos = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l

    const { filter, sortObj } = buildFilter(req.query)

    const [total, videos] = await Promise.all([
      Video.countDocuments(filter),
      Video.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(l)
        .select('title description category subject duration author tags thumbnail videoUrl videoName videoSize videoType views status createdAt updatedAt')
        .lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      videos,
    })
  } catch (err) {
    console.error('[getPublicVideos] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getPublicVideoById = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, status: true })
      .select('title description category subject duration author tags thumbnail videoUrl videoName videoSize videoType views status createdAt updatedAt')
      .lean()

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      })
    }

    return res.json({
      success: true,
      video,
    })
  } catch (err) {
    console.error('[getPublicVideoById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const incrementVideoView = async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, status: true },
      { $inc: { views: 1 } },
      { new: true }
    )

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      })
    }

    return res.json({
      success: true,
      views: video.views || 0,
    })
  } catch (err) {
    console.error('[incrementVideoView] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
