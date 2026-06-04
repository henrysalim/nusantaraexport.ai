import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check auth status on mount — try to validate existing session
  const checkAuth = useCallback(async () => {
    try {
      // Try to get current user (token sent via httpOnly cookie automatically)
      const res = await api.get('/api/auth/me')
      if (res.data?.user) {
        setUser(res.data.user)
      }
    } catch {
      // Not authenticated — clear state
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data?.user) {
      setUser(res.data.user)
      // Store backup token for axios interceptor (httpOnly cookie is primary)
      if (res.data.access_token) {
        localStorage.setItem('ne_access_token', res.data.access_token)
        localStorage.setItem('ne_refresh_token', res.data.refresh_token)
      }
    }
    return res.data
  }

  const register = async (full_name, email, password) => {
    const res = await api.post('/api/auth/register', { full_name, email, password })
    if (res.data?.user) {
      setUser(res.data.user)
      if (res.data.access_token) {
        localStorage.setItem('ne_access_token', res.data.access_token)
        localStorage.setItem('ne_refresh_token', res.data.refresh_token)
      }
    }
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore logout errors
    }
    setUser(null)
    localStorage.removeItem('ne_access_token')
    localStorage.removeItem('ne_refresh_token')
    // Also clear legacy mock user data
    localStorage.removeItem('ne_user')
    navigate('/login')
  }

  const refreshToken = async () => {
    try {
      const refreshTkn = localStorage.getItem('ne_refresh_token')
      const res = await api.post('/api/auth/refresh', {
        refresh_token: refreshTkn || ''
      })
      if (res.data?.access_token) {
        localStorage.setItem('ne_access_token', res.data.access_token)
        localStorage.setItem('ne_refresh_token', res.data.refresh_token)
      }
      return res.data
    } catch {
      // Refresh failed — force logout
      setUser(null)
      localStorage.removeItem('ne_access_token')
      localStorage.removeItem('ne_refresh_token')
      throw new Error('Session expired')
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
