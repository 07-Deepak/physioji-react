import { validationResult } from 'express-validator'
import Bookmark from '../models/Bookmark.js'

export const getBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
  res.json(bookmarks)
}

export const createBookmark = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const bookmark = await Bookmark.create({ ...req.body, user: req.user._id })
  res.status(201).json(bookmark)
}

export const deleteBookmark = async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id)
  if (!bookmark || bookmark.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Bookmark not found' })
  }

  await bookmark.remove()
  res.json({ message: 'Bookmark deleted' })
}
