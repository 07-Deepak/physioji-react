import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },

    // Optional tag list
    tags: { type: [String], default: [] },

    // Author and file fields used by admin/public controllers
    author: { type: String, required: true, trim: true },

    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },

    downloads: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    coverImage: { type: String, default: '' },

    // File metadata
    fileUrl: { type: String, required: true }, // e.g. /uploads/notes/<filename>

    // Which admin uploaded this note
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  {
    timestamps: true,
  }
)

const Note = mongoose.model('Note', noteSchema)
export default Note

