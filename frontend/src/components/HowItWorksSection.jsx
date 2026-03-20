import { Mic, Search, Package, FileText } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    { id: '01', title: 'Bicara atau Ketik', desc: 'Cukup tekan tombol dan jelaskan produk Anda dalam bahasa Indonesia sehari-hari, lewat suara atau teks.', icon: <Mic /> },
    { id: '02', title: 'AI Menganalisis Pasar', desc: 'Sistem menganalisis data perdagangan dunia untuk menemukan negara yang paling membutuhkan produk Anda.', icon: <Search /> },
    { id: '03', title: 'Verifikasi Kepatuhan', desc: 'AI memeriksa kelengkapan dokumen, sertifikasi, dan kesesuaian kemasan terhadap regulasi negara tujuan.', icon: <Package /> },
    { id: '04', title: 'Dokumen Siap Cetak', desc: 'Semua dokumen ekspor resmi dihasilkan otomatis dalam format PDF, tinggal unduh dan cetak.', icon: <FileText /> },
  ]

  return (
    <section id="cara-kerja" className="py-24 bg-white px-6" aria-labelledby="cara-kerja-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fadeInUp">
          <h2 id="cara-kerja-heading" className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
            Hanya <span className="text-accent underline decoration-accent/20">4 Langkah</span> Menuju Ekspor.
          </h2>
          <p className="text-secondary/60 font-medium max-w-xl mx-auto">
            Dirancang sesederhana mungkin agar pelaku UMKM bisa langsung fokus berjualan tanpa pusing teknologi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Empat langkah menuju ekspor">
          {steps.map((s, i) => (
            <div key={i} className="relative group animate-fadeInUp" style={{ animationDelay: `${i * 150}ms` }} role="listitem">
              <div className="danantara-card p-10 h-full rounded-[2rem] flex flex-col items-center text-center" tabIndex={0} aria-label={`Langkah ${s.id}: ${s.title}. ${s.desc}`}>
                <div className="text-5xl font-black text-accent/40 mb-6 group-hover:text-accent/80 transition-colors" aria-hidden="true">{s.id}</div>
                <div className="w-16 h-16 bg-slate-soft rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6" aria-hidden="true">{s.icon}</div>
                <h3 className="text-xl font-black text-secondary mb-4 leading-tight">{s.title}</h3>
                <p className="text-sm text-secondary/50 leading-relaxed font-bold">{s.desc}</p>
              </div>
              {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-slate-200 z-0" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="mt-20 bg-accent-light p-8 rounded-3xl border border-accent/10 text-center" role="figure" aria-label="Testimoni pengguna">
          <p className="text-accent font-black text-lg">
            "Sangat mudah, seperti pakai WhatsApp!" — <span className="text-secondary opacity-70">Siti Rukayah, Pengusaha Keripik Tempe</span>
          </p>
        </div>
      </div>
    </section>
  )
}
