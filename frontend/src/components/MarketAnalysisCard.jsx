import { useState } from 'react'
import { Globe } from 'lucide-react'
import { analyzeMarketGap } from '../services/api'

export default function MarketAnalysisCard() {
  const [productName, setProductName] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!productName) return
    setLoading(true)
    setError('')
    try {
      const response = await analyzeMarketGap({ product_name: productName })
      setData(response.data)
    } catch (err) {
      console.error('Market API error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6" role="region" aria-label="Analisis peluang pasar ekspor">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 bg-accent-light rounded-lg flex items-center justify-center text-accent" aria-hidden="true">
          <Globe size={18} />
        </span>
        <h3 className="text-xl font-black text-secondary">Cek Peluang Pasar</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="market-input" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">
            Nama Produk
          </label>
          <input
            id="market-input"
            type="text"
            placeholder="Contoh: Kopi"
            className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary w-full justify-center py-4"
          aria-busy={loading}
        >
          {loading ? 'Menganalisis...' : 'Analisis Celah Pasar'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mt-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {data && (
        <div className="mt-2 pt-4 border-t border-slate-100 animate-fadeInUp" aria-live="polite">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-accent-light p-3 rounded-xl text-center">
              <span className="text-[9px] text-accent/60 font-bold uppercase tracking-widest block mb-0.5">Harga Rata-rata</span>
              <span className="text-sm font-black text-accent">{data.avg_price}</span>
            </div>
            <div className="bg-slate-soft p-3 rounded-xl text-center">
              <span className="text-[9px] text-secondary/40 font-bold uppercase tracking-widest block mb-0.5">Pertumbuhan</span>
              <span className="text-sm font-black text-green-600">{data.growth}</span>
            </div>
          </div>

          <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">
            Negara Tujuan Terbaik
          </div>
          {data.top_destinations.map((d, i) => (
            <div key={i} className="flex justify-between items-center bg-slate-soft p-3 rounded-xl mb-2">
              <span className="font-bold text-secondary text-sm">{d.country}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${d.score}%` }} />
                </div>
                <span className="text-accent font-black text-xs">{d.score}</span>
              </div>
            </div>
          ))}
          {data.gap_score && (
            <div className="mt-3 p-3 bg-accent-light rounded-xl text-center">
              <span className="text-[9px] text-accent/60 font-bold uppercase tracking-widest block mb-0.5">Skor Peluang Pasar</span>
              <span className="text-2xl font-black text-accent">{data.gap_score}%</span>
            </div>
          )}
          {data.ai_summary && (
            <div className="mt-4 p-4 border border-accent/20 bg-accent-light/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Market Insights</span>
              </div>
              <p className="text-sm font-medium text-secondary/80 leading-relaxed">{data.ai_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
