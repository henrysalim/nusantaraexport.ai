import { useState } from 'react'
import { AlertOctagon, Mail, FileText, DollarSign, Clock, ChevronDown } from 'lucide-react'
import { solvePostExport } from '../services/api'
import AIConfidenceBadge from './AIConfidenceBadge'
import AIThinkingPanel from './AIThinkingPanel'

const PROBLEM_TYPES = [
  { value: 'customs_hold', label: '📦 Barang Tertahan di Pabean', desc: 'Barang ditahan oleh bea cukai negara tujuan' },
  { value: 'transit_damage', label: '💥 Kerusakan Saat Transit', desc: 'Barang rusak selama pengiriman laut/udara' },
  { value: 'buyer_dispute', label: '⚖️ Sengketa dengan Buyer', desc: 'Perselisihan kualitas, kuantitas, atau pembayaran' },
  { value: 'logistics_delay', label: '⏰ Keterlambatan Logistik', desc: 'Pengiriman melebihi jadwal yang dijanjikan' },
]

export default function PostExportSolver() {
  const [problemType, setProblemType] = useState('')
  const [shipmentValue, setShipmentValue] = useState('10000')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showEmail, setShowEmail] = useState(false)
  const [showClaim, setShowClaim] = useState(false)
  const [error, setError] = useState('')
  const [aiMetadata, setAiMetadata] = useState(null)

  const handleSolve = async () => {
    if (!problemType) return
    setLoading(true)
    setResult(null)
    setError('')
    setAiMetadata(null)
    try {
      const response = await solvePostExport({
        problem_type: problemType,
        shipment_value: parseFloat(shipmentValue) || 10000,
        description,
      })
      setResult(response.data)
      setAiMetadata(response.data.ai_metadata || null)
    } catch (err) {
      console.error('Post-export API error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Post-Export Problem Solver">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <AlertOctagon size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Post-Export Problem Solver</h3>
          <p className="text-xs text-secondary/50 font-medium">Solusi cepat untuk masalah setelah barang dikirim</p>
        </div>
      </div>

      {/* Problem Type Selection */}
      <div className="mb-4">
        <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3 block">Jenis Masalah</label>
        <div className="grid sm:grid-cols-2 gap-2">
          {PROBLEM_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setProblemType(pt.value)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                problemType === pt.value
                  ? 'bg-red-50 border-red-200 ring-2 ring-red-200'
                  : 'bg-slate-soft border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-black text-secondary">{pt.label}</p>
              <p className="text-xs text-secondary/40 mt-0.5">{pt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Value & Description */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nilai Kargo (USD)</label>
          <input type="number" placeholder="10000" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={shipmentValue} onChange={(e) => setShipmentValue(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Deskripsi (opsional)</label>
          <input type="text" placeholder="Detail masalah..." className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <button onClick={handleSolve} disabled={loading || !problemType} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis solusi...
          </span>
        ) : '🚨 Cari Solusi'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {loading && <div className="space-y-3 animate-pulse"><div className="h-20 bg-slate-100 rounded-2xl" /><div className="h-32 bg-slate-100 rounded-2xl" /></div>}

      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          {/* Problem Title */}
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Masalah Terdeteksi</p>
            <p className="text-lg font-black text-secondary">{result.problem_title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={12} className="text-secondary/40" />
              <span className="text-xs font-medium text-secondary/50">{result.timeline}</span>
            </div>
          </div>

          {/* Resolution Steps */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3">
              <span className="text-sm font-black text-secondary">Langkah Penyelesaian</span>
            </div>
            <div className="p-4 space-y-3">
              {result.resolution_steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-secondary leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Impact */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3 flex items-center gap-2">
              <DollarSign size={14} className="text-accent" />
              <span className="text-sm font-black text-secondary">Dampak Finansial</span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(result.financial_impact).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-secondary/60 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={`text-sm font-bold ${key === 'recommendation' ? 'text-accent' : 'text-secondary'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Draft & Claim Form */}
          <div className="flex gap-2">
            <button onClick={() => { setShowEmail(!showEmail); setShowClaim(false) }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl text-sm font-bold text-secondary hover:bg-slate-100 transition-colors">
              <Mail size={14} />
              Draft Email
              <ChevronDown size={14} className={`transition-transform ${showEmail ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => { setShowClaim(!showClaim); setShowEmail(false) }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl text-sm font-bold text-secondary hover:bg-slate-100 transition-colors">
              <FileText size={14} />
              Form Klaim
              <ChevronDown size={14} className={`transition-transform ${showClaim ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showEmail && (
            <div className="bg-slate-soft p-5 rounded-2xl border border-slate-200 animate-fadeInUp">
              <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-3">Draft Email</p>
              <pre className="text-sm font-medium text-secondary leading-relaxed whitespace-pre-wrap font-sans">{result.email_draft}</pre>
              <button onClick={() => navigator.clipboard.writeText(result.email_draft)} className="mt-3 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors">
                📋 Salin Email
              </button>
            </div>
          )}

          {showClaim && (
            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200 animate-fadeInUp">
              <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-3">Template Form Klaim</p>
              <p className="text-sm font-bold text-secondary">{result.claim_form_template}</p>
            </div>
          )}

          {/* AI Transparency */}
          {aiMetadata && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {aiMetadata.thinking_steps?.length > 0 && (
                <AIThinkingPanel steps={aiMetadata.thinking_steps} />
              )}
              <AIConfidenceBadge
                tier={aiMetadata.ai_tier}
                confidence={aiMetadata.confidence}
                modelUsed={aiMetadata.model_used}
                responseTimeMs={aiMetadata.response_time_ms}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
