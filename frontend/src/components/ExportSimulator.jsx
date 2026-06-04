import { useState } from 'react'
import { ClipboardCheck, Truck, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, ChevronRight } from 'lucide-react'
import { simulateReadiness, simulateDryRun } from '../services/api'

const RISK_CONFIG = {
  low: { color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: '🟢 Rendah' },
  medium: { color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: '🟡 Sedang' },
  high: { color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: '🔴 Tinggi' },
  very_high: { color: 'bg-red-100 border-red-300', badge: 'bg-red-200 text-red-800', label: '🔴 Sangat Tinggi' },
}

const DESTINATIONS = [
  { value: 'jp', label: 'Jepang' },
  { value: 'cn', label: 'Tiongkok' },
  { value: 'us', label: 'Amerika Serikat' },
  { value: 'de', label: 'Jerman' },
  { value: 'au', label: 'Australia' },
  { value: 'kr', label: 'Korea Selatan' },
  { value: 'sg', label: 'Singapura' },
]

export default function ExportSimulator() {
  const [product, setProduct] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [readinessResult, setReadinessResult] = useState(null)
  const [dryRunResult, setDryRunResult] = useState(null)
  const [activeCheckpoint, setActiveCheckpoint] = useState(null)
  const [activeSection, setActiveSection] = useState('readiness') // 'readiness' | 'dryrun'
  const [error, setError] = useState('')

  const destLabel = DESTINATIONS.find(d => d.value === destination)?.label || destination

  const handleSimulate = async () => {
    if (!product) return
    setLoading(true)
    setReadinessResult(null)
    setDryRunResult(null)
    setError('')

    try {
      // Call both APIs in parallel
      const [readinessRes, dryRunRes] = await Promise.all([
        simulateReadiness({
          commodity: product,
          destination: destination || 'jp',
          documents: ['NIB', 'Commercial Invoice', 'Packing List'],
          packaging_ready: true,
        }),
        simulateDryRun({
          commodity: product,
          destination: destLabel || 'Jepang',
          documents: ['NIB', 'Commercial Invoice', 'Packing List', 'CoA', 'SKA', 'PEB'],
        }),
      ])
      setReadinessResult(readinessRes.data)
      setDryRunResult(dryRunRes.data)
    } catch (err) {
      console.error('Simulator API error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (s) => {
    if (s === 'pass' || s === 'complete') return <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
    if (s === 'warning' || s === 'partial') return <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
    return <XCircle size={14} className="text-red-500 flex-shrink-0" />
  }

  const hasResults = readinessResult && dryRunResult

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Simulasi Ekspor Terpadu">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Simulasi Ekspor</h3>
          <p className="text-xs text-secondary/50 font-medium">Analisis kesiapan + simulasi perjalanan ekspor dalam satu langkah</p>
        </div>
      </div>

      {/* Input Form */}
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
            {DESTINATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={handleSimulate} disabled={loading || !product} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis kesiapan & rute ekspor...
          </span>
        ) : '🚀 Mulai Simulasi Ekspor'}
      </button>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      )}

      {/* Results */}
      {hasResults && !loading && (
        <div className="space-y-6 animate-fadeInUp">
          {/* Section Toggle */}
          <div className="flex rounded-2xl bg-slate-soft p-1 border border-slate-200">
            <button
              onClick={() => setActiveSection('readiness')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                activeSection === 'readiness' ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'
              }`}
            >
              <ClipboardCheck size={16} /> Kesiapan Ekspor
            </button>
            <button
              onClick={() => setActiveSection('dryrun')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                activeSection === 'dryrun' ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'
              }`}
            >
              <Truck size={16} /> Rute Ekspor
            </button>
          </div>

          {/* =================== READINESS SECTION =================== */}
          {activeSection === 'readiness' && readinessResult && (
            <div className="space-y-5 animate-fadeInUp">
              {/* Overall Score */}
              <div className="bg-slate-soft p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-secondary/50 mb-1">{readinessResult.product} → {readinessResult.destination}</p>
                  <p className="text-xs font-black text-secondary/30 uppercase tracking-widest">Skor Kesiapan Ekspor</p>
                </div>
                <div className="text-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessResult.overall_score >= 80 ? '#22c55e' : readinessResult.overall_score >= 60 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${readinessResult.overall_score}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-secondary">{readinessResult.overall_score}</span>
                    </div>
                  </div>
                  <p className={`text-xs font-black mt-1 ${readinessResult.overall_score >= 80 ? 'text-green-600' : readinessResult.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{readinessResult.status}</p>
                </div>
              </div>

              {/* Document Categories */}
              {readinessResult.categories.map((cat, ci) => (
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
                  {Object.entries(readinessResult.cost_breakdown).filter(([k]) => k !== 'total').map(([key, item]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-secondary/60 font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-secondary">{item.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                    <span className="font-black text-secondary">TOTAL ESTIMASI</span>
                    <span className="text-lg font-black text-accent">{readinessResult.cost_breakdown.total}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-soft px-5 py-3 flex justify-between items-center">
                  <span className="text-sm font-black text-secondary">Timeline Pengiriman</span>
                  <span className="text-xs font-black text-accent">{readinessResult.total_timeline}</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-col">
                    {readinessResult.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3 pb-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0" />
                          {i < readinessResult.timeline.length - 1 && <div className="w-px flex-1 bg-accent/20 mt-1" />}
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
                  {readinessResult.risks.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 ${r.level === 'high' ? 'bg-red-50 border-red-100' : r.level === 'medium' ? 'bg-yellow-50 border-yellow-100' : 'bg-slate-50 border-slate-100'}`}>
                      {r.level === 'high' ? <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> : r.level === 'medium' ? <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" /> : <TrendingUp size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
                      <p className="text-xs font-medium text-secondary">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================== DRY RUN SECTION =================== */}
          {activeSection === 'dryrun' && dryRunResult && (
            <div className="space-y-4 animate-fadeInUp">
              {/* Overall Risk Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${dryRunResult.overall_risk === 'RENDAH' ? 'bg-green-50 border-green-200' : dryRunResult.overall_risk === 'SEDANG' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <Shield size={20} className={dryRunResult.overall_risk === 'RENDAH' ? 'text-green-500' : dryRunResult.overall_risk === 'SEDANG' ? 'text-yellow-500' : 'text-red-500'} />
                  <div>
                    <p className="text-xs font-black text-secondary/40 uppercase tracking-widest">Risiko Keseluruhan</p>
                    <p className="text-lg font-black text-secondary">{dryRunResult.overall_risk}</p>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-soft p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-secondary leading-relaxed">{dryRunResult.recommendation}</p>
              </div>

              {/* Checkpoint Journey */}
              <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Checkpoint Perjalanan Ekspor</p>
              <div className="space-y-3">
                {dryRunResult.checkpoints.map((cp, i) => {
                  const risk = RISK_CONFIG[cp.risk_level] || RISK_CONFIG.medium
                  const isActive = activeCheckpoint === i
                  return (
                    <div key={i} className="relative">
                      {i < dryRunResult.checkpoints.length - 1 && (
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
                            {statusIcon(cp.doc_status)}
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
      )}
    </div>
  )
}
