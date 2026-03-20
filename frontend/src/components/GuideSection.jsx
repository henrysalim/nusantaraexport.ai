import { Link } from "react-router-dom";
import { Package, Mic, Hourglass, ClipboardCheck, Lightbulb, Rocket } from "lucide-react";

export default function GuideSection() {
  const steps = [
    {
      step: "1",
      icon: <Package />,
      title: "Siapkan Data Produk Anda",
      desc: "Catat nama produk, harga jual, dan kapasitas produksi bulanan Anda.",
      tip: "Semakin akurat data Anda, semakin akurat rekomendasi yang dihasilkan.",
    },
    {
      step: "2",
      icon: <Mic />,
      title: "Bicara atau Ketik Pertanyaan",
      desc: "Tekan tombol mikrofon lalu sebutkan produk dan negara tujuan. Atau ketik langsung.",
      tip: "Bisa pakai bahasa Indonesia sehari-hari, formal maupun informal.",
    },
    {
      step: "3",
      icon: <Hourglass />,
      title: "Tunggu Analisis AI (< 30 detik)",
      desc: "Sistem mengecek regulasi, menghitung peluang pasar, dan menyiapkan rekomendasi.",
      tip: "Koneksi internet stabil memastikan data yang paling baru.",
    },
    {
      step: "4",
      icon: <ClipboardCheck />,
      title: "Unduh Dokumen dan Laporan",
      desc: "Anda akan mendapat: negara tujuan terbaik, estimasi biaya ekspor, dan dokumen siap cetak.",
      tip: "Gunakan tombol Dengarkan untuk mendengarkan jawaban AI lewat suara.",
    },
  ];

  return (
    <section id="cara-pakai" className="py-24 bg-slate-soft px-6" aria-labelledby="panduan-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 id="panduan-heading" className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
            Mulai Ekspor dalam{" "}
            <span className="text-accent">4 Langkah Mudah</span>
          </h2>
          <p className="text-secondary/60 font-medium max-w-xl mx-auto">
            Tidak perlu latar belakang ekspor atau teknologi. Ikuti langkah
            berikut dan biarkan AI yang bekerja.
          </p>
        </div>

        <div className="flex flex-col" role="list" aria-label="Panduan langkah demi langkah">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-6" role="listitem">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-accent text-white font-display font-extrabold text-base" aria-hidden="true">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 min-h-[20px] bg-accent/20" aria-hidden="true" />
                )}
              </div>
              <div className="pb-10">
                <div className="text-2xl mb-2 leading-none" aria-hidden="true">{s.icon}</div>
                <h3 className="font-display font-bold text-base text-secondary mb-1.5">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-secondary/60 mb-3 font-medium">
                  {s.desc}
                </p>
                <div className="flex items-start gap-2 px-3 py-2.5 bg-accent-light border border-accent/10 rounded-xl text-xs text-accent leading-relaxed font-bold">
                  <span className="flex-shrink-0" aria-hidden="true"><Lightbulb size={14} /></span>
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
          <p className="text-sm text-secondary/60 max-w-sm leading-relaxed font-medium">
            NusantaraExport.AI tersedia untuk semua UMKM Indonesia — inklusif,
            mudah diakses, dan ramah bagi penyandang disabilitas.
          </p>
          <Link
            to="/demo"
            className="btn-primary px-8 py-3.5 text-base mt-1 shadow-xl shadow-accent/20 flex items-center gap-2"
            aria-label="Mulai analisis ekspor gratis"
          >
            <Rocket size={18} aria-hidden="true" /> Mulai Analisis Gratis
          </Link>
        </div>
      </div>
    </section>
  );
}
