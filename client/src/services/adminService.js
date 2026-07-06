import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const adminApi = axios.create({
  baseURL: API_BASE_URL,
})

export async function getAllUsers() {
  const token = localStorage.getItem('adminToken')

  console.log('[adminService] adminApi baseURL:', adminApi.defaults.baseURL)
  console.log('[adminService] GET /admin/users')

  const res = await adminApi.get('/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })


  return res.data
}

