import { XCircle, CheckCircle2, Mic, BarChart3, FileText } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="tentang" className="py-24 bg-slate-soft px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fadeInUp">
          <h2 className="text-3xl lg:text-5xl font-display font-black text-secondary leading-tight mb-8">
            Ekspor Nggak Seharusnya <span className="text-accent">Sulit</span>!
          </h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-l-4 border-slate-300 shadow-sm opacity-60">
              <div className="flex items-start gap-4">
                <span className="text-accent-secondary mt-1"><XCircle size={24} /></span>
                <div>
                  <h4 className="font-bold text-secondary mb-1">
                    Masalah UMKM:
                  </h4>
                  <p className="text-sm text-secondary/70 leading-relaxed font-medium">
                    Ribet urus dokumen, bingung cari pembeli luar negeri, dan
                    tidak mengerti bahasa asing. Akhirnya hanya jadi penonton.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border-l-4 border-accent shadow-lg danantara-card">
              <div className="flex items-start gap-4 text-accent">
                <span className="mt-1"><CheckCircle2 size={24} /></span>
                <div>
                  <h4 className="font-bold text-secondary mb-1">
                    Solusi Kami:
                  </h4>
                  <p className="text-lg text-secondary leading-relaxed font-semibold">
                    Bicara lewat suara, AI kami yang buatkan dokumen dan carikan
                    peluang pasar paling menguntungkan secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeInUp">
          {[
            {
              title: "Suara Lokal",
              desc: "Mengerti 30+ bahasa daerah Indonesia.",
              icon: <Mic />,
              color: "bg-accent",
            },
            {
              title: "Data Akurat",
              desc: "Berdasarkan data perdagangan resmi dunia.",
              icon: <BarChart3 />,
              color: "bg-secondary",
            },
            {
              title: "Dokumen Kilat",
              desc: "Buat invoice & packing list otomatis.",
              icon: <FileText />,
              color: "bg-secondary",
            },
            { 
              title: "Sesuai Standar", 
              desc: "Pastikan label produk sesuai aturan dunia.", 
              icon: <CheckCircle2 />, 
              color: "bg-accent" 
            },
          ].map((p, i) => (
            <div key={i} className="danantara-card p-8 rounded-3xl">
              <div
                className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-6`}
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
