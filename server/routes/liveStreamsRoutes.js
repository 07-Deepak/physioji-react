import express from 'express'
import requireAuth from '../middleware/authMiddleware.js'
import {
  getPublicLiveStreams,
  getPublicLiveStreamById,
  incrementLiveStreamView,
} from '../controllers/liveStreamsController.js'

const router = express.Router()

router.get('/', requireAuth, getPublicLiveStreams)
router.get('/:id', requireAuth, getPublicLiveStreamById)
router.patch('/:id/view', requireAuth, incrementLiveStreamView)

export default router
