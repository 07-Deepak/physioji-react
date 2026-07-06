import { validationResult } from 'express-validator'
import Doubt from '../models/Doubt.js'

export const getDoubts = async (req, res) => {
  const doubts = await Doubt.find({ createdBy: req.user._id })
  res.json(doubts)
}

export const createDoubt = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const doubt = await Doubt.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(doubt)
}

export const updateDoubt = async (req, res) => {
  const doubt = await Doubt.findById(req.params.id)
  if (!doubt || doubt.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Doubt not found' })
  }

  Object.assign(doubt, req.body)
  const updated = await doubt.save()
  res.json(updated)
}

export const deleteDoubt = async (req, res) => {
  const doubt = await Doubt.findById(req.params.id)
  if (!doubt || doubt.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Doubt not found' })
  }

  await doubt.remove()
  res.json({ message: 'Doubt deleted' })
}
