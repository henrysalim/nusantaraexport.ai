import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Save, CheckCircle2, Loader, AlertCircle, Crown, Zap, Star, Sparkles, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription, TIERS, TOKEN_QUOTA } from '../context/SubscriptionContext'
import { Link } from 'react-router-dom'
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
  const { tier, subscription, tokensUsed, tokenQuota } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
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
        // /api/auth/me bisa mengembalikan data langsung ATAU { user: {...} }
        const data = res.data?.user ?? res.data
        setForm({
          full_name: data.full_name || user?.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          business_name: data.business_name || '',
          province: data.province || '',
          products: data.products || '',
          export_destinations: data.export_destinations || '',
        })
      } catch (err) {
        console.error('Fetch profile error:', err)
        // Fallback ke data dari AuthContext
        setForm(prev => ({
          ...prev,
          full_name: prev.full_name || user?.full_name || '',
          email: prev.email || user?.email || '',
        }))
        setError('Tidak dapat memuat data profil terbaru.')
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

        {/* ── Subscription Section ──────────────────────────────────── */}
        <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Crown size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-secondary">Paket Langganan</h2>
                <p className="text-sm text-secondary/50 font-medium">Status langganan aktif Anda</p>
              </div>
            </div>
            <Link
              to="/langganan"
              id="btn-profile-manage-subscription"
              className="flex items-center gap-1.5 text-xs font-black text-accent hover:underline"
            >
              Kelola <ExternalLink size={12} />
            </Link>
          </div>

          {/* Tier aktif */}
          <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
            tier === 'premium' ? 'bg-amber-50 border border-amber-200' :
            tier === 'pro'     ? 'bg-violet-50 border border-violet-200' :
            tier === 'starter' ? 'bg-blue-50 border border-blue-200' :
                                  'bg-slate-50 border border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                tier === 'premium' ? 'bg-amber-500' :
                tier === 'pro'     ? 'bg-violet-500' :
                tier === 'starter' ? 'bg-blue-500' : 'bg-slate-400'
              }`}>
                {tier === 'premium' ? <Crown size={16} className="text-white" /> :
                 tier === 'pro'     ? <Star size={16} className="text-white" /> :
                 tier === 'starter' ? <Zap size={16} className="text-white" /> :
                                     <Sparkles size={16} className="text-white" />}
              </div>
              <div>
                <div className="font-black text-secondary text-sm">Paket {TIERS[tier]?.label}</div>
                {subscription?.expiresAt && tier !== 'free' ? (
                  <div className="text-[11px] text-secondary/50 font-medium">
                    Aktif hingga {new Date(subscription.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                ) : (
                  <div className="text-[11px] text-secondary/40 font-medium">Paket dasar tanpa biaya</div>
                )}
              </div>
            </div>
            {tier === 'free' && (
              <Link to="/langganan" id="btn-profile-upgrade" className="text-xs font-black text-accent hover:underline">
                Upgrade →
              </Link>
            )}
          </div>

          {/* Token usage card (hanya untuk non-premium) */}
          {tier !== 'premium' && tokenQuota !== Infinity && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-black text-secondary/50 uppercase tracking-widest">Kuota Token Chatbot Hari Ini</span>
                <span className="text-[11px] font-black text-secondary">
                  {tokensUsed.toLocaleString('id-ID')} / {tokenQuota.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    (tokensUsed / tokenQuota) > 0.8 ? 'bg-red-500' :
                    (tokensUsed / tokenQuota) > 0.5 ? 'bg-amber-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (tokensUsed / tokenQuota) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-secondary/40 font-medium">
                🕛 Kuota direset otomatis setiap tengah malam
              </p>
            </div>
          )}

          {tier === 'premium' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
              <Crown size={18} className="text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-700">Token tidak terbatas — nikmati semua fitur tanpa batasan!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
