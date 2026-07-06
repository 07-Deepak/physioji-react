import express from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { body } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
import { getMe, updateAvatar, updatePassword, updateProfile } from '../controllers/userController.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profiles')

await fs.mkdir(profileUploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    cb(null, `${req.user._id}-${Date.now()}${extension}`)
  },
})

const imageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'))
    }

    return cb(null, true)
  },
})

const profileValidators = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),
  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_.-]{3,30}$/)
    .withMessage('Username must be 3-30 characters and use only letters, numbers, dots, hyphens, or underscores'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Mobile number must be 20 characters or fewer'),
  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be 500 characters or fewer'),
  body('profileImage')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Profile image URL is too long'),
]

const passwordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
]

router.get('/me', authMiddleware, getMe)
router.put('/me', authMiddleware, profileValidators, updateProfile)
router.put('/me/password', authMiddleware, passwordValidators, updatePassword)
router.post('/me/avatar', authMiddleware, imageUpload.single('avatar'), updateAvatar)

export default router
