import { Link } from 'react-router-dom'

export default function FeaturesSection() {
  const features = [
    { icon: '🎙️', title: 'Tanya Pake Suara', desc: 'Bicara dalam bahasa daerah (Jawa, Sunda, dll). AI kami langsung mengerti mau Anda.' },
    { icon: '📈', title: 'Cek Peluang Pasar', desc: 'Cari tahu negara mana yang butuh produk Anda tanpa harus riset berhari-hari.' },
    { icon: '📄', title: 'Buat Surat Ekspor', desc: 'Invoice dan packing list jadi otomatis. Tinggal cetak, tidak perlu ketik manual.' },
    { icon: '📋', title: 'Panduan Langkah', desc: 'Dapatkan rencana ekspor dari nol sampai barang terkirim ke luar negeri.' },
    { icon: '⚖️', title: 'Info Aturan Resmi', desc: 'Cek syarat BPOM, Bea Cukai, dan aturan negara tujuan dengan bahasa yang mudah.' },
    { icon: '📦', title: 'Tanpa Calo', desc: 'Hubungkan UMKM langsung ke pembeli global. Keuntungan 100% milik Anda.' },
  ]

  return (
    <section id="fitur" className="py-24 bg-slate-soft px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-fadeInUp">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
              Fitur yang <span className="text-accent">Memudahkan</span> Bisnis Anda.
            </h2>
            <p className="text-secondary/60 font-medium text-lg leading-relaxed">
              Semua alat yang Anda butuhkan untuk mulai menjadi eksportir sukses, dalam satu aplikasi yang sangat mudah digunakan.
            </p>
          </div>
          <Link to="/demo" className="btn-primary mb-2 shadow-xl shadow-accent/20">Coba Fitur Sekarang</Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="danantara-card p-10 rounded-[2rem] animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-16 h-16 bg-slate-soft rounded-2xl flex items-center justify-center text-4xl mb-8">{f.icon}</div>
              <h3 className="text-2xl font-black text-secondary mb-4 leading-tight">{f.title}</h3>
              <p className="text-secondary/50 leading-relaxed font-bold">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
