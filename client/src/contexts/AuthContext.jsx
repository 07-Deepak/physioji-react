import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { setUnauthorizedHandler } from '../utils/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'physiojiToken'
const USER_KEY = 'physiojiUser'

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch (error) {
    return null
  }
}

const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) {
    return false
  }

  return payload.exp * 1000 <= Date.now()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const saveSession = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const refreshUser = useCallback(async () => {
    const response = await api.get('/users/me')
    localStorage.setItem(USER_KEY, JSON.stringify(response.data))
    setUser(response.data)
    return response.data
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })

    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token || isTokenExpired(token)) {
        clearSession()
        setLoading(false)
        return
      }

      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          localStorage.removeItem(USER_KEY)
        }
      }

      try {
        await refreshUser()
      } catch (error) {
        clearSession()
      } finally {
        setLoading(false)
      }
    }

    bootstrapAuth()
  }, [clearSession, refreshUser])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const payload = token ? decodeTokenPayload(token) : null

    if (!payload?.exp) {
      return undefined
    }

    const timeoutMs = Math.max(payload.exp * 1000 - Date.now(), 0)
    const timeoutId = window.setTimeout(clearSession, timeoutMs)

    return () => window.clearTimeout(timeoutId)
  }, [clearSession, user])

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    saveSession(response.data.token, response.data.user)
    await refreshUser()
    return response.data
  }

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload)
    saveSession(response.data.token, response.data.user)
    await refreshUser()
    return response.data
  }

  const updateProfile = async (payload) => {
    const response = await api.put('/users/me', payload)
    localStorage.setItem(USER_KEY, JSON.stringify(response.data))
    setUser(response.data)
    return response.data
  }

  const uploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post('/users/me/avatar', formData)
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
    setUser(response.data.user)
    return response.data.user
  }

  const updatePassword = async (payload) => {
    const response = await api.put('/users/me/password', payload)
    return response.data
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      uploadAvatar,
      updatePassword,
      setUser,
    }),
    [loading, logout, refreshUser, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
