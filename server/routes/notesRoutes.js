import express from 'express'
import {
  getPublicNotes,
  getPublicNoteById,
  downloadPublicNote,
} from '../controllers/notesController.js'

const router = express.Router()

router.get('/', getPublicNotes)
router.get('/:id', getPublicNoteById)
router.get('/:id/download', downloadPublicNote)

export default router
