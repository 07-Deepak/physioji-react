import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { getResources, createResource, updateResource, deleteResource } from '../controllers/resourceController.js'

const router = express.Router()

router.get('/', authMiddleware, getResources)
router.post('/', authMiddleware, createResource)
router.put('/:id', authMiddleware, updateResource)
router.delete('/:id', authMiddleware, deleteResource)

export default router
