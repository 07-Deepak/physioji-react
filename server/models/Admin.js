import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

export default mongoose.model('Admin', adminSchema)

