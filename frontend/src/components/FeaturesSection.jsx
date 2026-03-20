import { Link } from "react-router-dom";
import { Mic, TrendingUp, FileText, ClipboardList, Scale, Package } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    { icon: <Mic />, title: "Tanya Pake Suara", desc: "Bicara dalam bahasa daerah (Jawa, Sunda, dll). AI kami langsung mengerti mau Anda." },
    { icon: <TrendingUp />, title: "Cek Peluang Pasar", desc: "Cari tahu negara mana yang butuh produk Anda tanpa harus riset berhari-hari." },
    { icon: <FileText />, title: "Buat Surat Ekspor", desc: "Invoice dan packing list jadi otomatis. Tinggal cetak, tidak perlu ketik manual." },
    { icon: <ClipboardList />, title: "Panduan Langkah", desc: "Dapatkan rencana ekspor dari nol sampai barang terkirim ke luar negeri." },
    { icon: <Scale />, title: "Info Aturan Resmi", desc: "Cek syarat BPOM, Bea Cukai, dan aturan negara tujuan dengan bahasa yang mudah." },
    { icon: <Package />, title: "Cek Kemasan", desc: "Verifikasi label & kemasan agar sesuai aturan negara tujuan secara otomatis." },
  ];

  return (
    <section id="fitur" className="relative py-24 px-6 overflow-hidden">
      {/* Layer 1: Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1546702005-7f8e5aeab4a6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Indonesian MSME"
          className="w-full h-full object-cover"
        />
        {/* Layer 2: Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />
      </div>

      <div className="max-w-6xl mx-auto relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-fadeInUp">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white leading-tight mb-4">
              Fitur yang <span className="text-accent">Memudahkan</span> Bisnis
              Anda.
            </h2>
            <p className="text-white/70 font-medium text-lg leading-relaxed">
              Semua alat yang Anda butuhkan untuk mulai menjadi eksportir
              sukses, dalam satu aplikasi yang sangat mudah digunakan.
            </p>
          </div>
          <Link
            to="/demo"
            className="btn-primary mb-2 shadow-xl shadow-accent/20"
          >
            Coba Fitur Sekarang
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm border border-white/20 p-10 rounded-[2rem] animate-fadeInUp shadow-2xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-4xl mb-8 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                {f.title}
              </h3>
              <p className="text-white/60 leading-relaxed font-bold">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
