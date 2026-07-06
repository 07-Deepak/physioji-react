import jwt from 'jsonwebtoken'

const generateDoctorToken = (doctorId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }

  return jwt.sign({ doctorId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export default generateDoctorToken
