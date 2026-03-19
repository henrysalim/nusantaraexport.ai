import { Link } from 'react-router-dom'

export default function GuideSection() {
  const steps = [
    { step: '1', icon: '📦', title: 'Siapkan Data Produk Anda', desc: 'Catat nama produk, harga jual, dan kapasitas produksi bulanan Anda.', tip: 'Semakin akurat data Anda, semakin akurat rekomendasi yang dihasilkan.' },
    { step: '2', icon: '🎙️', title: 'Bicara atau Ketik Pertanyaan', desc: 'Tekan tombol mikrofon lalu sebutkan produk dan negara tujuan. Atau ketik langsung.', tip: 'Bisa pakai bahasa daerah atau Indonesia sehari-hari.' },
    { step: '3', icon: '⏳', title: 'Tunggu Analisis AI (< 30 detik)', desc: 'Sistem akan mengecek harga pasar, menghitung peluang, dan menyiapkan rekomendasi.', tip: 'Koneksi internet stabil memastikan data yang paling baru.' },
    { step: '4', icon: '📋', title: 'Baca Rekomendasi & Unduh Dokumen', desc: 'Anda akan mendapat: negara tujuan terbaik, estimasi margin, dan dokumen ekspor siap cetak.', tip: 'Gunakan fitur suara agar mudah dipahami oleh mitra bisnis Anda.' },
  ]

  return (
    <section id="cara-pakai" className="py-24 bg-slate-soft px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
            Mulai Ekspor dalam <span className="text-accent">4 Langkah Mudah</span>
          </h2>
          <p className="text-secondary/60 font-medium max-w-xl mx-auto">
            Tidak perlu latar belakang ekspor atau teknologi. Ikuti langkah berikut dan biarkan AI yang bekerja.
          </p>
        </div>

        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-accent text-white font-display font-extrabold text-base">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 min-h-[20px] bg-accent/20" />
                )}
              </div>
              <div className="pb-10">
                <div className="text-2xl mb-2 leading-none">{s.icon}</div>
                <h3 className="font-display font-bold text-base text-secondary mb-1.5">{s.title}</h3>
                <p className="text-sm leading-relaxed text-secondary/60 mb-3 font-medium">{s.desc}</p>
                <div className="flex items-start gap-2 px-3 py-2.5 bg-accent-light border border-accent/10 rounded-xl text-xs text-accent leading-relaxed font-bold">
                  <span className="flex-shrink-0">💡</span>
                  <span>{s.tip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center flex flex-col items-center gap-4 px-8 py-12 rounded-3xl border border-accent/20 bg-accent-light/50 mt-8">
          <h3 className="font-display font-extrabold text-2xl text-secondary">
            Siap memulai perjalanan ekspor Anda?
          </h3>
          <p className="text-sm text-secondary/60 max-w-sm font-medium">
            NusantaraExport.AI tersedia untuk semua UMKM Indonesia — dari Sabang sampai Merauke.
          </p>
          <Link to="/demo" className="btn-primary px-8 py-3.5 text-base mt-1 shadow-xl shadow-accent/20">
            🚀 Mulai Analisis Gratis
          </Link>
        </div>
      </div>
    </section>
  )
}
