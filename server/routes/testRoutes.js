import express from 'express'
import { body } from 'express-validator'
import requireAdmin from '../middleware/adminMiddleware.js'
import {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  publishTest,
  getTestAnalytics,
} from '../controllers/testController.js'

const router = express.Router()

router.get('/', requireAdmin, getTests)

router.post(
  '/',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('category').optional().isString(),
    body('questions').optional().isArray(),
    body('isPublished').optional().isBoolean(),
  ],
  createTest
)

router.put(
  '/:id',
  requireAdmin,
  [
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('category').optional().isString(),
    body('questions').optional().isArray(),
    body('isPublished').optional().isBoolean(),
  ],
  updateTest
)

router.delete('/:id', requireAdmin, deleteTest)

router.post('/:id/publish', requireAdmin, publishTest)
router.get('/:id/analytics', requireAdmin, getTestAnalytics)

export default router

