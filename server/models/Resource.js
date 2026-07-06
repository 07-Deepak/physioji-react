import mongoose from 'mongoose'

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    field: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    author: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const Resource = mongoose.model('Resource', resourceSchema)
export default Resource
