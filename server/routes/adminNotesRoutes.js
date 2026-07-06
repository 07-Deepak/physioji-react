import express from 'express'
import multer from 'multer'
import path from 'path'
import { body, param, query } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import { ensureNotesUploadDir, notesUploadDir } from '../utils/uploadPaths.js'
import {
  createAdminNote,
  getAdminNotes,
  getAdminNoteById,
  updateAdminNote,
  deleteAdminNote,
  patchAdminNoteStatus,
  getAdminNotesStats,
} from '../controllers/adminNotesController.js'

const router = express.Router()

// Ensure directory exists before multer starts writing
ensureNotesUploadDir()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, notesUploadDir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ext || ''
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`)
  },
})

const noteFileExts = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'])
const noteFileMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/plain',
])

const coverImageExts = new Set(['jpg', 'jpeg', 'png', 'webp'])
const coverImageMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const multerFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase()

  if (file.fieldname === 'file') {
    if (!noteFileExts.has(ext) || !noteFileMimes.has(file.mimetype)) {
      return cb(new Error('Invalid note file type'), false)
    }
    return cb(null, true)
  }

  if (file.fieldname === 'coverImage') {
    if (!coverImageExts.has(ext) || !coverImageMimes.has(file.mimetype)) {
      return cb(new Error('Invalid cover image type'), false)
    }
    return cb(null, true)
  }

  return cb(new Error('Unsupported upload field'), false)
}

const upload = multer({
  storage,
  fileFilter: multerFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
})

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
])

router.get('/notes/stats', requireAdmin, getAdminNotesStats)

router.post(
  '/notes',
  requireAdmin,
  uploadFields,
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('semester').notEmpty(),
    body('year').notEmpty(),
    body('author').notEmpty(),
  ],
  createAdminNote
)

router.get(
  '/notes',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getAdminNotes
)

router.get('/notes/:id', requireAdmin, [param('id').notEmpty()], getAdminNoteById)

router.put(
  '/notes/:id',
  requireAdmin,
  uploadFields,
  [
    param('id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
    body('semester').notEmpty(),
    body('year').notEmpty(),
    body('author').notEmpty(),
  ],
  updateAdminNote
)

router.delete('/notes/:id', requireAdmin, [param('id').notEmpty()], deleteAdminNote)

router.patch(
  '/notes/:id/status',
  requireAdmin,
  [
    param('id').notEmpty(),
    body('status').optional(),
  ],
  patchAdminNoteStatus
)

export default router

