import { XCircle, CheckCircle2, Mic, BarChart3, FileText, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="tentang" className="h-screen py-24 bg-slate-soft px-6" aria-labelledby="tentang-heading">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fadeInUp">
          <h2 id="tentang-heading" className="text-3xl lg:text-5xl font-display font-black text-secondary leading-tight mb-8">
            Ekspor Nggak Seharusnya <span className="text-accent">Sulit</span>!
          </h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm opacity-60">
              <div className="flex items-start gap-4">
                <span className="text-accent-secondary mt-1" aria-hidden="true"><XCircle size={24} /></span>
                <div>
                  <h4 className="font-bold text-secondary mb-1">
                    Masalah UMKM:
                  </h4>
                  <p className="text-sm text-secondary/70 leading-relaxed font-medium">
                    Ribet urus dokumen, bingung soal aturan negara tujuan, dan
                    tidak tahu apakah kemasan produk sudah sesuai standar. Akhirnya gagal sebelum mulai.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border-l-4 border-accent shadow-lg danantara-card">
              <div className="flex items-start gap-4 text-accent">
                <span className="mt-1" aria-hidden="true"><CheckCircle2 size={24} /></span>
                <div>
                  <h4 className="font-bold text-secondary mb-1">
                    Solusi Kami:
                  </h4>
                  <p className="text-lg text-secondary leading-relaxed font-semibold">
                    Cukup bicara atau ketik, AI akan buatkan dokumen, periksa
                    kemasan, dan carikan peluang pasar paling menguntungkan secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeInUp" role="list" aria-label="Keunggulan utama">
          {[
            {
              title: "Suara & Teks",
              desc: "Tanya lewat suara atau ketik dalam bahasa Indonesia sehari-hari.",
              icon: <Mic />,
              color: "bg-accent",
            },
            {
              title: "Data Resmi",
              desc: "Jawaban bersumber dari regulasi resmi pemerintah, bukan tebakan AI.",
              icon: <BarChart3 />,
              color: "bg-secondary",
            },
            {
              title: "Dokumen Otomatis",
              desc: "Buat invoice, packing list, dan SKA langsung dari data produk Anda.",
              icon: <FileText />,
              color: "bg-secondary",
            },
            {
              title: "Ramah Disabilitas",
              desc: "Navigasi keyboard penuh, pembaca layar, dan suara untuk semua pengguna.",
              icon: <ShieldCheck />,
              color: "bg-accent",
            },
          ].map((p, i) => (
            <div key={i} className="danantara-card p-8 rounded-3xl" role="listitem" tabIndex={0} aria-label={`${p.title}: ${p.desc}`}>
              <div
                className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-6`}
                aria-hidden="true"
              >
                {p.icon}
              </div>
              <h3 className="text-xl font-black text-secondary mb-3">
                {p.title}
              </h3>
              <p className="text-sm text-secondary/60 leading-relaxed font-medium">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
