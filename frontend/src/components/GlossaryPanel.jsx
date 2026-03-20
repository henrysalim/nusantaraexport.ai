import { Search, Info } from "lucide-react";
import { useState, useEffect } from "react";

export const GLOSSARY_TERMS = [
  {
    term: "HS Code",
    simple: "Nomor KTP Barang",
    desc: "Kode angka internasional untuk mengidentifikasi jenis produk Anda agar bisa melewati bea cukai seluruh dunia dengan lancar.",
  },
  {
    term: "Incoterms",
    simple: "Aturan Tanggung Jawab",
    desc: "Kesepakatan antara penjual dan pembeli tentang siapa yang membayar ongkir, siapa yang mengurus asuransi, dan kapan tanggung jawab barang berpindah tangan.",
  },
  {
    term: "Compliance",
    simple: "Kepatuhan Aturan",
    desc: "Memastikan produk Anda (bahan, kemasan, label) sudah sesuai dengan hukum dan standar keamanan di negara tujuan agar tidak ditahan petugas.",
  },
  {
    term: "Market Gap",
    simple: "Celah Rejeki",
    desc: "Kondisi di mana di suatu negara banyak pembeli yang butuh barang Anda, tapi penjualnya masih sedikit. Ini adalah peluang emas!",
  },
  {
    term: "Invoice",
    simple: "Nota Tagihan Resmi",
    desc: "Bukti tagihan resmi yang Anda kirim ke pembeli luar negeri untuk meminta pembayaran atas barang yang sudah disepakati.",
  },
  {
    term: "Packing List",
    simple: "Daftar Isi Kardus",
    desc: "Catatan mendetail tentang apa saja isi dalam setiap kotak atau kontainer yang Anda kirim, mulai dari berat hingga jumlahnya.",
  },
  {
    term: "Letter of Credit (L/C)",
    simple: "Jaminan Bayar Bank",
    desc: "Cara pembayaran paling aman di mana bank pembeli menjamin uang akan cair ke Anda jika syarat pengiriman sudah terpenuhi. Anti-tipu!",
  },
  {
    term: "Freight Forwarder",
    simple: "Jasa Kirim Ekspor",
    desc: "Perusahaan jasa yang membantu Anda mengurus pengiriman barang besar lewat kapal atau pesawat, termasuk urusan dokumen perjalanannya.",
  },
  {
    term: "Certificate of Origin (COO)",
    simple: "Akta Kelahiran Barang",
    desc: "Dokumen yang membuktikan bahwa produk tersebut benar-benar asli buatan Indonesia, sering digunakan untuk mendapatkan diskon pajak di negara tujuan.",
  },
  {
    term: "BPOM",
    simple: "Sertifikat Aman Konsumsi",
    desc: "Izin resmi dari pemerintah (Badan Pengawas Obat dan Makanan) yang menyatakan produk makanan, obat, atau kosmetik Anda aman untuk dikonsumsi manusia.",
  },
  {
    term: "Bea Cukai",
    simple: "Petugas Pintu Negara",
    desc: "Instansi pemerintah yang mengawasi keluar-masuknya barang antar negara dan memungut pajak jika diperlukan (Customs).",
  },
  {
    term: "Margin",
    simple: "Sisa Untung Bersih",
    desc: "Berapa banyak uang yang benar-benar masuk ke kantong Anda setelah semua biaya produksi dan pengiriman dikurangi dari harga jual.",
  },
];

export default function GlossaryPanel({ isOpen, onClose }) {
  const [search, setSearch] = useState("");

  const filteredTerms = GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.simple.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="p-6 bg-secondary text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black">Kamus Ekspor</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">
            Bahasa Manusia untuk UMKM
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-2xl"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
        <Search size={20} className="text-secondary/30 ml-2" />
        <input
          type="text"
          placeholder="Cari istilah sulit..."
          className="w-full py-3 bg-transparent text-sm font-bold focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((t, i) => (
            <div
              key={i}
              className="group animate-fadeInUp"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-black text-secondary">
                  {t.term}
                </span>
                <span className="px-2 py-0.5 bg-accent-light text-accent text-[10px] font-black rounded-lg uppercase">
                  {t.simple}
                </span>
              </div>
              <p className="text-sm text-secondary/60 leading-relaxed font-bold">
                {t.desc}
              </p>
              <div className="h-px w-12 bg-slate-100 mt-4 group-hover:w-full transition-all" />
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4 text-secondary/20">
                <Info size={48} />
            </div>
            <p className="text-secondary/40 font-bold">
              Istilah tidak ditemukan.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-center font-bold text-secondary/30">
          NusantaraExport.AI — Membangun Inklusivitas Kognitif
        </p>
      </div>
    </div>
  );
}
