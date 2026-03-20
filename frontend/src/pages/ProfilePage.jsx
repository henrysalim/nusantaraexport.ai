import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Save, CheckCircle2 } from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    business: '',
    province: '',
    products: '',
    destinations: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem('ne_user')
    if (stored) {
      const u = JSON.parse(stored)
      setForm({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '+62 ',
        business: u.business || '',
        province: u.province || '',
        products: u.products || 'Kopi Arabika, Keripik Singkong',
        destinations: u.destinations || 'Jepang, Tiongkok',
      })
    } else {
      // Demo default
      setForm({
        name: 'Pengguna UMKM',
        email: 'umkm@nusantara.id',
        phone: '+62 812-3456-7890',
        business: 'CV Nusantara Jaya',
        province: 'Jawa Barat',
        products: 'Kopi Arabika, Keripik Singkong',
        destinations: 'Jepang, Tiongkok',
      })
    }
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('ne_user', JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Field = ({ id, label, type = 'text', ...props }) => (
    <div>
      <label htmlFor={id} className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">{label}</label>
      {type === 'textarea' ? (
        <textarea id={id} className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none" rows={3} {...props} />
      ) : (
        <input id={id} type={type} className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" {...props} />
      )}
    </div>
  )

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

        <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="name" label="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="phone" label="Nomor Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Field id="business" label="Nama Usaha" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
          </div>
          <div>
            <label htmlFor="province" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Provinsi</label>
            <select
              id="province"
              className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            >
              <option value="">Pilih Provinsi</option>
              {['Aceh','Sumatera Utara','Sumatera Barat','Riau','Jambi','Sumatera Selatan','Bengkulu','Lampung','Kep. Bangka Belitung','Kep. Riau','DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Banten','Bali','NTB','NTT','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara','Sulawesi Utara','Sulawesi Tengah','Sulawesi Selatan','Sulawesi Tenggara','Gorontalo','Sulawesi Barat','Maluku','Maluku Utara','Papua','Papua Barat'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Field id="products" label="Produk Unggulan (pisahkan dengan koma)" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} />
          <Field id="destinations" label="Negara Tujuan Ekspor (pisahkan dengan koma)" value={form.destinations} onChange={(e) => setForm({ ...form, destinations: e.target.value })} />

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" className="btn-primary px-8 py-4 text-base flex items-center gap-2">
              <Save size={18} /> Simpan Perubahan
            </button>
            {saved && (
              <span className="flex items-center gap-2 text-green-600 font-bold text-sm animate-fadeInUp">
                <CheckCircle2 size={18} /> Tersimpan!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
