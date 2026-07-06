import path from 'path'
import fs from 'fs/promises'
import Note from '../models/Note.js'
import { getNoteFileAbsPath } from '../utils/uploadPaths.js'

const buildFilter = (queryParams) => {
  const {
    q = '',
    category = 'all',
    subject = 'all',
    semester = 'all',
    sort = 'Latest',
  } = queryParams

  const filter = { status: true }

  const search = String(q).trim()
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ]
  }

  if (category && category !== 'all') filter.category = category
  if (subject && subject !== 'all') filter.subject = subject
  if (semester && semester !== 'all') filter.semester = String(semester)

  const sortMap = {
    Latest: { createdAt: -1 },
    Oldest: { createdAt: 1 },
    MostDownloaded: { downloads: -1 },
  }

  return { filter, sortObj: sortMap[sort] || sortMap.Latest }
}

export const getPublicNotes = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query
    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 12, 1), 50)
    const skip = (p - 1) * l

    const { filter, sortObj } = buildFilter(req.query)

    const [total, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(l)
        .select('title description category subject semester year author tags coverImage fileName fileSize fileType downloads createdAt updatedAt status fileUrl')
        .lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      notes,
    })
  } catch (err) {
    console.error('[getPublicNotes] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getPublicNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, status: true })
      .select('title description category subject semester year author tags coverImage fileName fileSize fileType downloads createdAt updatedAt status fileUrl')
      .lean()

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    return res.json({
      success: true,
      note,
    })
  } catch (err) {
    console.error('[getPublicNoteById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const downloadPublicNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, status: true })
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    const absoluteFile = getNoteFileAbsPath(note.fileUrl)
    if (!absoluteFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      })
    }

    try {
      await fs.access(absoluteFile)
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      })
    }

    note.downloads = (note.downloads || 0) + 1
    await note.save()

    return res.download(absoluteFile, note.fileName || path.basename(absoluteFile))
  } catch (err) {
    console.error('[downloadPublicNote] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
