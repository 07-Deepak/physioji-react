import User from '../models/User.js'
import Note from '../models/Note.js'
import Video from '../models/Video.js'
import Doubt from '../models/Doubt.js'
import LiveStream from '../models/LiveStream.js'

export const getDoctorDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalNotes, totalVideos, totalDoubts, pendingDoubts, answeredDoubts, activeLiveStreams] =
      await Promise.all([
        User.countDocuments({}),
        Note.countDocuments({}),
        Video.countDocuments({}),
        Doubt.countDocuments({}),
        Doubt.countDocuments({ status: 'pending' }),
        Doubt.countDocuments({ status: 'answered' }),
        LiveStream.countDocuments({ status: 'live' }),
      ])

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalNotes,
        totalVideos,
        totalDoubts,
        pendingDoubts,
        answeredDoubts,
        activeLiveStreams,
        welcomeMessage: `Welcome back, ${req.doctor?.name || 'Doctor'}`,
      },
    })
  } catch (err) {
    console.error('[getDoctorDashboardStats] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}

export const getDoctorProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      doctor: req.doctor || null,
    })
  } catch (err) {
    console.error('[doctorDashboard getDoctorProfile] error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
    })
  }
}
