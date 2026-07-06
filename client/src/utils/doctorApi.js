import axios from 'axios'
import { API_BASE_URL } from './apiUrl'

const doctorApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

doctorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('doctorToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default doctorApi
