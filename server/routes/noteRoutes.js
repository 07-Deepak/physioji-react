import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js'

import publicNotesRoutes from './publicNotesRoutes.js'

const router = express.Router()

// Legacy authenticated user routes (kept as-is)
router.get('/', authMiddleware, getNotes)
router.post('/', authMiddleware, createNote)
router.put('/:id', authMiddleware, updateNote)
router.delete('/:id', authMiddleware, deleteNote)

// Public notes routes required by spec
router.use('/', publicNotesRoutes)

export default router

