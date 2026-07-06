import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Centralized filesystem + URL paths for uploads.
// Prevents duplicate "server/server" by always deriving from this project's folder structure.

// This file is: <projectRoot>/server/utils/uploadPaths.js
// so server folder is one level up.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..') // => <projectRoot>/server
const uploadsDir = path.join(projectRoot, 'uploads') // => <projectRoot>/server/uploads

export const notesUploadDir = path.join(uploadsDir, 'notes') // => <projectRoot>/server/uploads/notes
export const videosUploadDir = path.join(uploadsDir, 'videos') // => <projectRoot>/server/uploads/videos
export const liveStreamsUploadDir = path.join(uploadsDir, 'live-streams') // => <projectRoot>/server/uploads/live-streams
export const liveStreamsHlsDir = path.join(liveStreamsUploadDir, 'hls') // => <projectRoot>/server/uploads/live-streams/hls

// Express static mount in server/app.js is: app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// where __dirname there is server/. So URL root is /uploads.
export const notesUploadUrlPrefix = '/uploads/notes'
export const videosUploadUrlPrefix = '/uploads/videos'
export const liveStreamsUploadUrlPrefix = '/uploads/live-streams'

export const ensureNotesUploadDir = () => {
  if (!fs.existsSync(notesUploadDir)) {
    fs.mkdirSync(notesUploadDir, { recursive: true })
  }
  return notesUploadDir
}

export const ensureVideosUploadDir = () => {
  if (!fs.existsSync(videosUploadDir)) {
    fs.mkdirSync(videosUploadDir, { recursive: true })
  }
  return videosUploadDir
}

export const ensureLiveStreamsUploadDir = () => {
  if (!fs.existsSync(liveStreamsUploadDir)) {
    fs.mkdirSync(liveStreamsUploadDir, { recursive: true })
  }
  return liveStreamsUploadDir
}

export const ensureLiveStreamsHlsDir = () => {
  if (!fs.existsSync(liveStreamsHlsDir)) {
    fs.mkdirSync(liveStreamsHlsDir, { recursive: true })
  }
  return liveStreamsHlsDir
}

export const getNoteFileAbsPath = (fileUrlOrRel) => {
  if (!fileUrlOrRel) return null

  // Accept either:
  // - /uploads/notes/<file>
  // - uploads/notes/<file>
  // - notes/<file>
  const normalized = String(fileUrlOrRel).replace(/\\/g, '/')

  // Strip leading slash
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized

  // If someone stores full relative root, map it.
  // We only support notes for now.
  if (withoutLeadingSlash.startsWith('uploads/notes/')) {
    const fileName = withoutLeadingSlash.replace('uploads/notes/', '')
    return path.join(notesUploadDir, fileName)
  }

  if (withoutLeadingSlash.startsWith('notes/')) {
    const fileName = withoutLeadingSlash.replace('notes/', '')
    return path.join(notesUploadDir, fileName)
  }

  // If it already looks like <filename>
  return path.join(notesUploadDir, withoutLeadingSlash)
}

export const getVideoFileAbsPath = (fileUrlOrRel) => {
  if (!fileUrlOrRel) return null

  const normalized = String(fileUrlOrRel).replace(/\\/g, '/')
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized

  if (withoutLeadingSlash.startsWith('uploads/videos/')) {
    const fileName = withoutLeadingSlash.replace('uploads/videos/', '')
    return path.join(videosUploadDir, fileName)
  }

  if (withoutLeadingSlash.startsWith('videos/')) {
    const fileName = withoutLeadingSlash.replace('videos/', '')
    return path.join(videosUploadDir, fileName)
  }

  return path.join(videosUploadDir, withoutLeadingSlash)
}

export const getLiveStreamFileAbsPath = (fileUrlOrRel) => {
  if (!fileUrlOrRel) return null

  const normalized = String(fileUrlOrRel).replace(/\\/g, '/')
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized

  if (withoutLeadingSlash.startsWith('uploads/live-streams/')) {
    const fileName = withoutLeadingSlash.replace('uploads/live-streams/', '')
    return path.join(liveStreamsUploadDir, fileName)
  }

  if (withoutLeadingSlash.startsWith('live-streams/')) {
    const fileName = withoutLeadingSlash.replace('live-streams/', '')
    return path.join(liveStreamsUploadDir, fileName)
  }

  return path.join(liveStreamsUploadDir, withoutLeadingSlash)
}

