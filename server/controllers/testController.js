import { validationResult } from 'express-validator'
import Test from '../models/Test.js'

export const getTests = async (req, res) => {
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

  const [total, tests] = await Promise.all([
    Test.countDocuments(filter),
    Test.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
  ])

  res.json({ tests, total, page: p, limit: l })
}

export const createTest = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const test = await Test.create({
    ...req.body,
    createdBy: req.admin._id,
    isPublished: Boolean(req.body.isPublished),
  })

  res.status(201).json(test)
}

export const updateTest = async (req, res) => {
  const { id } = req.params
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const updated = await Test.findByIdAndUpdate(
    id,
    { ...req.body },
    { new: true }
  )

  if (!updated) {
    return res.status(404).json({ message: 'Test not found' })
  }

  res.json(updated)
}

export const deleteTest = async (req, res) => {
  const { id } = req.params
  const deleted = await Test.findByIdAndDelete(id)
  if (!deleted) {
    return res.status(404).json({ message: 'Test not found' })
  }
  res.json({ message: 'Test deleted' })
}

export const publishTest = async (req, res) => {
  const { id } = req.params
  const test = await Test.findById(id)
  if (!test) return res.status(404).json({ message: 'Test not found' })

  test.isPublished = true
  await test.save()

  res.json(test)
}

export const getTestAnalytics = async (req, res) => {
  // Placeholder analytics until there is a TestAttempt model.
  // Returns safe defaults so UI can render.
  const attempts = 0
  res.json({
    passPercentage: 0,
    attempts,
    topScorers: [],
  })
}

