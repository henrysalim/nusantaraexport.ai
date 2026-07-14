import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from || '/demo'
    navigate(from, { replace: true })
    return null
  }

  const validate = () => {
    const errs = {}
    if (isRegister && !form.name.trim()) {
      errs.name = 'Nama lengkap wajib diisi'
    }
    if (!form.email.trim()) {
      errs.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Format email tidak valid'
    }
    if (!form.password) {
      errs.password = 'Kata sandi wajib diisi'
    } else if (form.password.length < 8) {
      errs.password = 'Kata sandi minimal 8 karakter'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        // Register via Backend API
        await register(form.name.trim(), form.email.trim(), form.password)
        setSuccess('Akun berhasil dibuat! Mengalihkan...')
      } else {
        // Login via Backend API
        await login(form.email.trim(), form.password)
        setSuccess('Berhasil masuk! Mengalihkan...')
      }
      
      setTimeout(() => {
        const from = location.state?.from || '/demo'
        navigate(from, { replace: true })
      }, 1000)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.detail || err.message || 'Terjadi kesalahan. Silakan coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const FieldError = ({ error }) => error ? (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
      <span className="text-xs font-bold text-red-500">{error}</span>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-slate-soft flex items-center justify-center px-6 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg" aria-hidden="true">
              <span className="text-2xl font-bold">N</span>
            </div>
            <span className="font-display font-black text-2xl text-secondary tracking-tight">
              Nusantara<span className="text-accent">Export</span>.AI
            </span>
          </Link>
          <h1 className="text-3xl font-display font-black text-secondary mb-2">
            {isRegister ? 'Mulai Langkah Ekspor Anda' : 'Masuk ke Dashboard UMKM'}
          </h1>
          <p className="text-secondary/50 font-medium">
            {isRegister ? 'Bergabung dengan ribuan UMKM yang sudah go-global' : 'Senang melihat Anda kembali!'}
          </p>
        </div>

        {/* Success Toast */}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl animate-fadeInUp">
            <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
            <span className="text-sm font-bold text-green-700">{success}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {/* Error message */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold animate-fadeInUp">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nama Anda"
                  className={`w-full px-5 py-4 bg-slate-soft border rounded-2xl font-bold text-secondary outline-none focus:ring-2 focus:ring-accent/20 ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-accent'}`}
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
                />
                <FieldError error={errors.name} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Email</label>
              <input
                id="email"
                type="email"
                placeholder="email@bisnis-anda.com"
                className={`w-full px-5 py-4 bg-slate-soft border rounded-2xl font-bold text-secondary outline-none focus:ring-2 focus:ring-accent/20 ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-accent'}`}
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
              />
              <FieldError error={errors.email} />
            </div>
            <div>
              <label htmlFor="password" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Kata Sandi</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter (huruf + angka)"
                  className={`w-full px-5 py-4 bg-slate-soft border rounded-2xl font-bold text-secondary outline-none focus:ring-2 focus:ring-accent/20 pr-12 ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-accent'}`}
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }) }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isRegister && (
                <p className="text-[10px] text-secondary/40 mt-2 font-medium">
                  Minimal 8 karakter, harus mengandung huruf dan angka
                </p>
              )}
              <FieldError error={errors.password} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  {isRegister ? 'Mendaftarkan...' : 'Masuk...'}
                </span>
              ) : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-black">
              {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setErrors({}); setSuccess('') }}
                className="text-accent underline decoration-accent/30 hover:decoration-accent transition-all"
              >
                {isRegister ? 'Masuk' : 'Daftar gratis'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-secondary/30 mt-6 font-medium">
          Dengan masuk, Anda menyetujui Syarat Penggunaan dan Kebijakan Privasi NusantaraExport.AI
        </p>
      </div>
    </div>
  )
}

