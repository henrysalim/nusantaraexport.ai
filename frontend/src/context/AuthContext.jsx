import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Clock, LogIn } from 'lucide-react'
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

  // ── Listen for Escape key to close modal if open
  useEffect(() => {
    if (!sessionExpired) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSessionExpired(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sessionExpired])

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

  // ── Dismiss expired modal without login
  const handleDismissSessionExpired = () => {
    setSessionExpired(false)
  }

  const value = {
    user,
    loading,
    sessionExpired,
    setSessionExpired,
    dismissSessionExpired: handleDismissSessionExpired,
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sesi berakhir"
          onClick={handleDismissSessionExpired}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-accent to-accent/60" />

            {/* Close 'X' button at top-right */}
            <button
              type="button"
              onClick={handleDismissSessionExpired}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-secondary/60 hover:text-secondary flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-label="Tutup peringatan sesi"
              id="btn-session-expired-close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="p-7 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-amber-600" strokeWidth={2.2} />
              </div>

              <h2 className="text-lg font-black text-secondary mb-2">Sesi Berakhir</h2>
              <p className="text-sm text-secondary/60 leading-relaxed mb-6">
                Sesi login Anda telah berakhir karena tidak aktif.
                Anda dapat login kembali atau tetap melanjutkan penjelajahan.
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleDismissSessionExpired}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-secondary/70 hover:text-secondary text-sm font-bold rounded-xl transition-all"
                  id="btn-session-expired-dismiss"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSessionExpiredLogin}
                  className="w-full py-2.5 px-4 bg-accent text-white text-sm font-black rounded-xl
                    hover:bg-accent/90 transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2"
                  id="btn-session-expired-login"
                >
                  <LogIn size={16} />
                  <span>Login Kembali</span>
                </button>
              </div>
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
