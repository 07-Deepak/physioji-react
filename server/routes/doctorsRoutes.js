import express from 'express'
import requireAuth from '../middleware/authMiddleware.js'
import {
  getPublicDoctors,
  getPublicDoctorById,
  likeDoctorProfile,
} from '../controllers/doctorsController.js'

const router = express.Router()

router.get('/', getPublicDoctors)
router.get('/:id', getPublicDoctorById)
router.patch('/:id/like', requireAuth, likeDoctorProfile)

export default router
