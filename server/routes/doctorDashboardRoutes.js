import express from 'express'
import requireDoctor from '../middleware/doctorAuthMiddleware.js'
import { getDoctorDashboardStats, getDoctorProfile } from '../controllers/doctorDashboardController.js'

const router = express.Router()

router.get('/dashboard/stats', requireDoctor, getDoctorDashboardStats)
router.get('/profile', requireDoctor, getDoctorProfile)

export default router
