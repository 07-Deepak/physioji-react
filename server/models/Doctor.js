import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    bio: { type: String, default: '', trim: true },
    profileImage: { type: String, default: '' },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
      index: true,
    },
    role: {
      type: String,
      default: 'doctor',
      immutable: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
)

doctorSchema.pre('save', async function doctorPasswordHash(next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

doctorSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id
    delete ret.password
    delete ret.__v
    return ret
  },
})

doctorSchema.index({ name: 'text', email: 'text', specialization: 'text', qualification: 'text', phone: 'text' })

const Doctor = mongoose.model('Doctor', doctorSchema)
export default Doctor
