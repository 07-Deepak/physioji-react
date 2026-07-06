import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import errorHandler from './middleware/errorHandler.js'
import notesRoutes from './routes/notesRoutes.js'
import doubtsRoutes from './routes/doubtsRoutes.js'
import adminVideosRoutes from './routes/adminVideosRoutes.js'
import videosRoutes from './routes/videosRoutes.js'
import adminLiveStreamsRoutes from './routes/adminLiveStreamsRoutes.js'
import liveStreamsRoutes from './routes/liveStreamsRoutes.js'
import adminDoubtsRoutes from './routes/adminDoubtsRoutes.js'
import adminDoctorsRoutes from './routes/adminDoctorsRoutes.js'
import doctorAuthRoutes from './routes/doctorAuthRoutes.js'
import doctorDashboardRoutes from './routes/doctorDashboardRoutes.js'
import doctorsRoutes from './routes/doctorsRoutes.js'

dotenv.config()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet())
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)
app.options('*', cors({ origin: allowedOrigins, credentials: true }))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }))
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '1mb' }))

try {
  const { default: cookieParser } = await import('cookie-parser')
  app.use(cookieParser(process.env.COOKIE_SECRET))
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
    throw error
  }
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.use(
  '/uploads',
  (req, res, next) => {
    const origin = req.headers.origin
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
    next()
  },
  express.static(path.join(__dirname, 'uploads'))
)
app.use('/api/notes', notesRoutes)
app.use('/api/doubts', doubtsRoutes)
app.use('/api/videos', videosRoutes)
app.use('/api/admin', adminVideosRoutes)
app.use('/api/admin', adminLiveStreamsRoutes)
app.use('/api/admin', adminDoubtsRoutes)
app.use('/api/admin', adminDoctorsRoutes)
app.use('/api/live-streams', liveStreamsRoutes)
app.use('/api/doctors', doctorsRoutes)
app.use('/api/doctor', doctorAuthRoutes)
app.use('/api/doctor', doctorDashboardRoutes)

const routeBasePaths = {
  auth: '/api/auth',
  user: '/api/users',
  note: '/api/notes',
  resource: '/api/resources',
  doubt: '/api/doubts',
  doctor: '/api/doctor',
  contact: '/api/contact',
  bookmark: '/api/bookmarks',
  notification: '/api/notifications',
  upload: '/api/uploads',
  video: '/api/videos',
  test: '/api/tests',
}


const toRouteBasePath = (routeFile) => {
  const routeName = routeFile.replace(/Routes\.js$/, '')
  if (routeBasePaths[routeName]) {
    return routeBasePaths[routeName]
  }

  const kebabName = routeName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return `/api/${kebabName}`
}

const routesDirectory = path.join(__dirname, 'routes')
const routeFiles = (await fs.readdir(routesDirectory))
  .filter((file) => file.endsWith('Routes.js'))
  .filter(
    (file) =>
      file !== 'noteRoutes.js' &&
      file !== 'notesRoutes.js' &&
      file !== 'doubtRoutes.js' &&
      file !== 'doubtsRoutes.js' &&
      file !== 'adminVideosRoutes.js' &&
      file !== 'adminLiveStreamsRoutes.js' &&
      file !== 'adminDoubtsRoutes.js' &&
      file !== 'adminDoctorsRoutes.js' &&
      file !== 'doctorAuthRoutes.js' &&
      file !== 'doctorDashboardRoutes.js' &&
      file !== 'doctorsRoutes.js' &&
      file !== 'videoRoutes.js' &&
      file !== 'videosRoutes.js' &&
      file !== 'liveStreamsRoutes.js'
  )
  .sort()

for (const routeFile of routeFiles) {
  const routePath = path.join(routesDirectory, routeFile)
  const routeModule = await import(pathToFileURL(routePath).href)

  if (routeModule.default) {
    const mountPath = toRouteBasePath(routeFile)
    console.log(`[server] Mounting ${routeFile} at ${mountPath}`)
    app.use(mountPath, routeModule.default)
  }

}

app.use((req, res) => {
  res.status(404).json({
    message: 'API route not found',
    path: req.originalUrl,
  })
})

app.use(errorHandler)

export default app
