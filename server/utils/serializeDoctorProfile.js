export const serializeDoctorProfile = (doctor) => {
  if (!doctor) return null
  return {
    id: doctor._id,
    name: doctor.name || 'Doctor',
    email: doctor.email || '',
    phone: doctor.phone || '',
    specialization: doctor.specialization || 'General',
    qualification: doctor.qualification || 'N/A',
    experience: doctor.experience || 'N/A',
    bio: doctor.bio || 'No bio added',
    profileImage: doctor.profileImage || '',
    status: doctor.status || 'active',
    role: doctor.role || 'doctor',
    createdAt: doctor.createdAt || null,
    updatedAt: doctor.updatedAt || null,
  }
}
