import { validationResult } from 'express-validator'
import Resource from '../models/Resource.js'

export const getResources = async (req, res) => {
  const resources = await Resource.find({ createdBy: req.user._id })
  res.json(resources)
}

export const createResource = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const resource = await Resource.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(resource)
}

export const updateResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource || resource.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Resource not found' })
  }

  Object.assign(resource, req.body)
  const updated = await resource.save()
  res.json(updated)
}

export const deleteResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id)
  if (!resource || resource.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Resource not found' })
  }

  await resource.remove()
  res.json({ message: 'Resource deleted' })
}
