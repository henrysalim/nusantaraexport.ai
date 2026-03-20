import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      // Mock login — store to localStorage
      localStorage.setItem('ne_user', JSON.stringify({
        name: form.name || 'Pengguna UMKM',
        email: form.email || 'umkm@nusantara.id',
        business: 'CV Nusantara Jaya',
        phone: '+62 812-3456-7890',
        province: 'Jawa Barat',
      }))
      setLoading(false)
      navigate('/demo')
    }, 1200)
  }

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
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
          </h1>
          <p className="text-secondary/50 font-medium">
            {isRegister ? 'Gratis untuk semua UMKM Indonesia' : 'Selamat datang kembali!'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nama Anda"
                  className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Email</label>
              <input
                id="email"
                type="email"
                placeholder="email@bisnis-anda.com"
                className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Kata Sandi</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm font-bold text-accent hover:underline"
            >
              {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-secondary/30 mt-6 font-medium">
          Dengan masuk, Anda menyetujui Syarat Penggunaan dan Kebijakan Privasi NusantaraExport.AI
        </p>
      </div>
    </div>
  )
}
