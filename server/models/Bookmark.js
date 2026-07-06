import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    meta: { type: String },
    field: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const Bookmark = mongoose.model('Bookmark', bookmarkSchema)
export default Bookmark
