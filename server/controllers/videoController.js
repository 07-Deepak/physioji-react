import { validationResult } from 'express-validator'
import Video from '../models/Video.js'

export const getVideos = async (req, res) => {
  const { q = '', page = 1, limit = 10 } = req.query
  const p = Number(page)
  const l = Number(limit)

  const query = (q || '').toString().trim()
  const filter = query
    ? {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
        ],
      }
    : {}

  const [total, videos] = await Promise.all([
    Video.countDocuments(filter),
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
  ])

  res.json({ videos, total, page: p, limit: l })
}

export const createVideo = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const video = await Video.create({
    ...req.body,
    createdBy: req.admin._id,
  })

  res.status(201).json(video)
}

export const updateVideo = async (req, res) => {
  const { id } = req.params
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const updated = await Video.findByIdAndUpdate(
    id,
    { ...req.body },
    { new: true }
  )

  if (!updated) {
    return res.status(404).json({ message: 'Video not found' })
  }

  res.json(updated)
}

export const deleteVideo = async (req, res) => {
  const { id } = req.params
  const deleted = await Video.findByIdAndDelete(id)
  if (!deleted) {
    return res.status(404).json({ message: 'Video not found' })
  }
  res.json({ message: 'Video deleted' })
}

