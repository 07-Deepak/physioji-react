import express from 'express'
import { body } from 'express-validator'
import { loginUser, registerUser } from '../controllers/authController.js'
import { getMe } from '../controllers/userController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('username')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[a-zA-Z0-9_.-]{3,30}$/)
      .withMessage('Username must be 3-30 characters and use only letters, numbers, dots, hyphens, or underscores'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  registerUser
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
)

router.get('/me', authMiddleware, getMe)

export default router
