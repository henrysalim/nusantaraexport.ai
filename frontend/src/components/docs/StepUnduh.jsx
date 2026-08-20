import { Download, CheckCircle2, FileText, Package, FileCheck, Truck,
  ScrollText, FileSignature, Users, FileBarChart2 } from 'lucide-react'

const DOC_LIST = [
  {
    key: 'invoice',
    icon: FileText,
    title: 'Commercial Invoice',
    desc: 'Faktur komersial resmi antara eksportir dan importir',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    key: 'proforma-invoice',
    icon: FileCheck,
    title: 'Proforma Invoice',
    desc: 'Invoice awal sebelum pengiriman, termasuk syarat pembayaran',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    key: 'packing-list',
    icon: Package,
    title: 'Packing List',
    desc: 'Daftar rinci pengepakan dan berat barang dalam container',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    key: 'shipping-instruction',
    icon: Truck,
    title: 'Shipping Instruction',
    desc: 'Instruksi pengiriman kepada perusahaan pelayaran',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    key: 'surat-penawaran',
    icon: ScrollText,
    title: 'Surat Penawaran',
    desc: 'Export quotation resmi kepada calon pembeli luar negeri',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    key: 'sales-contract-buyer',
    icon: FileSignature,
    title: 'Sales Contract',
    desc: 'Kontrak penjualan internasional antara eksportir dan buyer',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    key: 'kontrak-supplier',
    icon: Users,
    title: 'Kontrak Supplier',
    desc: 'Perjanjian kerjasama eksklusif dengan agen/supplier',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    key: 'surat-jalan',
    icon: Truck,
    title: 'Surat Jalan',
    desc: 'Dokumen pengiriman barang dari gudang ke pelabuhan',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    key: 'perhitungan-biaya',
    icon: FileBarChart2,
    title: 'Perhitungan Biaya Ekspor',
    desc: 'Kalkulasi biaya FOB/CIF/EXW lengkap untuk negosiasi',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
]

export default function StepUnduh({ docId, downloading, downloaded, onDownload }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle2 size={20} />
          <span className="font-black text-base">Semua data tersimpan!</span>
        </div>
        <p className="text-white/70 text-sm">
          Klik tombol "Unduh PDF" pada setiap dokumen di bawah untuk mengunduh.
        </p>
      </div>

      {/* Doc Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DOC_LIST.map((doc) => {
          const Icon = doc.icon
          const isDownloading = downloading[doc.key]
          const isDone = downloaded[doc.key]

          return (
            <div
              key={doc.key}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3
                hover:border-accent/20 hover:shadow-sm transition-all group"
            >
              {/* Doc Icon + Info */}
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${doc.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={doc.color} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-secondary text-sm leading-tight">{doc.title}</p>
                  <p className="text-xs text-secondary/40 leading-snug mt-0.5">{doc.desc}</p>
                </div>
              </div>

              {/* Download Button */}
              {isDone ? (
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                  <CheckCircle2 size={13} />
                  Berhasil diunduh!
                </div>
              ) : (
                <button
                  onClick={() => onDownload(doc.key)}
                  disabled={isDownloading || !docId}
                  className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-black
                    transition-all
                    ${!docId
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isDownloading
                        ? 'bg-accent-light text-accent cursor-wait'
                        : 'bg-accent-light text-accent hover:bg-accent hover:text-white group-hover:scale-[1.02]'
                    }`}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      Unduh PDF
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!docId && (
        <p className="text-xs text-secondary/40 text-center">
          ⚠️ Draft belum tersimpan. Kembali ke langkah sebelumnya untuk menyimpan data.
        </p>
      )}
    </div>
  )
}
