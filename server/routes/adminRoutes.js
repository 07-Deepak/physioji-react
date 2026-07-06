import express from 'express'
import { body } from 'express-validator'
import {
  adminRegister,
  adminLogin,
  getAdminMe,
  getDashboard,
  getAdminUsers,
  placeholderNotImplemented,
} from '../controllers/adminController.js'
import requireAdmin from '../middleware/adminMiddleware.js'
import adminNotesRoutes from './adminNotesRoutes.js'

const router = express.Router()

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').optional().isString(),
    body('avatar').optional().isString(),
  ],
  adminRegister
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  adminLogin
)

router.get('/me', requireAdmin, getAdminMe)

router.get('/dashboard', requireAdmin, getDashboard)
router.get('/users', requireAdmin, getAdminUsers)

// Videos + Tests (created for this phase)
router.use('/videos', requireAdmin, (req, res, next) => next())
router.use('/videos', (req, res, next) => next())

// Notes (implemented)
router.use('/', adminNotesRoutes)


// Remaining placeholders for this phase
router.get('/resources', requireAdmin, placeholderNotImplemented)
router.get('/doubts', requireAdmin, placeholderNotImplemented)
router.post('/adminAction', requireAdmin, placeholderNotImplemented)
router.get('/notifications', requireAdmin, placeholderNotImplemented)
router.get('/profile', requireAdmin, placeholderNotImplemented)
router.get('/settings', requireAdmin, placeholderNotImplemented)

export default router







