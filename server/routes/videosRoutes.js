import express from 'express'
import requireAuth from '../middleware/authMiddleware.js'
import {
  getPublicVideos,
  getPublicVideoById,
  incrementVideoView,
} from '../controllers/videosController.js'

const router = express.Router()

router.get('/', requireAuth, getPublicVideos)
router.get('/:id', requireAuth, getPublicVideoById)
router.patch('/:id/view', requireAuth, incrementVideoView)

export default router
