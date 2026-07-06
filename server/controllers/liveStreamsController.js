import LiveStream from '../models/LiveStream.js'
import { buildLiveStreamPlaybackPath } from '../services/liveStreamingServer.js'

const buildFilter = (query = {}) => {
  const {
    q = '',
    category = 'all',
    subject = 'all',
  } = query

  const filter = { status: { $in: ['upcoming', 'live'] } }
  const search = String(q).trim()

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } },
      { streamKey: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject

  return filter
}

const serializeLiveStream = (doc) => {
  if (!doc) return doc
  const streamKey = doc.streamKey || ''
  return {
    ...doc,
    streamKey,
    hlsUrl: doc.hlsUrl || (streamKey ? buildLiveStreamPlaybackPath(streamKey) : ''),
  }
}

export const getPublicLiveStreams = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'Latest',
      featured = 'all',
    } = req.query

    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l
    const filter = buildFilter(req.query)

    if (featured && featured !== 'all') {
      filter.isFeatured = featured === 'true' || featured === true
    }

    const sortMap = {
      Latest: { createdAt: -1 },
      Oldest: { createdAt: 1 },
      Upcoming: { scheduledAt: 1 },
      Live: { status: 1, scheduledAt: 1 },
    }

    const sortObj = { isFeatured: -1, ...(sortMap[sort] || sortMap.Latest) }

    const [total, liveStreams] = await Promise.all([
      LiveStream.countDocuments(filter),
      LiveStream.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(l)
        .lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      liveStreams: liveStreams.map(serializeLiveStream),
    })
  } catch (err) {
    console.error('[getPublicLiveStreams] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getPublicLiveStreamById = async (req, res) => {
  try {
    const liveStream = await LiveStream.findOne({
      _id: req.params.id,
      status: { $in: ['upcoming', 'live'] },
    }).lean()

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    return res.json({
      success: true,
      liveStream: serializeLiveStream(liveStream),
    })
  } catch (err) {
    console.error('[getPublicLiveStreamById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const incrementLiveStreamView = async (req, res) => {
  try {
    const liveStream = await LiveStream.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ['upcoming', 'live'] },
      },
      { $inc: { viewers: 1 } },
      { new: true }
    ).lean()

    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    return res.json({
      success: true,
      viewers: liveStream.viewers || 0,
    })
  } catch (err) {
    console.error('[incrementLiveStreamView] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
