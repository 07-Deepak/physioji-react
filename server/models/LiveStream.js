import mongoose from 'mongoose'

const liveStreamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    streamKey: { type: String, required: true, unique: true, index: true, trim: true },
    hlsUrl: { type: String, default: '' },
    streamUrl: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended', 'cancelled'],
      default: 'upcoming',
    },
    isFeatured: { type: Boolean, default: false },
    viewers: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  {
    timestamps: true,
  }
)

liveStreamSchema.index({ title: 'text', description: 'text', category: 1, subject: 1, status: 1, streamKey: 1 })

const LiveStream = mongoose.model('LiveStream', liveStreamSchema)
export default LiveStream
