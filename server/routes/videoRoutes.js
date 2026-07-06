import express from 'express'
import { body } from 'express-validator'
import { getVideos, createVideo, updateVideo, deleteVideo } from '../controllers/videoController.js'
import requireAdmin from '../middleware/adminMiddleware.js'

const router = express.Router()

router.get('/', requireAdmin, getVideos)

router.post(
  '/',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('videoUrl').optional().isString(),
    body('thumbnailUrl').optional().isString(),
    body('category').optional().isString(),
    body('description').optional().isString(),
  ],
  createVideo
)

router.put(
  '/:id',
  requireAdmin,
  [
    body('title').optional().isString(),
    body('videoUrl').optional().isString(),
    body('thumbnailUrl').optional().isString(),
    body('category').optional().isString(),
    body('description').optional().isString(),
  ],
  updateVideo
)

router.delete('/:id', requireAdmin, deleteVideo)

export default router

