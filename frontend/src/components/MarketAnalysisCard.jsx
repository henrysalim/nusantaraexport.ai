import { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

export default function MarketAnalysisCard() {
  const [hsCode, setHsCode] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!hsCode) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/market/analyze`, { hs_code: hsCode })
      setData(res.data)
    } catch (err) {
      console.error('Market analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🌍</span>
        <h3 className="text-xl font-black text-secondary">Cek Peluang</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">
            Kode Produk (HS Code)
          </label>
          <input
            type="text"
            placeholder="Contoh: 0901 (Kopi)"
            className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary focus:border-accent outline-none"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary w-full justify-center py-4"
        >
          {loading ? 'Menganalisis...' : 'Analisis Celah Pasar'}
        </button>
      </div>

      {data && data.top_destinations && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeInUp">
          <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">
            Negara Tujuan Terbaik
          </div>
          {data.top_destinations.map((d, i) => (
            <div key={i} className="flex justify-between items-center bg-slate-soft p-4 rounded-xl mb-2">
              <span className="font-bold text-secondary">{d.country}</span>
              <span className="text-accent font-black">{d.score}/100</span>
            </div>
          ))}
          {data.gap_score && (
            <div className="mt-4 p-4 bg-accent-light rounded-xl text-center">
              <span className="text-xs text-accent/60 font-bold uppercase tracking-widest block mb-1">Gap Score</span>
              <span className="text-3xl font-black text-accent">{data.gap_score}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
