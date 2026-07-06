import mongoose from 'mongoose'

const doubtSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    askedBy: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'answered', 'rejected'],
      default: 'pending',
      index: true,
    },
    answer: { type: String, default: '' },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    answeredAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

doubtSchema.index({ title: 'text', description: 'text', category: 1, subject: 1, userName: 1, askedBy: 1 })
doubtSchema.index({ createdAt: -1 })

const Doubt = mongoose.model('Doubt', doubtSchema)
export default Doubt
