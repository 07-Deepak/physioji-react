import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../utils/api'

const AdminContext = createContext(null)

const TOKEN_KEY = 'adminToken'
const DATA_KEY = 'adminData'

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DATA_KEY)
    setAdminToken(null)
    setAdmin(null)
  }, [])

  const persistSession = useCallback((token, nextAdmin) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(DATA_KEY, JSON.stringify(nextAdmin))
    setAdminToken(token)
    setAdmin(nextAdmin)
  }, [])

  const checkAdmin = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || isTokenExpired(token)) {
      clearSession()
      return null
    }

    try {
      // api interceptor currently reads physiojiToken.
      // For admin calls we send explicit Authorization header.
      const res = await api.get('/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Expected: { adminData }
      const nextAdmin = res.data?.adminData
      if (!nextAdmin) {
        clearSession()
        return null
      }

      persistSession(token, nextAdmin)
      return nextAdmin
    } catch (err) {
      clearSession()
      return null
    }
  }, [clearSession, persistSession])

  const adminLogin = useCallback(
    async (credentials) => {
      const res = await api.post('/admin/login', credentials)
      const { adminToken: token, adminData } = res.data || {}

      if (!token || !adminData) {
        throw new Error('Invalid server response')
      }

      persistSession(token, adminData)
      return { token, adminData }
    },
    [persistSession]
  )

  const adminLogout = useCallback(() => {
    clearSession()
  }, [clearSession])

  useEffect(() => {
    let alive = true

    const bootstrap = async () => {
      try {
        const stored = localStorage.getItem(DATA_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (alive) setAdmin(parsed)
          } catch {
            // ignore
          }
        }

        const token = localStorage.getItem(TOKEN_KEY)
        if (!token || isTokenExpired(token)) {
          clearSession()
          return
        }

        await checkAdmin()
      } finally {
        if (alive) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      alive = false
    }
  }, [clearSession, checkAdmin])

  const value = useMemo(
    () => ({
      admin,
      adminToken,
      loading,
      adminLogin,
      adminLogout,
      checkAdmin,
    }),
    [admin, adminToken, loading, adminLogin, adminLogout, checkAdmin]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within AdminProvider')
  return context
}

