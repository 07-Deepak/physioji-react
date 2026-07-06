import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not configured')
    return null
  }

  try {
    // Note: mongoose v7+ no longer needs useNewUrlParser/useUnifiedTopology.
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`)
    return null
  }
}

export default connectDB

