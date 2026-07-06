import bcrypt from 'bcrypt'
import Admin from '../models/Admin.js'

const DEFAULT_ADMIN = {
  name: 'Super Admin',
  email: 'admin@gmail.com',
  password: 'Admin@123',
  role: 'admin',
}

export default async function createDefaultAdmin() {
  try {
    const existing = await Admin.findOne({ email: DEFAULT_ADMIN.email })
    if (existing) {
      console.log('ℹ️ Default Admin Already Exists')
      return
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10)

    const admin = await Admin.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      avatar: '',
      role: DEFAULT_ADMIN.role,
      createdAt: new Date(),
    })

    console.log('✅ Default Admin Created')
    console.log(`Email: ${DEFAULT_ADMIN.email}`)
    console.log(`Password: ${DEFAULT_ADMIN.password}`)

    return admin
  } catch (err) {
    console.error('❌ Failed to create default admin:', err?.message || err)
    // Do not crash server on seed failure
    return null
  }
}


