import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { validationResult } from 'express-validator'
import LiveStream from '../models/LiveStream.js'
import {
  ensureLiveStreamsUploadDir,
  getLiveStreamFileAbsPath,
  liveStreamsUploadUrlPrefix,
} from '../utils/uploadPaths.js'
import {
  buildLiveStreamPlaybackPath,
  getStreamServerUrl,
  stopLiveStreamTranscoder,
} from '../services/liveStreamingServer.js'

const STATUSES = new Set(['upcoming', 'live', 'ended', 'cancelled'])
const THUMB_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const THUMB_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DEFAULT_APP = process.env.LIVE_STREAM_APP || 'live'

const toUploadUrl = (filename) => `${liveStreamsUploadUrlPrefix}/${filename}`

const safeArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getThumbnailFile = (req) => req.files?.thumbnail?.[0] || null

const deleteIfExists = async (filePath) => {
  if (!filePath) return
  try {
    await fs.rm(filePath, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

const validateThumbnailFile = (file) => {
  if (!file) return { ok: true }
  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase()
  if (!THUMB_EXTENSIONS.has(ext) || !THUMB_MIMES.has(file.mimetype)) {
    return { ok: false, message: 'Invalid thumbnail image type' }
  }
  return { ok: true }
}

const parseStatus = (value) => {
  const normalized = String(value || '').toLowerCase().trim()
  return STATUSES.has(normalized) ? normalized : 'upcoming'
}

const buildPlaybackPath = (streamKey) => buildLiveStreamPlaybackPath(streamKey)

const ensureStatusDates = (liveStream, nextStatus) => {
  if (nextStatus === 'live') {
    liveStream.startedAt = liveStream.startedAt || new Date()
    liveStream.endedAt = null
  } else if (nextStatus === 'ended') {
    liveStream.endedAt = new Date()
  } else if (nextStatus === 'upcoming') {
    liveStream.startedAt = null
    liveStream.endedAt = null
  }
}

const generateStreamKey = () => crypto.randomBytes(12).toString('hex')

const generateUniqueStreamKey = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateStreamKey()
    // eslint-disable-next-line no-await-in-loop
    const exists = await LiveStream.exists({ streamKey: candidate })
    if (!exists) return candidate
  }

  return `${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`
}

const serializeLiveStream = (doc) => {
  if (!doc) return doc
  const streamKey = doc.streamKey || ''
  const hlsUrl = doc.hlsUrl || (streamKey ? buildPlaybackPath(streamKey) : '')

  return {
    ...doc,
    streamKey,
    hlsUrl,
    streamServerUrl: getStreamServerUrl(),
    playbackUrl: hlsUrl,
    streamApp: DEFAULT_APP,
  }
}

const buildFilter = (query = {}) => {
  const {
    q = '',
    category = 'all',
    subject = 'all',
    status = 'all',
    featured = 'all',
    sort = 'Latest',
  } = query

  const filter = {}
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
  if (status && status !== 'all') filter.status = status
  if (featured && featured !== 'all') filter.isFeatured = featured === 'true' || featured === true

  const sortMap = {
    Latest: { createdAt: -1 },
    Oldest: { createdAt: 1 },
    Upcoming: { scheduledAt: 1 },
    Live: { status: 1, scheduledAt: 1 },
  }

  return { filter, sortObj: sortMap[sort] || sortMap.Latest }
}

export const createAdminLiveStream = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    if (!req.admin?._id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: admin context missing',
      })
    }

    await ensureLiveStreamsUploadDir()
    const thumbnailFile = getThumbnailFile(req)
    const thumbnailValidation = validateThumbnailFile(thumbnailFile)
    if (!thumbnailValidation.ok) {
      return res.status(400).json({
        success: false,
        message: thumbnailValidation.message,
      })
    }

    const streamKey = await generateUniqueStreamKey()
    const status = parseStatus(req.body.status || 'upcoming')
    const hlsUrl = buildPlaybackPath(streamKey)

    const liveStream = await LiveStream.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subject: req.body.subject,
      instructor: req.body.instructor,
      streamKey,
      hlsUrl,
      streamUrl: '',
      thumbnail: thumbnailFile ? toUploadUrl(thumbnailFile.filename) : '',
      scheduledAt: req.body.scheduledAt,
      startedAt: status === 'live' ? new Date() : null,
      endedAt: status === 'ended' ? new Date() : null,
      status,
      isFeatured: String(req.body.isFeatured).toLowerCase() === 'true',
      viewers: 0,
      tags: safeArray(req.body.tags),
      createdBy: req.admin._id,
    })

    return res.status(201).json({
      success: true,
      message: 'Live stream created successfully',
      liveStream: serializeLiveStream(liveStream.toObject()),
    })
  } catch (err) {
    console.error('[createAdminLiveStream] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminLiveStreams = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const skip = (p - 1) * l

    const { filter, sortObj } = buildFilter(req.query)

    const [total, liveStreams] = await Promise.all([
      LiveStream.countDocuments(filter),
      LiveStream.find(filter).sort(sortObj).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      liveStreams: liveStreams.map(serializeLiveStream),
    })
  } catch (err) {
    console.error('[getAdminLiveStreams] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminLiveStreamById = async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.id).lean()
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
    console.error('[getAdminLiveStreamById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const updateAdminLiveStream = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const liveStream = await LiveStream.findById(req.params.id)
    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    const thumbnailFile = getThumbnailFile(req)
    if (thumbnailFile) {
      const thumbnailValidation = validateThumbnailFile(thumbnailFile)
      if (!thumbnailValidation.ok) {
        return res.status(400).json({
          success: false,
          message: thumbnailValidation.message,
        })
      }
      await deleteIfExists(getLiveStreamFileAbsPath(liveStream.thumbnail))
      liveStream.thumbnail = toUploadUrl(thumbnailFile.filename)
    }

    liveStream.title = req.body.title
    liveStream.description = req.body.description
    liveStream.category = req.body.category
    liveStream.subject = req.body.subject
    liveStream.instructor = req.body.instructor
    liveStream.scheduledAt = req.body.scheduledAt
    liveStream.status = parseStatus(req.body.status)
    liveStream.isFeatured = String(req.body.isFeatured).toLowerCase() === 'true'
    liveStream.tags = safeArray(req.body.tags)

    if (!liveStream.streamKey) {
      liveStream.streamKey = await generateUniqueStreamKey()
    }

    liveStream.hlsUrl = buildPlaybackPath(liveStream.streamKey)
    ensureStatusDates(liveStream, liveStream.status)

    if (liveStream.streamKey && liveStream.status !== 'live') {
      stopLiveStreamTranscoder(liveStream.streamKey)
    }

    await liveStream.save()

    return res.json({
      success: true,
      message: 'Live stream updated successfully',
      liveStream: serializeLiveStream(liveStream.toObject()),
    })
  } catch (err) {
    console.error('[updateAdminLiveStream] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const deleteAdminLiveStream = async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.id)
    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    await deleteIfExists(getLiveStreamFileAbsPath(liveStream.thumbnail))
    if (liveStream.streamKey) {
      stopLiveStreamTranscoder(liveStream.streamKey)
      await deleteIfExists(getLiveStreamFileAbsPath(`uploads/live-streams/hls/live/${liveStream.streamKey}`))
    }
    await liveStream.deleteOne()

    return res.json({
      success: true,
      message: 'Live stream deleted successfully',
    })
  } catch (err) {
    console.error('[deleteAdminLiveStream] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminLiveStreamStatus = async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.id)
    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    const nextStatus = parseStatus(req.body.status)
    liveStream.status = nextStatus
    ensureStatusDates(liveStream, nextStatus)

    if (liveStream.streamKey && nextStatus !== 'live') {
      stopLiveStreamTranscoder(liveStream.streamKey)
    }

    if (!liveStream.streamKey) {
      liveStream.streamKey = await generateUniqueStreamKey()
    }
    liveStream.hlsUrl = buildPlaybackPath(liveStream.streamKey)

    await liveStream.save()

    return res.json({
      success: true,
      message: 'Live stream status updated successfully',
      liveStream: serializeLiveStream(liveStream.toObject()),
    })
  } catch (err) {
    console.error('[patchAdminLiveStreamStatus] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminLiveStreamFeatured = async (req, res) => {
  try {
    const liveStream = await LiveStream.findById(req.params.id)
    if (!liveStream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      })
    }

    liveStream.isFeatured = String(req.body.isFeatured).toLowerCase() === 'true'
    await liveStream.save()

    return res.json({
      success: true,
      message: 'Live stream featured status updated successfully',
      liveStream: serializeLiveStream(liveStream.toObject()),
    })
  } catch (err) {
    console.error('[patchAdminLiveStreamFeatured] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminLiveStreamsStats = async (req, res) => {
  try {
    const [
      totalLiveStreams,
      upcomingCount,
      liveCount,
      endedCount,
      cancelledCount,
      featuredCount,
      totalViewersAgg,
      nextScheduled,
    ] = await Promise.all([
      LiveStream.countDocuments({}),
      LiveStream.countDocuments({ status: 'upcoming' }),
      LiveStream.countDocuments({ status: 'live' }),
      LiveStream.countDocuments({ status: 'ended' }),
      LiveStream.countDocuments({ status: 'cancelled' }),
      LiveStream.countDocuments({ isFeatured: true }),
      LiveStream.aggregate([{ $group: { _id: null, total: { $sum: '$viewers' } } }]),
      LiveStream.findOne({ status: { $in: ['upcoming', 'live'] } }).sort({ scheduledAt: 1 }).lean(),
    ])

    return res.json({
      success: true,
      stats: {
        totalLiveStreams,
        upcomingCount,
        liveCount,
        endedCount,
        cancelledCount,
        featuredCount,
        totalViewers: totalViewersAgg?.[0]?.total || 0,
        nextScheduledAt: nextScheduled?.scheduledAt || null,
      },
    })
  } catch (err) {
    console.error('[getAdminLiveStreamsStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
