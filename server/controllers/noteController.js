import { validationResult } from 'express-validator'
import Note from '../models/Note.js'

export const getNotes = async (req, res) => {
  const notes = await Note.find({ createdBy: req.user._id })
  res.json(notes)
}

export const createNote = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const note = await Note.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(note)
}

export const updateNote = async (req, res) => {
  const note = await Note.findById(req.params.id)
  if (!note || note.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Note not found' })
  }

  Object.assign(note, req.body)
  const updated = await note.save()
  res.json(updated)
}

export const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.id)
  if (!note || note.createdBy.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Note not found' })
  }

  await note.remove()
  res.json({ message: 'Note deleted' })
}
