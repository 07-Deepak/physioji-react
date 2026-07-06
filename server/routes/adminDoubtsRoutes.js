import express from 'express'
import { body, param, query } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import {
  getAdminDoubts,
  getAdminDoubtById,
  answerAdminDoubt,
  patchAdminDoubtStatus,
  deleteAdminDoubt,
  getAdminDoubtsStats,
} from '../controllers/adminDoubtsController.js'

const router = express.Router()

router.get('/doubts/stats', requireAdmin, getAdminDoubtsStats)

router.get(
  '/doubts',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  getAdminDoubts
)

router.get('/doubts/:id', requireAdmin, [param('id').notEmpty()], getAdminDoubtById)

router.patch(
  '/doubts/:id/answer',
  requireAdmin,
  [param('id').notEmpty(), body('answer').notEmpty()],
  answerAdminDoubt
)

router.patch(
  '/doubts/:id/status',
  requireAdmin,
  [param('id').notEmpty(), body('status').notEmpty()],
  patchAdminDoubtStatus
)

router.delete('/doubts/:id', requireAdmin, [param('id').notEmpty()], deleteAdminDoubt)

export default router
