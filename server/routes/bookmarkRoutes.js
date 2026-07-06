import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { getBookmarks, createBookmark, deleteBookmark } from '../controllers/bookmarkController.js'

const router = express.Router()

router.get('/', authMiddleware, getBookmarks)
router.post('/', authMiddleware, createBookmark)
router.delete('/:id', authMiddleware, deleteBookmark)

export default router
