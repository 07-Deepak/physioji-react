import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    role: { type: String, enum: ['Student', 'Admin', 'Doctor'], default: 'Student' },
    accountStatus: { type: String, enum: ['Active', 'Suspended', 'Pending'], default: 'Active' },
    lastLogin: { type: Date },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id
    delete ret.password
    delete ret.__v
    return ret
  },
})

const User = mongoose.model('User', userSchema)
export default User
