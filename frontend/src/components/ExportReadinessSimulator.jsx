import { useState } from 'react'
import { ClipboardCheck, CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'

const MOCK_SIM = {
  kopi: {
    product: 'Kopi Arabika Gayo',
    destination: 'Jepang',
    overall_score: 78,
    status: 'Hampir Siap',
    categories: [
      {
        name: 'Kelengkapan Dokumen',
        score: 65,
        items: [
          { doc: 'NIB (Nomor Induk Berusaha)', status: 'pass' },
          { doc: 'Surat Keterangan Asal (SKA) Form IJEPA', status: 'warning', note: 'Perlu diajukan ke Dinas Perindag' },
          { doc: 'Phytosanitary Certificate', status: 'fail', note: 'Wajib — ajukan ke Karantina Pertanian' },
          { doc: 'ICO Certificate of Origin', status: 'fail', note: 'Wajib untuk kopi — hubungi AEKI' },
          { doc: 'Commercial Invoice', status: 'pass' },
          { doc: 'Packing List', status: 'pass' },
          { doc: 'Bill of Lading', status: 'warning', note: 'Diurus oleh freight forwarder' },
        ]
      },
      {
        name: 'Kesiapan Sertifikasi',
        score: 85,
        items: [
          { doc: 'BPOM / Food Safety', status: 'pass' },
          { doc: 'Sertifikat Halal MUI', status: 'pass' },
          { doc: 'Japan Food Sanitation Act', status: 'warning', note: 'Label Jepang perlu ditambahkan' },
          { doc: 'Uji Lab Residu Pestisida', status: 'pass' },
        ]
      },
      {
        name: 'Kepatuhan Kemasan',
        score: 80,
        items: [
          { doc: 'Label Bahasa Inggris', status: 'pass' },
          { doc: 'Label Bahasa Jepang', status: 'warning', note: 'Diperlukan untuk pasar Jepang' },
          { doc: 'Nutrition Facts', status: 'pass' },
          { doc: 'Country of Origin', status: 'pass' },
        ]
      }
    ],
    cost_breakdown: {
      production: { label: 'Biaya Produksi (2 ton)', amount: 'Rp 150.000.000' },
      freight: { label: 'Freight (FCL 20ft → Yokohama)', amount: 'Rp 32.000.000' },
      insurance: { label: 'Asuransi Kargo', amount: 'Rp 3.500.000' },
      docs: { label: 'Pengurusan Dokumen & Sertifikasi', amount: 'Rp 8.500.000' },
      customs: { label: 'Handling & Clearance', amount: 'Rp 6.000.000' },
      total: 'Rp 200.000.000',
    },
    timeline: [
      { phase: 'Persiapan Dokumen', duration: '7-10 hari kerja' },
      { phase: 'Pengemasan & Stuffing', duration: '3-5 hari kerja' },
      { phase: 'Customs Clearance Asal', duration: '2-3 hari kerja' },
      { phase: 'Transit Laut', duration: '14-18 hari' },
      { phase: 'Customs Clearance Tujuan', duration: '3-5 hari kerja' },
    ],
    total_timeline: '29-41 hari',
    risks: [
      { level: 'high', desc: 'Phytosanitary Certificate belum ada — pengiriman akan ditolak tanpa dokumen ini' },
      { level: 'medium', desc: 'Label bahasa Jepang diperlukan — barang bisa ditahan di karantina Jepang' },
      { level: 'low', desc: 'Waktu transit bervariasi tergantung musim dan rute kapal' },
    ]
  }
}

export default function ExportReadinessSimulator() {
  const [product, setProduct] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSimulate = () => {
    if (!product) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(MOCK_SIM.kopi)
      setLoading(false)
    }, 2500)
  }

  const statusIcon = (s) => {
    if (s === 'pass') return <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
    if (s === 'warning') return <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
    return <XCircle size={14} className="text-red-500 flex-shrink-0" />
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Simulasi kesiapan ekspor">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Simulasi Kesiapan Ekspor</h3>
          <p className="text-xs text-secondary/50 font-medium">Cek kelengkapan, hitung biaya, dan periksa risiko sebelum ekspor</p>
        </div>
      </div>

      {/* Input */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama Produk</label>
          <input
            type="text"
            placeholder="Contoh: Kopi Arabika"
            className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Negara Tujuan</label>
          <select
            className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Pilih negara</option>
            <option value="jp">Jepang</option>
            <option value="cn">Tiongkok</option>
            <option value="us">Amerika Serikat</option>
            <option value="de">Jerman</option>
            <option value="au">Australia</option>
            <option value="kr">Korea Selatan</option>
            <option value="sg">Singapura</option>
          </select>
        </div>
      </div>
      <button onClick={handleSimulate} disabled={loading} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis kesiapan ekspor...
          </span>
        ) : 'Mulai Simulasi'}
      </button>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeInUp">
          {/* Overall Score */}
          <div className="bg-slate-soft p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-secondary/50 mb-1">{result.product} → {result.destination}</p>
              <p className="text-xs font-black text-secondary/30 uppercase tracking-widest">Skor Kesiapan Ekspor</p>
            </div>
            <div className="text-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={result.overall_score >= 80 ? '#22c55e' : result.overall_score >= 60 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${result.overall_score}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-secondary">{result.overall_score}</span>
                </div>
              </div>
              <p className={`text-xs font-black mt-1 ${result.overall_score >= 80 ? 'text-green-600' : result.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{result.status}</p>
            </div>
          </div>

          {/* Document Categories */}
          {result.categories.map((cat, ci) => (
            <div key={ci} className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-soft px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-black text-secondary">{cat.name}</span>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${cat.score >= 80 ? 'bg-green-100 text-green-700' : cat.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{cat.score}/100</span>
              </div>
              <div className="p-4 space-y-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2 py-1">
                    {statusIcon(item.status)}
                    <div>
                      <span className="text-sm font-bold text-secondary">{item.doc}</span>
                      {item.note && <p className="text-xs text-secondary/40">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Cost Breakdown */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3">
              <span className="text-sm font-black text-secondary">Estimasi Biaya Ekspor</span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(result.cost_breakdown).filter(([k]) => k !== 'total').map(([key, item]) => (
                <div key={key} className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-secondary/60 font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-secondary">{item.amount}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                <span className="font-black text-secondary">TOTAL ESTIMASI</span>
                <span className="text-lg font-black text-accent">{result.cost_breakdown.total}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3 flex justify-between items-center">
              <span className="text-sm font-black text-secondary">Timeline Pengiriman</span>
              <span className="text-xs font-black text-accent">{result.total_timeline}</span>
            </div>
            <div className="p-4">
              <div className="flex flex-col">
                {result.timeline.map((t, i) => (
                  <div key={i} className="flex gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0" />
                      {i < result.timeline.length - 1 && <div className="w-px flex-1 bg-accent/20 mt-1" />}
                    </div>
                    <div className="flex justify-between w-full pb-2">
                      <span className="text-sm font-bold text-secondary">{t.phase}</span>
                      <span className="text-xs font-black text-secondary/40">{t.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risks */}
          <div>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Identifikasi Risiko</p>
            <div className="space-y-2">
              {result.risks.map((r, i) => (
                <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 ${r.level === 'high' ? 'bg-red-50 border-red-100' : r.level === 'medium' ? 'bg-yellow-50 border-yellow-100' : 'bg-slate-50 border-slate-100'}`}>
                  {r.level === 'high' ? <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> : r.level === 'medium' ? <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" /> : <TrendingUp size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
                  <p className="text-xs font-medium text-secondary">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
