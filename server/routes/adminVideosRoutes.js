import express from 'express'
import multer from 'multer'
import path from 'path'
import { body, param, query } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import {
  ensureVideosUploadDir,
  videosUploadDir,
} from '../utils/uploadPaths.js'
import {
  createAdminVideo,
  getAdminVideos,
  getAdminVideoById,
  updateAdminVideo,
  deleteAdminVideo,
  patchAdminVideoStatus,
  getAdminVideosStats,
} from '../controllers/adminVideosController.js'

const router = express.Router()

ensureVideosUploadDir()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`)
  },
})

const videoExtensions = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm'])
const videoMimes = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
])

const thumbExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])
const thumbMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase()

  if (file.fieldname === 'video') {
    if (!videoExtensions.has(ext) || !videoMimes.has(file.mimetype)) {
      return cb(new Error('Invalid video file type'), false)
    }
    return cb(null, true)
  }

  if (file.fieldname === 'thumbnail') {
    if (!thumbExtensions.has(ext) || !thumbMimes.has(file.mimetype)) {
      return cb(new Error('Invalid thumbnail image type'), false)
    }
    return cb(null, true)
  }

  return cb(new Error('Unsupported upload field'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
})

const uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
])

router.get('/videos/stats', requireAdmin, getAdminVideosStats)

router.post(
  '/videos',
  requireAdmin,
  uploadFields,
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('duration').notEmpty(),
    body('author').notEmpty(),
  ],
  createAdminVideo
)

router.get(
  '/videos',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getAdminVideos
)

router.get('/videos/:id', requireAdmin, [param('id').notEmpty()], getAdminVideoById)

router.put(
  '/videos/:id',
  requireAdmin,
  uploadFields,
  [
    param('id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('duration').notEmpty(),
    body('author').notEmpty(),
  ],
  updateAdminVideo
)

router.delete('/videos/:id', requireAdmin, [param('id').notEmpty()], deleteAdminVideo)

router.patch(
  '/videos/:id/status',
  requireAdmin,
  [
    param('id').notEmpty(),
    body('status').optional(),
  ],
  patchAdminVideoStatus
)

export default router
