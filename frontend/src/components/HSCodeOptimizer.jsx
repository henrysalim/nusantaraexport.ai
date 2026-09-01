import { useState } from 'react'
import { Search, Tag, ArrowRight } from 'lucide-react'
import { classifyHSCode } from '../services/api'
import AIConfidenceBadge from './AIConfidenceBadge'
import { SkeletonHSCode } from './SkeletonLoader'

export default function HSCodeOptimizer() {
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [aiMetadata, setAiMetadata] = useState(null)

  const handleClassify = async () => {
    if (!product) return
    setLoading(true)
    setResult(null)
    setError('')
    setAiMetadata(null)
    try {
      const response = await classifyHSCode({ product_name: product })
      setResult(response.data)
      setAiMetadata(response.data.ai_metadata || null)
    } catch (err) {
      console.error('HS Code API error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Klasifikasi HS Code dan optimasi tarif FTA">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">HS Code & Tarif FTA</h3>
          <p className="text-xs text-secondary/50 font-medium">Klasifikasi produk dan hitung tarif preferensial dari 16 perjanjian dagang</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Masukkan nama produk (contoh: Kopi Arabika)"
          className="flex-1 px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleClassify()}
        />
        <button onClick={handleClassify} disabled={loading} className="btn-primary px-6">
          {loading ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> : <Search size={20} />}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && <SkeletonHSCode />}

      {result && !loading && (
        <div className="animate-fadeInUp space-y-4">
          {/* HS Code Result */}
          <div className="bg-slate-soft p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Klasifikasi HS Code</span>
                {result.data_source && (
                  <span className="text-[9px] font-bold text-accent/80">{result.data_source}</span>
                )}
              </div>
              <span className="px-3 py-1 bg-secondary text-white rounded-lg text-xs font-black">{result.hs_code}</span>
            </div>
            <p className="text-sm font-bold text-secondary mb-1">{result.product}</p>
            <p className="text-xs text-secondary/50 leading-relaxed mb-2">{result.description}</p>
            {result.reason && (
              <p className="text-xs text-secondary/40 italic bg-white/50 p-2 rounded-lg border border-slate-100 mb-2">
                💡 {result.reason}
              </p>
            )}
            <p className="text-[10px] font-semibold text-secondary/40">{result.chapter}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-secondary/40 font-bold">Tarif MFN (tanpa FTA):</span>
              <span className="text-sm font-black text-red-500">{result.mfn_tariff}</span>
            </div>
          </div>

          {/* FTA Table */}
          <div>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Tarif Preferensial via FTA</p>
            <div className="space-y-2">
              {result.fta_results.map((fta, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-secondary">{fta.agreement}</p>
                    <p className="text-xs text-secondary/40">Hemat: {fta.saving}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${fta.tariff === '0%' ? 'text-green-600' : 'text-accent'}`}>{fta.tariff}</span>
                    <p className="text-[9px] text-green-600 font-bold">{fta.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best FTA */}
          <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-1">FTA Terbaik untuk Produk Anda</p>
              <p className="text-lg font-black text-green-800">{result.best_fta}</p>
              <p className="text-sm text-green-600 font-bold">Potensi penghematan: {result.best_saving}</p>
            </div>
            <ArrowRight size={24} className="text-green-400" />
          </div>

          {/* AI Confidence Badge */}
          {aiMetadata && (
            <div className="space-y-2">
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
