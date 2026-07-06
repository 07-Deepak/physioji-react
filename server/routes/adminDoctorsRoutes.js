import express from 'express'
import { body, param, query } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import {
  createAdminDoctor,
  getAdminDoctors,
  getAdminDoctorById,
  updateAdminDoctor,
  deleteAdminDoctor,
  patchAdminDoctorStatus,
  getAdminDoctorsStats,
} from '../controllers/adminDoctorsController.js'

const router = express.Router()

router.get('/doctors/stats', requireAdmin, getAdminDoctorsStats)

router.post(
  '/doctors',
  requireAdmin,
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('phone').notEmpty(),
    body('password').notEmpty(),
    body('specialization').notEmpty(),
    body('qualification').notEmpty(),
    body('experience').notEmpty(),
  ],
  createAdminDoctor
)

router.get(
  '/doctors',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getAdminDoctors
)

router.get('/doctors/:id', requireAdmin, [param('id').notEmpty()], getAdminDoctorById)

router.put('/doctors/:id', requireAdmin, [param('id').notEmpty()], updateAdminDoctor)

router.delete('/doctors/:id', requireAdmin, [param('id').notEmpty()], deleteAdminDoctor)

router.patch(
  '/doctors/:id/status',
  requireAdmin,
  [param('id').notEmpty(), body('status').notEmpty()],
  patchAdminDoctorStatus
)

export default router
