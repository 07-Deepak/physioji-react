import path from 'path'
import fs from 'fs/promises'
import { validationResult } from 'express-validator'
import Note from '../models/Note.js'
import {
  ensureNotesUploadDir,
  getNoteFileAbsPath,
  notesUploadUrlPrefix,
} from '../utils/uploadPaths.js'

const NOTE_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'])
const NOTE_FILE_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/plain',
])

const toUploadUrl = (filename) => `${notesUploadUrlPrefix}/${filename}`

const normalizeTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean)

  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const getUploadedFile = (req, fieldName) => req.files?.[fieldName]?.[0] || null

const deleteIfExists = async (filePath) => {
  if (!filePath) return

  try {
    await fs.unlink(filePath)
  } catch {
    // Ignore missing files or unlink errors during cleanup.
  }
}

const cleanupUploadedFiles = async (req) => {
  const uploadedFile = getUploadedFile(req, 'file')
  const uploadedCover = getUploadedFile(req, 'coverImage')

  await Promise.all([deleteIfExists(uploadedFile?.path), deleteIfExists(uploadedCover?.path)])
}

const sendValidationError = async (req, res, message, errors = []) => {
  await cleanupUploadedFiles(req)
  return res.status(400).json({
    success: false,
    message,
    errors,
  })
}

const validateUploadedNoteFile = (uploadedFile) => {
  if (!uploadedFile) {
    return { ok: false, message: 'Note file is required' }
  }

  const fileExt = path.extname(uploadedFile.originalname || '').replace('.', '').toLowerCase()
  if (!NOTE_FILE_EXTENSIONS.has(fileExt) || !NOTE_FILE_MIMES.has(uploadedFile.mimetype)) {
    return { ok: false, message: 'Invalid note file type' }
  }

  return { ok: true }
}

