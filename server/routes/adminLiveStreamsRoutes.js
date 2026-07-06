import express from 'express'
import multer from 'multer'
import path from 'path'
import { body, param, query } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import {
  ensureLiveStreamsUploadDir,
  liveStreamsUploadDir,
} from '../utils/uploadPaths.js'
import {
  createAdminLiveStream,
  getAdminLiveStreams,
  getAdminLiveStreamById,
  updateAdminLiveStream,
  deleteAdminLiveStream,
  patchAdminLiveStreamStatus,
  patchAdminLiveStreamFeatured,
  getAdminLiveStreamsStats,
} from '../controllers/adminLiveStreamsController.js'

const router = express.Router()

ensureLiveStreamsUploadDir()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, liveStreamsUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`)
  },
})

const thumbExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])
const thumbMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase()

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
  limits: { fileSize: 15 * 1024 * 1024 },
})

const uploadFields = upload.fields([{ name: 'thumbnail', maxCount: 1 }])

router.get('/live-streams/stats', requireAdmin, getAdminLiveStreamsStats)

router.post(
  '/live-streams',
  requireAdmin,
  uploadFields,
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('instructor').notEmpty(),
    body('scheduledAt').notEmpty(),
  ],
  createAdminLiveStream
)

router.get(
  '/live-streams',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getAdminLiveStreams
)

router.get('/live-streams/:id', requireAdmin, [param('id').notEmpty()], getAdminLiveStreamById)

router.put(
  '/live-streams/:id',
  requireAdmin,
  uploadFields,
  [
    param('id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('instructor').notEmpty(),
    body('scheduledAt').notEmpty(),
  ],
  updateAdminLiveStream
)

router.delete('/live-streams/:id', requireAdmin, [param('id').notEmpty()], deleteAdminLiveStream)

router.patch(
  '/live-streams/:id/status',
  requireAdmin,
  [param('id').notEmpty(), body('status').notEmpty()],
  patchAdminLiveStreamStatus
)

router.patch(
  '/live-streams/:id/featured',
  requireAdmin,
  [param('id').notEmpty(), body('isFeatured').optional()],
  patchAdminLiveStreamFeatured
)

export default router
