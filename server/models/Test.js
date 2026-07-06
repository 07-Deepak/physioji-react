import mongoose from 'mongoose'

const testQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], validate: [(arr) => arr.length === 4, 'Options must be exactly 4'], required: true },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
)

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    questions: { type: [testQuestionSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
)

const Test = mongoose.model('Test', testSchema)
export default Test

