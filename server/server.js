import dotenv from 'dotenv'
import app from './app.js'
import connectDB from './config/db.js'
import createDefaultAdmin from './utils/createDefaultAdmin.js'
import { startLiveStreamingServer } from './services/liveStreamingServer.js'

dotenv.config()

const PORT = process.env.PORT || 5000

const dbConn = await connectDB()

if (!dbConn) {
  console.warn('MongoDB not connected. API endpoints requiring DB will fail until it is available.')
} else {
  await createDefaultAdmin()
}

await startLiveStreamingServer()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
