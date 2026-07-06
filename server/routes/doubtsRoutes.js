import express from 'express'
import { body, param, query } from 'express-validator'
import requireAuth from '../middleware/authMiddleware.js'
import {
  getPublicDoubts,
  createUserDoubt,
  getPublicDoubtById,
  incrementDoubtView,
  likeDoubt,
} from '../controllers/doubtsController.js'

const router = express.Router()

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getPublicDoubts
)

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('category').notEmpty(),
    body('subject').notEmpty(),
  ],
  createUserDoubt
)

router.get('/:id', [param('id').notEmpty()], getPublicDoubtById)

router.patch('/:id/view', requireAuth, [param('id').notEmpty()], incrementDoubtView)
router.patch('/:id/like', requireAuth, [param('id').notEmpty()], likeDoubt)

export default router
