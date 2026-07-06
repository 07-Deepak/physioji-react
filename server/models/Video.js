import mongoose from 'mongoose'

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    thumbnail: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    videoName: { type: String, required: true },
    videoSize: { type: Number, required: true },
    videoType: { type: String, required: true },
    views: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  {
    timestamps: true,
  }
)

videoSchema.index({ title: 'text', description: 'text', category: 1, subject: 1 })

const Video = mongoose.model('Video', videoSchema)
export default Video
