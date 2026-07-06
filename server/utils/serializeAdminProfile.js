export const serializeAdminProfile = (admin) => {
  if (!admin) return null
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    avatar: admin.avatar,
    role: admin.role,
    createdAt: admin.createdAt,
  }
}

