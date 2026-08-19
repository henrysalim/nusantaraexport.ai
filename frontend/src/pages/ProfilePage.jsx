import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Save, CheckCircle2, Loader, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Field = ({ id, label, type = 'text', disabled = false, ...props }) => (
  <div>
    <label htmlFor={id} className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">{label}</label>
    {type === 'textarea' ? (
      <textarea id={id} className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none" rows={3} {...props} />
    ) : (
      <input id={id} type={type}
        className={`w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${disabled ? 'cursor-not-allowed text-secondary/50' : ''}`}
        disabled={disabled} {...props} />
    )}
  </div>
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    province: '',
    products: '',
    export_destinations: '',
  })

  // Load profil lengkap dari API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me')
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          business_name: res.data.business_name || '',
          province: res.data.province || '',
          products: res.data.products || '',
          export_destinations: res.data.export_destinations || '',
        })
      } catch (err) {
        console.error('Fetch profile error:', err)
        // Fallback ke data dari AuthContext
        if (user) {
          setForm(prev => ({
            ...prev,
            full_name: user.full_name || '',
            email: user.email || '',
          }))
        }
        setError('Tidak dapat memuat data profil terbaru. Menggunakan data lokal.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put('/api/auth/profile', {
        full_name: form.full_name,
        phone: form.phone,
        business_name: form.business_name,
        province: form.province,
        products: form.products,
        export_destinations: form.export_destinations,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Save profile error:', err)
      const errMsg = err.response?.data?.detail || 'Gagal menyimpan profil.'
      // Kalau error karena kolom belum ada di users table, kasih info
      if (errMsg.includes('column') || errMsg.includes('does not exist')) {
        setError(
          'Kolom profil tambahan belum tersedia di database. ' +
          'Silakan jalankan migration SQL untuk menambah kolom: phone, business_name, province, products, export_destinations ke tabel users.'
        )
      } else {
        setError(errMsg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-soft flex items-center justify-center">
        <Loader className="animate-spin text-accent" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-soft pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg" aria-hidden="true">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-secondary">Profil Saya</h1>
            <p className="text-secondary/50 font-medium">Kelola informasi akun dan preferensi ekspor Anda</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="full_name" label="Nama Lengkap" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <div>
              <label htmlFor="email" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Email</label>
              <input id="email" type="email"
                className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary/50 outline-none cursor-not-allowed"
                value={form.email} disabled />
              <p className="text-[10px] text-secondary/30 mt-1 font-medium">Email tidak dapat diubah</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="phone" label="Nomor Telepon" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+628123456789" />
            <Field id="business_name" label="Nama Usaha" value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Koperasi Kopi Gayo" />
          </div>
          <div>
            <label htmlFor="province" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Provinsi</label>
            <select id="province"
              className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}>
              <option value="">Pilih Provinsi</option>
              {['Aceh','Sumatera Utara','Sumatera Barat','Riau','Jambi','Sumatera Selatan','Bengkulu','Lampung','Kep. Bangka Belitung','Kep. Riau','DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Banten','Bali','NTB','NTT','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara','Sulawesi Utara','Sulawesi Tengah','Sulawesi Selatan','Sulawesi Tenggara','Gorontalo','Sulawesi Barat','Maluku','Maluku Utara','Papua','Papua Barat'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Field id="products" label="Produk Unggulan (pisahkan dengan koma)" value={form.products}
            onChange={(e) => setForm({ ...form, products: e.target.value })}
            placeholder="Kopi Arabika, Keripik Singkong, Batik" />
          <Field id="export_destinations" label="Negara Tujuan Ekspor (pisahkan dengan koma)" value={form.export_destinations}
            onChange={(e) => setForm({ ...form, export_destinations: e.target.value })}
            placeholder="Jepang, Tiongkok, Jerman" />

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" disabled={saving}
              className="btn-primary px-8 py-4 text-base flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {saved && (
              <span className="flex items-center gap-2 text-green-600 font-bold text-sm animate-fadeInUp">
                <CheckCircle2 size={18} /> Tersimpan ke database!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
