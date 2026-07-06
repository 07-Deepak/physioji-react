import express from 'express'
import { body } from 'express-validator'
import { loginDoctor, getDoctorProfile } from '../controllers/doctorAuthController.js'
import requireDoctor from '../middleware/doctorAuthMiddleware.js'

const router = express.Router()

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginDoctor
)

router.get('/me', requireDoctor, getDoctorProfile)

export default router
