import { Link } from "react-router-dom";
import { Mic, TrendingUp, FileText, ClipboardList, Scale, Package, Bell } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    { icon: <Mic />, title: "Tanya Lewat Suara atau Ketik", desc: "Bicara dalam bahasa Indonesia sehari-hari. AI langsung menjawab soal regulasi dan biaya ekspor dari sumber resmi." },
    { icon: <TrendingUp />, title: "Deteksi Peluang Pasar", desc: "Analisis data perdagangan dunia — temukan negara mana yang paling membutuhkan produk Anda saat ini." },
    { icon: <FileText />, title: "Buat Dokumen Ekspor", desc: "Invoice, packing list, dan surat keterangan asal dibuat otomatis. Tinggal cetak, tidak perlu ketik manual." },
    { icon: <Scale />, title: "Klasifikasi HS Code dan Tarif FTA", desc: "AI klasifikasikan produk Anda ke kode HS yang tepat dan hitung tarif preferensial dari 16 perjanjian dagang Indonesia." },
    { icon: <Package />, title: "Audit Kepatuhan Kemasan", desc: "Foto kemasan Anda, AI periksa apakah label, bahasa, dan informasi nutrisi sudah sesuai aturan negara tujuan." },
    { icon: <ClipboardList />, title: "Simulasi Kesiapan Ekspor", desc: "Cek kelengkapan dokumen, sertifikasi, dan hitung seluruh biaya ekspor sebelum berkomitmen mengirim barang." },
    { icon: <Bell />, title: "Notifikasi Perubahan Regulasi", desc: "Dapat pemberitahuan otomatis jika aturan ekspor berubah yang mempengaruhi produk dan negara tujuan Anda." },
  ];

  return (
    <section id="fitur" className="relative py-24 px-6 overflow-hidden" aria-labelledby="fitur-heading">
      {/* Background Image */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1546702005-7f8e5aeab4a6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/70 z-10" />
      </div>

      <div className="max-w-6xl mx-auto relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-fadeInUp">
          <div className="max-w-2xl">
            <h2 id="fitur-heading" className="text-4xl lg:text-5xl font-display font-black text-white leading-tight mb-4">
              Tujuh Fitur yang <span className="text-accent">Memudahkan</span> Bisnis
              Anda.
            </h2>
            <p className="text-white/70 font-medium text-lg leading-relaxed">
              Semua yang dibutuhkan UMKM untuk mulai menjadi eksportir,
              dari regulasi sampai dokumen, dalam satu platform yang inklusif dan mudah diakses.
            </p>
          </div>
          <Link
            to="/demo"
            className="btn-primary mb-2 shadow-xl shadow-accent/20"
          >
            Coba Fitur Sekarang
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Daftar fitur utama">
          {features.map((f, i) => (
            <div
              key={i}
              role="listitem"
              className="bg-white/10 backdrop-blur-sm border border-white/20 p-10 rounded-[2rem] animate-fadeInUp shadow-2xl focus-within:ring-2 focus-within:ring-accent"
              style={{ animationDelay: `${i * 100}ms` }}
              tabIndex={0}
              aria-label={`Fitur: ${f.title}. ${f.desc}`}
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white text-4xl mb-8 shadow-inner" aria-hidden="true">
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
