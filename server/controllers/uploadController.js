import Upload from '../models/Upload.js'

export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  const upload = await Upload.create({
    filename: req.file.filename,
    path: req.file.path,
    mimeType: req.file.mimetype,
    size: req.file.size,
    user: req.user._id,
  })

  res.status(201).json(upload)
}