export const createAdminNote = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return await sendValidationError(req, res, 'Validation failed', errors.array())
    }

    if (!req.admin?._id) {
      await cleanupUploadedFiles(req)
      return res.status(403).json({
        success: false,
        message: 'Forbidden: admin context missing',
      })
    }

    await ensureNotesUploadDir()

    const uploadedFile = getUploadedFile(req, 'file')
    const uploadedCoverImage = getUploadedFile(req, 'coverImage')

    const fileValidation = validateUploadedNoteFile(uploadedFile)
    if (!fileValidation.ok) {
      return await sendValidationError(req, res, fileValidation.message)
    }

    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subject: req.body.subject,
      semester: req.body.semester,
      year: req.body.year,
      author: req.body.author,
      tags: normalizeTags(req.body.tags),
      coverImage: uploadedCoverImage ? toUploadUrl(uploadedCoverImage.filename) : '',
      fileUrl: toUploadUrl(uploadedFile.filename),
      fileName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.mimetype,
      downloads: 0,
      status: String(req.body.status).toLowerCase() === 'false' ? false : true,
      uploadedBy: req.admin._id,
    }

    const note = await Note.create(payload)

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note,
    })
  } catch (err) {
    await cleanupUploadedFiles(req)
    console.error('[createAdminNote] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminNotes = async (req, res) => {
  try {
    const {
      q = '',
      category = 'all',
      subject = 'all',
      semester = 'all',
      sort = 'Latest',
      page = 1,
      limit = 10,
    } = req.query

    const p = Math.max(Number(page) || 1, 1)
    const l = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const skip = (p - 1) * l

    const filter = {}

    const query = String(q).trim()
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { subject: { $regex: query, $options: 'i' } },
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

    const sortObj = sortMap[sort] || sortMap.Latest

    const [total, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter).sort(sortObj).skip(skip).limit(l).lean(),
    ])

    return res.json({
      success: true,
      count: total,
      page: p,
      limit: l,
      notes,
    })
  } catch (err) {
    console.error('[getAdminNotes] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)

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
    console.error('[getAdminNoteById] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const updateAdminNote = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return await sendValidationError(req, res, 'Validation failed', errors.array())
    }

    const note = await Note.findById(req.params.id)
    if (!note) {
      await cleanupUploadedFiles(req)
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    const uploadedFile = getUploadedFile(req, 'file')
    const uploadedCoverImage = getUploadedFile(req, 'coverImage')

    let nextFileUrl = note.fileUrl
    let nextFileName = note.fileName
    let nextFileSize = note.fileSize
    let nextFileType = note.fileType
    let previousFilePath = null

    if (uploadedFile) {
      const fileValidation = validateUploadedNoteFile(uploadedFile)
      if (!fileValidation.ok) {
        return await sendValidationError(req, res, fileValidation.message)
      }

      previousFilePath = getNoteFileAbsPath(note.fileUrl)
      nextFileUrl = toUploadUrl(uploadedFile.filename)
      nextFileName = uploadedFile.originalname
      nextFileSize = uploadedFile.size
      nextFileType = uploadedFile.mimetype
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subject: req.body.subject,
      semester: req.body.semester,
      year: req.body.year,
      author: req.body.author,
      tags: normalizeTags(req.body.tags),
      status: String(req.body.status).toLowerCase() === 'false' ? false : true,
      fileUrl: nextFileUrl,
      fileName: nextFileName,
      fileSize: nextFileSize,
      fileType: nextFileType,
    }

    if (uploadedCoverImage) {
      updates.coverImage = toUploadUrl(uploadedCoverImage.filename)
    }

    const previousCoverPath = uploadedCoverImage && note.coverImage ? getNoteFileAbsPath(note.coverImage) : null

    Object.assign(note, updates)
    await note.save()

    if (previousFilePath && previousFilePath !== getNoteFileAbsPath(note.fileUrl)) {
      await deleteIfExists(previousFilePath)
    }

    if (previousCoverPath && previousCoverPath !== getNoteFileAbsPath(note.coverImage)) {
      await deleteIfExists(previousCoverPath)
    }

    return res.json({
      success: true,
      message: 'Note updated successfully',
      note,
    })
  } catch (err) {
    await cleanupUploadedFiles(req)
    console.error('[updateAdminNote] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const deleteAdminNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    await Promise.all([
      deleteIfExists(getNoteFileAbsPath(note.fileUrl)),
      note.coverImage ? deleteIfExists(getNoteFileAbsPath(note.coverImage)) : Promise.resolve(),
    ])

    await note.deleteOne()

    return res.json({
      success: true,
      message: 'Note deleted successfully',
    })
  } catch (err) {
    console.error('[deleteAdminNote] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const patchAdminNoteStatus = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      })
    }

    const { status } = req.body
    note.status = typeof status === 'boolean' ? status : String(status).toLowerCase() === 'false' ? false : true

    await note.save()

    return res.json({
      success: true,
      message: 'Note status updated successfully',
      note,
    })
  } catch (err) {
    console.error('[patchAdminNoteStatus] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getAdminNotesStats = async (req, res) => {
  try {
    const [
      totalNotes,
      totalDownloadsAgg,
      pdfCount,
      wordCount,
      excelCount,
      csvCount,
      pptCount,
      lastUploadedNote,
    ] =
      await Promise.all([
        Note.countDocuments({}),
        Note.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
        Note.countDocuments({ fileType: 'application/pdf' }),
        Note.countDocuments({
          fileType: {
            $in: [
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          },
        }),
        Note.countDocuments({
          fileType: {
            $in: [
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
          },
        }),
        Note.countDocuments({
          fileType: {
            $in: ['text/csv', 'application/csv', 'text/plain'],
          },
        }),
        Note.countDocuments({
          fileType: {
            $in: [
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ],
          },
        }),
        Note.findOne({}).sort({ createdAt: -1 }).lean(),
      ])

    const totalDownloads = totalDownloadsAgg?.[0]?.total || 0

    return res.json({
      success: true,
      stats: {
        totalNotes,
        pdfCount,
        wordCount,
        excelCount,
        csvCount,
        pptCount,
        totalDownloads,
        lastUploadedNote: lastUploadedNote || null,
      },
    })
  } catch (err) {
    console.error('[getAdminNotesStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
