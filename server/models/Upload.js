import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const Upload = mongoose.model('Upload', uploadSchema)
export default Upload
