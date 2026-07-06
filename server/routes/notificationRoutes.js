import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js'

const router = express.Router()

router.get('/', authMiddleware, getNotifications)
router.patch('/:id/read', authMiddleware, markNotificationRead)

export default router
