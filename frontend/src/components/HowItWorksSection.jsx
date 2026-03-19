export default function HowItWorksSection() {
  const steps = [
    { id: '01', title: 'Bicara Lewat Suara', desc: 'Cukup tekan tombol mic dan jelaskan produk Anda dalam bahasa Indonesia atau daerah.', icon: '🎙️' },
    { id: '02', title: 'AI Menganalisis Pasar', desc: 'Sistem kami mendeteksi negara mana yang paling butuh produk Anda saat ini.', icon: '🔎' },
    { id: '03', title: 'Dapatkan Buyer', desc: 'Kami menghubungkan Anda langsung dengan pembeli luar negeri tanpa calo.', icon: '🤝' },
    { id: '04', title: 'Dokumen Jadi Otomatis', desc: 'Klik satu tombol, dan dokumen ekspor resmi Anda akan langsung terbit.', icon: '📄' },
  ]

  return (
    <section id="cara-kerja" className="py-24 bg-white px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fadeInUp">
          <h2 className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
            Hanya <span className="text-accent underline decoration-accent/20">4 Langkah</span> Menuju Ekspor.
          </h2>
          <p className="text-secondary/60 font-medium max-w-xl mx-auto">
            Kami rancang sesederhana mungkin agar Bapak/Ibu pemilik UMKM bisa langsung fokus jualan tanpa pusing teknologi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative group animate-fadeInUp" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="danantara-card p-10 h-full rounded-[2rem] flex flex-col items-center text-center">
                <div className="text-5xl font-black text-accent/10 mb-6 group-hover:text-accent/20 transition-colors">{s.id}</div>
                <div className="w-16 h-16 bg-slate-soft rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6">{s.icon}</div>
                <h3 className="text-xl font-black text-secondary mb-4 leading-tight">{s.title}</h3>
                <p className="text-sm text-secondary/50 leading-relaxed font-bold">{s.desc}</p>
              </div>
              {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-slate-200 z-0" />}
            </div>
          ))}
        </div>

        <div className="mt-20 bg-accent-light p-8 rounded-3xl border border-accent/10 text-center">
          <p className="text-accent font-black text-lg">
            "Sangat mudah, seperti pakai WhatsApp!" — <span className="text-secondary opacity-70">Siti Rukayah, Eksportir Keripik Tempe</span>
          </p>
        </div>
      </div>
    </section>
  )
}
