import path from 'path'
import fs from 'fs/promises'
import { validationResult } from 'express-validator'
import Video from '../models/Video.js'
import {
  ensureVideosUploadDir,
  getVideoFileAbsPath,
  videosUploadUrlPrefix,
} from '../utils/uploadPaths.js'

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm'])
const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
])

const THUMB_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const THUMB_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const toUploadUrl = (filename) => `${videosUploadUrlPrefix}/${filename}`

const safeArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getUploadedFile = (req, fieldName) => req.files?.[fieldName]?.[0] || null

const deleteIfExists = async (filePath) => {
  if (!filePath) return
  try {
    await fs.unlink(filePath)
  } catch {
    // ignore cleanup errors
  }
}

const cleanupUploadedFiles = async (req) => {
  await Promise.all([
    deleteIfExists(getUploadedFile(req, 'video')?.path),
    deleteIfExists(getUploadedFile(req, 'thumbnail')?.path),
  ])
}

const validateVideoFile = (file) => {
  if (!file) {
    return { ok: false, message: 'Video file is required' }
  }

  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase()
  if (!VIDEO_EXTENSIONS.has(ext) || !VIDEO_MIMES.has(file.mimetype)) {
    return { ok: false, message: 'Invalid video file type' }
  }

  return { ok: true }
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
  if (typeof value === 'boolean') return value
  return String(value).toLowerCase() !== 'false'
}

const buildFilter = (query = {}) => {
  const {
    q = '',
    category = 'all',
    subject = 'all',
    status = 'all',
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
      { author: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject
  if (status !== 'all') {
    filter.status = status === 'true' || status === true
  }

  const sortMap = {
    Latest: { createdAt: -1 },
    Oldest: { createdAt: 1 },
    MostViewed: { views: -1 },
  }

  return { filter, sortObj: sortMap[sort] || sortMap.Latest }
}

export const createAdminVideo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await cleanupUploadedFiles(req)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    if (!req.admin?._id) {
      await cleanupUploadedFiles(req)
      return res.status(403).json({
        success: false,
        message: 'Forbidden: admin context missing',
      })
    }

    await ensureVideosUploadDir()

    const videoFile = getUploadedFile(req, 'video')
    const thumbnailFile = getUploadedFile(req, 'thumbnail')

    const videoValidation = validateVideoFile(videoFile)
    if (!videoValidation.ok) {
      await cleanupUploadedFiles(req)
      return res.status(400).json({
        success: false,
        message: videoValidation.message,
      })
    }

    const thumbnailValidation = validateThumbnailFile(thumbnailFile)
    if (!thumbnailValidation.ok) {
      await cleanupUploadedFiles(req)
      return res.status(400).json({
        success: false,
        message: thumbnailValidation.message,
      })
    }

    const video = await Video.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subject: req.body.subject,
      duration: req.body.duration,
      author: req.body.author,
      tags: safeArray(req.body.tags),
      thumbnail: thumbnailFile ? toUploadUrl(thumbnailFile.filename) : '',
      videoUrl: toUploadUrl(videoFile.filename),
      videoName: videoFile.originalname,
      videoSize: videoFile.size,
      videoType: videoFile.mimetype,
      views: 0,
      status: true,
      uploadedBy: req.admin._id,
    })

    return res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video,
    })
  } catch (err) {
    await cleanupUploadedFiles(req)
    console.error('[createAdminVideo] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const skip = (p - 1) * l

    const { filter, sortObj } = buildFilter(req.query)

    const [total, videos] = await Promise.all([
      Video.countDocuments(filter),
      Video.find(filter).sort(sortObj).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      videos,
    })
  } catch (err) {
    console.error('[getAdminVideos] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).lean()
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
    console.error('[getAdminVideoById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const updateAdminVideo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await cleanupUploadedFiles(req)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const video = await Video.findById(req.params.id)
    if (!video) {
      await cleanupUploadedFiles(req)
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      })
    }

    const uploadedVideo = getUploadedFile(req, 'video')
    const uploadedThumbnail = getUploadedFile(req, 'thumbnail')

    let nextVideoUrl = video.videoUrl
    let nextVideoName = video.videoName
    let nextVideoSize = video.videoSize
    let nextVideoType = video.videoType

    if (uploadedVideo) {
      const validation = validateVideoFile(uploadedVideo)
      if (!validation.ok) {
        await cleanupUploadedFiles(req)
        return res.status(400).json({
          success: false,
          message: validation.message,
        })
      }

      await deleteIfExists(getVideoFileAbsPath(video.videoUrl))
      nextVideoUrl = toUploadUrl(uploadedVideo.filename)
      nextVideoName = uploadedVideo.originalname
      nextVideoSize = uploadedVideo.size
      nextVideoType = uploadedVideo.mimetype
    }

    if (uploadedThumbnail) {
      const validation = validateThumbnailFile(uploadedThumbnail)
      if (!validation.ok) {
        await cleanupUploadedFiles(req)
        return res.status(400).json({
          success: false,
          message: validation.message,
        })
      }

      await deleteIfExists(getVideoFileAbsPath(video.thumbnail))
    }

    video.title = req.body.title
    video.description = req.body.description
    video.category = req.body.category
    video.subject = req.body.subject
    video.duration = req.body.duration
    video.author = req.body.author
    video.tags = safeArray(req.body.tags)
    video.status = parseStatus(req.body.status)
    video.videoUrl = nextVideoUrl
    video.videoName = nextVideoName
    video.videoSize = nextVideoSize
    video.videoType = nextVideoType

    if (uploadedThumbnail) {
      video.thumbnail = toUploadUrl(uploadedThumbnail.filename)
    }

    await video.save()

    return res.json({
      success: true,
      message: 'Video updated successfully',
      video,
    })
  } catch (err) {
    await cleanupUploadedFiles(req)
    console.error('[updateAdminVideo] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const deleteAdminVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      })
    }

    await Promise.all([
      deleteIfExists(getVideoFileAbsPath(video.videoUrl)),
      video.thumbnail ? deleteIfExists(getVideoFileAbsPath(video.thumbnail)) : Promise.resolve(),
    ])

    await video.deleteOne()

    return res.json({
      success: true,
      message: 'Video deleted successfully',
    })
  } catch (err) {
    console.error('[deleteAdminVideo] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminVideoStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      })
    }

    video.status = parseStatus(req.body.status)
    await video.save()

    return res.json({
      success: true,
      message: 'Video status updated successfully',
      video,
    })
  } catch (err) {
    console.error('[patchAdminVideoStatus] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminVideosStats = async (req, res) => {
  try {
    const [totalVideos, activeVideos, inactiveVideos, viewsAgg, lastUploaded] = await Promise.all([
      Video.countDocuments({}),
      Video.countDocuments({ status: true }),
      Video.countDocuments({ status: false }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Video.findOne({}).sort({ createdAt: -1 }).lean(),
    ])

    return res.json({
      success: true,
      stats: {
        totalVideos,
        activeVideos,
        inactiveVideos,
        totalViews: viewsAgg?.[0]?.total || 0,
        lastUploaded: lastUploaded || null,
      },
    })
  } catch (err) {
    console.error('[getAdminVideosStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
