import { Search, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const GLOSSARY_TERMS = [
  {
    term: "HS Code",
    simple: "Nomor KTP Barang",
    desc: "Kode angka internasional untuk mengidentifikasi jenis produk Anda agar bisa melewati bea cukai seluruh dunia dengan lancar.",
  },
  {
    term: "FTA (Perjanjian Dagang)",
    simple: "Diskon Pajak Antar Negara",
    desc: "Kesepakatan antar negara yang memungkinkan produk Anda masuk dengan pajak lebih rendah atau bahkan nol persen. Indonesia punya 16 FTA aktif.",
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
    desc: "Cara pembayaran paling aman di mana bank pembeli menjamin uang akan cair ke Anda jika syarat pengiriman sudah terpenuhi.",
  },
  {
    term: "Freight Forwarder",
    simple: "Jasa Kirim Ekspor",
    desc: "Perusahaan jasa pengiriman barang internasional yang membantu mengurus logistik lewat kapal atau pesawat, termasuk dokumen perjalanannya.",
  },
  {
    term: "SKA (Surat Keterangan Asal)",
    simple: "Akta Kelahiran Barang",
    desc: "Dokumen yang membuktikan bahwa produk benar-benar asli buatan Indonesia, sering digunakan untuk mendapatkan tarif FTA lebih murah.",
  },
  {
    term: "BPOM",
    simple: "Sertifikat Aman Konsumsi",
    desc: "Izin resmi dari Badan Pengawas Obat dan Makanan yang menyatakan produk makanan, obat, atau kosmetik Anda aman dikonsumsi.",
  },
  {
    term: "Bea Cukai",
    simple: "Petugas Pintu Negara",
    desc: "Instansi pemerintah yang mengawasi keluar-masuknya barang antar negara dan memungut pajak impor jika diperlukan.",
  },
  {
    term: "Margin",
    simple: "Sisa Untung Bersih",
    desc: "Berapa banyak uang yang benar-benar masuk ke kantong Anda setelah semua biaya produksi dan pengiriman dikurangi dari harga jual.",
  },
  {
    term: "RAG",
    simple: "AI yang Baca Buku Dulu",
    desc: "Teknologi di balik NusantaraExport.AI — AI tidak mengarang jawaban, tapi membaca dokumen resmi terlebih dahulu baru menjawab.",
  },
];

export default function GlossaryPanel({ isOpen, onClose }) {
  const [search, setSearch] = useState("");
  const closeButtonRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredTerms = GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.simple.toLowerCase().includes(search.toLowerCase()),
  );

  // Focus management: focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Trap focus and handle Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      id="glossary-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Kamus istilah ekspor dalam bahasa sederhana"
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      aria-hidden={!isOpen}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="p-6 bg-secondary text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black">Kamus Ekspor</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">
            Bahasa Sederhana untuk UMKM
          </p>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-2xl"
          aria-label="Tutup kamus ekspor"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
        <Search size={20} className="text-secondary/30 ml-2" aria-hidden="true" />
        <label htmlFor="glossary-search" className="sr-only">Cari istilah ekspor</label>
        <input
          ref={searchInputRef}
          id="glossary-search"
          type="text"
          placeholder="Cari istilah sulit..."
          className="w-full py-3 bg-transparent text-sm font-bold focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" role="list" aria-label="Daftar istilah ekspor">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((t, i) => (
            <div
              key={i}
              className="group animate-fadeInUp"
              style={{ animationDelay: `${i * 50}ms` }}
              role="listitem"
              tabIndex={0}
              aria-label={`${t.term} artinya ${t.simple}: ${t.desc}`}
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
              <div className="h-px w-12 bg-slate-100 mt-4 group-hover:w-full transition-all" aria-hidden="true" />
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4 text-secondary/20" aria-hidden="true">
                <Info size={48} />
            </div>
            <p className="text-secondary/40 font-bold" role="status">
              Istilah tidak ditemukan.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-center font-bold text-secondary/40">
          NusantaraExport.AI — Platform Inklusif untuk UMKM Indonesia
        </p>
      </div>
    </div>
  );
}
