import jwt from 'jsonwebtoken'

const generateAdminToken = (adminId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }

  return jwt.sign({ adminId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export default generateAdminToken


