import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

// Session check interval: every 5 minutes
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  // ── Check auth status (used on mount + periodic refresh)
  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me')
      // /me now returns data directly (flat object), not wrapped in { user: {...} }
      const userData = res.data?.user ?? res.data
      if (userData?.id) {
        setUser(userData)
        setSessionExpired(false)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── On mount: initial auth check + listen for session-expired event
  useEffect(() => {
    checkAuth()

    // Listen for session expiry dispatched by the axios interceptor
    const handleSessionExpired = () => {
      setUser(null)
      setSessionExpired(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    window.addEventListener('ne:session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('ne:session-expired', handleSessionExpired)
    }
  }, [checkAuth])

  // ── Periodic session health check: every 5 minutes re-validates token
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(async () => {
      try {
        await api.get('/api/auth/me')
        // Still valid — no action needed
      } catch {
        // Session ended (interceptor already handled refresh / dispatch)
      }
    }, SESSION_CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user])

  // ── Login
  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data?.user) {
      setUser(res.data.user)
      setSessionExpired(false)
      if (res.data.access_token) {
        localStorage.setItem('ne_access_token', res.data.access_token)
        localStorage.setItem('ne_refresh_token', res.data.refresh_token)
      }
    }
    return res.data
  }

  // ── Register
  const register = async (full_name, email, password) => {
    const res = await api.post('/api/auth/register', { full_name, email, password })
    if (res.data?.user) {
      setUser(res.data.user)
      setSessionExpired(false)
      if (res.data.access_token) {
        localStorage.setItem('ne_access_token', res.data.access_token)
        localStorage.setItem('ne_refresh_token', res.data.refresh_token)
      }
    }
    return res.data
  }

  // ── Logout
  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore logout errors
    }
    setUser(null)
    setSessionExpired(false)
    localStorage.removeItem('ne_access_token')
    localStorage.removeItem('ne_refresh_token')
    localStorage.removeItem('ne_user')
    navigate('/login')
  }

  // ── Manual token refresh (for explicit refresh calls)
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
      setUser(null)
      localStorage.removeItem('ne_access_token')
      localStorage.removeItem('ne_refresh_token')
      throw new Error('Session expired')
    }
  }

  // ── Dismiss expired modal and redirect to login
  const handleSessionExpiredLogin = () => {
    setSessionExpired(false)
    navigate('/login')
  }

  const value = {
    user,
    loading,
    sessionExpired,
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

      {/* ── Session Expired Modal ─────────────────────────────── */}
      {sessionExpired && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Sesi berakhir"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            {/* Header accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-accent to-accent/60" />

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <h2 className="text-lg font-black text-secondary mb-2">Sesi Berakhir</h2>
              <p className="text-sm text-secondary/60 leading-relaxed mb-6">
                Sesi login Anda telah berakhir karena tidak aktif.
                Silakan login kembali untuk melanjutkan.
              </p>

              <button
                onClick={handleSessionExpiredLogin}
                className="w-full py-3 bg-accent text-white text-sm font-black rounded-xl
                  hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
                id="btn-session-expired-login"
              >
                Login Kembali
              </button>
            </div>
          </div>
        </div>
      )}
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
