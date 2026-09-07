import { Download, CheckCircle2, FileText, Package, FileCheck, Truck,
  ScrollText, FileSignature, Users, FileBarChart2, AlertCircle, ArrowLeft } from 'lucide-react'

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

function evaluateCompleteness(formData) {
  if (!formData) return { isComplete: false, isEmpty: true, missing: ['Produk & Buyer', 'Pengiriman', 'Keuangan'] }

  const missing = []

  // Step 1: Produk & Buyer check
  const hasProduct = Boolean(
    (formData.buyer_name && formData.buyer_name.trim()) ||
    (formData.product_name && formData.product_name.trim()) ||
    (formData.items && formData.items.some(i => i.name && i.name.trim()))
  )
  if (!hasProduct) missing.push('Produk & Buyer')

  // Step 2: Pengiriman check
  const hasShipping = Boolean(
    (formData.port_loading && formData.port_loading.trim()) ||
    (formData.port_destination && formData.port_destination.trim()) ||
    (formData.container_no && formData.container_no.trim())
  )
  if (!hasShipping) missing.push('Pengiriman')

  // Step 3: Keuangan check
  const hasFinance = Boolean(
    formData.usd_idr_rate ||
    formData.price_at_warehouse ||
    (formData.items && formData.items.some(i => i.price_usd && Number(i.price_usd) > 0)) ||
    (formData.bank_account && formData.bank_account.trim())
  )
  if (!hasFinance) missing.push('Keuangan')

  const isComplete = missing.length === 0
  const isEmpty = missing.length === 3

  return { isComplete, isEmpty, missing }
}

export default function StepUnduh({ docId, formData, downloading, downloaded, onDownload, onNavigateStep }) {
  const { isComplete, isEmpty, missing } = evaluateCompleteness(formData)

  return (
    <div className="space-y-4">
      {/* Dynamic Header Status */}
      {isComplete ? (
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="font-black text-base">Semua data lengkap & tersimpan!</span>
          </div>
          <p className="text-white/80 text-sm">
            Seluruh data ekspor telah terisi. Klik tombol "Unduh PDF" pada setiap dokumen di bawah untuk mengunduh.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 text-secondary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-amber-700 font-black text-base">
                <AlertCircle size={20} className="shrink-0 text-amber-600" />
                <span>Draft Tersimpan (Data Ekspor Belum Diisi)</span>
              </div>
              <p className="text-secondary/70 text-xs sm:text-sm leading-relaxed max-w-xl">
                Draft telah dibuat di sistem, tetapi data pada tab <strong>Produk & Buyer</strong>, <strong>Pengiriman</strong>, dan <strong>Keuangan</strong> masih kosong. Dokumen PDF yang diunduh akan memiliki kolom kosong.
              </p>
            </div>
            {onNavigateStep && (
              <button
                onClick={() => onNavigateStep(0)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shrink-0 shadow-md shadow-amber-600/20"
              >
                <ArrowLeft size={14} />
                Lengkapi Data Sekarang
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-5 text-secondary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-blue-800 font-black text-base">
                <AlertCircle size={20} className="shrink-0 text-blue-600" />
                <span>Sebagian Data Belum Lengkap</span>
              </div>
              <p className="text-secondary/70 text-xs sm:text-sm leading-relaxed max-w-xl">
                Draft Anda tersimpan, namun bagian <strong>{missing.join(', ')}</strong> belum terisi lengkap. Anda tetap dapat mengunduh PDF, namun disarankan melengkapi semua informasi agar dokumen valid.
              </p>
            </div>
            {onNavigateStep && (
              <button
                onClick={() => {
                  if (missing.includes('Produk & Buyer')) onNavigateStep(0)
                  else if (missing.includes('Pengiriman')) onNavigateStep(1)
                  else onNavigateStep(2)
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shrink-0 shadow-md shadow-blue-600/20"
              >
                <ArrowLeft size={14} />
                Lengkapi {missing[0]}
              </button>
            )}
          </div>
        </div>
      )}

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
                  disabled={isDownloading}
                  className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-black
                    transition-all
                    ${isDownloading
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
    </div>
  )
}
