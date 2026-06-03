import { useState } from 'react'
import { Truck, CheckCircle2, AlertTriangle, XCircle, Shield, ChevronRight } from 'lucide-react'
import { simulateDryRun } from '../services/api'

const RISK_CONFIG = {
  low: { color: 'bg-green-50 border-green-200', icon: 'text-green-500', badge: 'bg-green-100 text-green-700', label: '🟢 Rendah' },
  medium: { color: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: '🟡 Sedang' },
  high: { color: 'bg-red-50 border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700', label: '🔴 Tinggi' },
  very_high: { color: 'bg-red-100 border-red-300', icon: 'text-red-600', badge: 'bg-red-200 text-red-800', label: '🔴 Sangat Tinggi' },
}

const MOCK_RESULT = {
  product: 'Kopi Arabika',
  destination: 'Jepang',
  checkpoints: [
    { checkpoint: 'Gudang UMKM (Origin)', description: 'Menyiapkan CoA & SKA', documents: ['CoA', 'SKA'], risk_level: 'low', risk_detail: 'Pastikan QC kemasan aman', doc_status: 'complete' },
    { checkpoint: 'Pabean Keberangkatan', description: 'Upload PEB & NPE ke INSW', documents: ['PEB', 'NPE'], risk_level: 'medium', risk_detail: 'Kesalahan HS Code 8-digit sering terjadi', doc_status: 'partial' },
    { checkpoint: 'Terminal Peti Kemas', description: 'Pemeriksaan Karantina', documents: ['Phytosanitary', 'Fumigation'], risk_level: 'high', risk_detail: 'Kontaminasi serangga dapat menyebabkan penolakan', doc_status: 'missing' },
    { checkpoint: 'Transit Logistik', description: 'Penerbitan B/L & monitoring', documents: ['Bill of Lading', 'Insurance'], risk_level: 'medium', risk_detail: 'Keterlambatan jadwal pelayaran', doc_status: 'partial' },
    { checkpoint: 'Pabean Tujuan', description: 'Import Clearance & SPS', documents: ['Import Declaration', 'SPS Certificate'], risk_level: 'very_high', risk_detail: 'Kemasan tanpa label lokal akan ditahan', doc_status: 'missing' },
    { checkpoint: 'Gudang Buyer', description: 'Serah terima & pencairan L/C', documents: ['Delivery Order'], risk_level: 'low', risk_detail: 'Pencairan sisa 70% via L/C', doc_status: 'complete' },
  ],
  overall_risk: 'TINGGI',
  recommendation: '⚠️ Ada checkpoint berisiko tinggi. Lengkapi semua dokumen sebelum pengiriman!'
}

export default function ExportDryRun() {
  const [commodity, setCommodity] = useState('')
  const [destination, setDestination] = useState('Jepang')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeCheckpoint, setActiveCheckpoint] = useState(null)

  const handleSimulate = async () => {
    if (!commodity) return
    setLoading(true)
    setResult(null)
    try {
      const response = await simulateDryRun({ commodity, destination, documents: ['CoA', 'SKA', 'PEB'] })
      setResult(response.data)
    } catch (error) {
      console.warn('API offline, using mock:', error.message)
      await new Promise(r => setTimeout(r, 2000))
      setResult(MOCK_RESULT)
    } finally {
      setLoading(false)
    }
  }

  const docStatusIcon = (s) => {
    if (s === 'complete') return <CheckCircle2 size={14} className="text-green-500" />
    if (s === 'partial') return <AlertTriangle size={14} className="text-yellow-500" />
    return <XCircle size={14} className="text-red-500" />
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Export Dry Run Simulator">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <Truck size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Export Dry Run</h3>
          <p className="text-xs text-secondary/50 font-medium">Simulasikan perjalanan produk dari gudang hingga ke tangan buyer</p>
        </div>
      </div>

      {/* Input */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Komoditas</label>
          <input type="text" placeholder="Contoh: Kopi Arabika" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Negara Tujuan</label>
          <input type="text" placeholder="Contoh: Jepang" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>
      </div>
      <button onClick={handleSimulate} disabled={loading} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Mensimulasikan rute ekspor...
          </span>
        ) : '🚚 Mulai Dry Run Simulasi'}
      </button>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          {/* Overall Risk Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${result.overall_risk === 'RENDAH' ? 'bg-green-50 border-green-200' : result.overall_risk === 'SEDANG' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              <Shield size={20} className={result.overall_risk === 'RENDAH' ? 'text-green-500' : result.overall_risk === 'SEDANG' ? 'text-yellow-500' : 'text-red-500'} />
              <div>
                <p className="text-xs font-black text-secondary/40 uppercase tracking-widest">Risiko Keseluruhan</p>
                <p className="text-lg font-black text-secondary">{result.overall_risk}</p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-soft p-4 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-secondary leading-relaxed">{result.recommendation}</p>
          </div>

          {/* Checkpoint Journey */}
          <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Checkpoint Perjalanan Ekspor</p>
          <div className="space-y-3">
            {result.checkpoints.map((cp, i) => {
              const risk = RISK_CONFIG[cp.risk_level] || RISK_CONFIG.medium
              const isActive = activeCheckpoint === i
              return (
                <div key={i} className="relative">
                  {/* Connector Line */}
                  {i < result.checkpoints.length - 1 && (
                    <div className="absolute left-5 top-14 w-0.5 h-6 bg-slate-200" style={{ zIndex: 0 }} />
                  )}
                  <button
                    onClick={() => setActiveCheckpoint(isActive ? null : i)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${risk.color} hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-secondary shadow-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-secondary">{cp.checkpoint}</p>
                          <p className="text-xs text-secondary/50">{cp.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {docStatusIcon(cp.doc_status)}
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${risk.badge}`}>{risk.label}</span>
                        <ChevronRight size={14} className={`text-secondary/30 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2 animate-fadeInUp">
                        <div>
                          <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-1">Dokumen Diperlukan:</p>
                          <div className="flex flex-wrap gap-1">
                            {cp.documents.map((doc, di) => (
                              <span key={di} className="px-2 py-0.5 bg-white rounded-md text-[10px] font-bold text-secondary/60 border border-slate-100">{doc}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-1">Analisis Risiko:</p>
                          <p className="text-xs font-medium text-secondary/70">{cp.risk_detail}</p>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
