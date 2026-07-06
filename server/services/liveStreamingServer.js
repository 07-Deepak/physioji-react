import path from 'path'
import fs from 'fs/promises'
import { spawn } from 'child_process'
import NodeMediaServer from 'node-media-server'
import ffmpegStatic from 'ffmpeg-static'
import LiveStream from '../models/LiveStream.js'
import {
  ensureLiveStreamsHlsDir,
  liveStreamsHlsDir,
  liveStreamsUploadUrlPrefix,
} from '../utils/uploadPaths.js'

let nmsInstance = null
const activeTranscoders = new Map()

export const buildLiveStreamPlaybackPath = (streamKey) =>
  `${liveStreamsUploadUrlPrefix}/hls/live/${streamKey}/index.m3u8`

export const getStreamServerUrl = () => {
  const host = process.env.LIVE_STREAM_HOST || 'localhost'
  const port = process.env.LIVE_STREAM_RTMP_PORT || '1935'
  const app = process.env.LIVE_STREAM_APP || 'live'
  return `rtmp://${host}:${port}/${app}`
}

const getStreamKeyFromPath = (streamPath = '') => {
  const cleanPath = String(streamPath).replace(/^\/+/, '')
  const parts = cleanPath.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

const setStreamLive = async (streamKey) => {
  if (!streamKey) return null

  const liveStream = await LiveStream.findOne({ streamKey }).select('_id status startedAt endedAt streamKey')
  if (!liveStream) return null

  liveStream.status = 'live'
  liveStream.startedAt = liveStream.startedAt || new Date()
  liveStream.endedAt = null
  await liveStream.save()
  return liveStream
}

const setStreamEnded = async (streamKey) => {
  if (!streamKey) return null

  const liveStream = await LiveStream.findOne({ streamKey }).select('_id status endedAt streamKey')
  if (!liveStream) return null

  liveStream.status = liveStream.status === 'cancelled' ? 'cancelled' : 'ended'
  liveStream.endedAt = new Date()
  await liveStream.save()
  return liveStream
}

const getStreamOutputDir = (streamKey) => path.join(liveStreamsHlsDir, 'live', streamKey)

const ensureOutputDir = async (streamKey) => {
  const outputDir = getStreamOutputDir(streamKey)
  await fs.mkdir(outputDir, { recursive: true })
  return outputDir
}

const stopTranscoder = (streamKey) => {
  const child = activeTranscoders.get(streamKey)
  if (!child) return
  try {
    child.kill('SIGINT')
  } catch {
    // ignore kill errors
  }
  activeTranscoders.delete(streamKey)
}

export const stopLiveStreamTranscoder = (streamKey) => stopTranscoder(streamKey)

const startTranscoder = async (session) => {
  const streamKey = getStreamKeyFromPath(session?.streamPath)
  if (!streamKey || activeTranscoders.has(streamKey)) return

  const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg'
  const inputUrl = `rtmp://127.0.0.1:${process.env.LIVE_STREAM_RTMP_PORT || 1935}/${process.env.LIVE_STREAM_APP || 'live'}/${streamKey}`
  const outputDir = await ensureOutputDir(streamKey)
  const playlistPath = path.join(outputDir, 'index.m3u8')
  const segmentPattern = path.join(outputDir, 'segment_%03d.ts')

  const args = [
    '-hide_banner',
    '-y',
    '-fflags',
    'nobuffer',
    '-i',
    inputUrl,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-tune',
    'zerolatency',
    '-profile:v',
    'main',
    '-pix_fmt',
    'yuv420p',
    '-g',
    '48',
    '-keyint_min',
    '48',
    '-sc_threshold',
    '0',
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-b:a',
    '128k',
    '-f',
    'hls',
    '-hls_time',
    '2',
    '-hls_list_size',
    '6',
    '-hls_flags',
    'delete_segments+append_list',
    '-hls_segment_filename',
    segmentPattern,
    playlistPath,
  ]

  const child = spawn(ffmpegPath, args, {
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'pipe'],
  })

  activeTranscoders.set(streamKey, child)

  child.stderr?.on('data', (chunk) => {
    const output = chunk.toString().trim()
    if (output) {
      console.log(`[ffmpeg:${streamKey}] ${output}`)
    }
  })

  child.on('exit', (code, signal) => {
    activeTranscoders.delete(streamKey)
    console.log(`[ffmpeg:${streamKey}] exited with code=${code} signal=${signal}`)
  })
}

export const startLiveStreamingServer = async () => {
  if (nmsInstance) return nmsInstance

  ensureLiveStreamsHlsDir()

  const rtmpPort = Number(process.env.LIVE_STREAM_RTMP_PORT || 1935)
  const nmsHttpPort = Number(process.env.LIVE_STREAM_HTTP_PORT || 8000)

  const config = {
    logType: 2,
    rtmp: {
      port: rtmpPort,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: nmsHttpPort,
      mediaroot: path.resolve(liveStreamsHlsDir),
      allow_origin: '*',
    },
  }

  nmsInstance = new NodeMediaServer(config)

  nmsInstance.on('prePublish', async (session) => {
    try {
      const streamKey = getStreamKeyFromPath(session?.streamPath)
      const liveStream = await LiveStream.findOne({ streamKey }).select('_id status streamKey')

      if (!liveStream || liveStream.status === 'cancelled') {
        session?.close?.()
        return
      }
    } catch (error) {
      console.error('[liveStreamingServer] prePublish error:', error)
      session?.close?.()
    }
  })

  nmsInstance.on('postPublish', async (session) => {
    try {
      const streamKey = getStreamKeyFromPath(session?.streamPath)
      const liveStream = await setStreamLive(streamKey)
      if (!liveStream) {
        session?.close?.()
        return
      }

      await startTranscoder(session)
    } catch (error) {
      console.error('[liveStreamingServer] postPublish error:', error)
      session?.close?.()
    }
  })

  nmsInstance.on('donePublish', async (session) => {
    try {
      const streamKey = getStreamKeyFromPath(session?.streamPath)
      stopTranscoder(streamKey)
      await setStreamEnded(streamKey)
    } catch (error) {
      console.error('[liveStreamingServer] donePublish error:', error)
    }
  })

  nmsInstance.run()
  console.log(
    `[liveStreamingServer] Node Media Server started at RTMP ${rtmpPort}, HLS output: ${path.resolve(liveStreamsHlsDir)}`
  )

  return nmsInstance
}

export const getLiveStreamingServer = () => nmsInstance
