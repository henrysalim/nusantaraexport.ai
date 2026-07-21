import { useState } from 'react'
import { Handshake, TrendingUp, TrendingDown, Mail, DollarSign, Lightbulb, Info } from 'lucide-react'
import { analyzeNegotiation } from '../services/api'

export default function NegoCoach() {
  const [commodity, setCommodity] = useState('Kopi Arabika')
  const [buyerOffer, setBuyerOffer] = useState('')
  const [quantity, setQuantity] = useState('2000')
  const [destination, setDestination] = useState('Jepang')
  const [incoterm, setIncoterm] = useState('FOB')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showEmail, setShowEmail] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!buyerOffer) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const response = await analyzeNegotiation({
        commodity,
        buyer_offer_usd: parseFloat(buyerOffer),
        quantity_kg: parseFloat(quantity) || 2000,
        destination,
        incoterm,
      })
      setResult(response.data)
    } catch (err) {
      console.error('Nego API error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
    } finally {
      setLoading(false)
    }
  }

  const marginColor = (pct) => {
    if (pct < 0) return 'text-red-600'
    if (pct < 15) return 'text-orange-500'
    return 'text-green-600'
  }

  const bannerStyle = (pct) => {
    if (pct < 0) return 'bg-red-50 border-red-200'
    if (pct < 15) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Nego Coach - Analisis Tawaran Buyer">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <Handshake size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Nego Coach</h3>
          <p className="text-xs text-secondary/50 font-medium">Bandingkan tawaran buyer vs harga pasar & dapatkan counter-offer</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Komoditas</label>
          <input type="text" placeholder="Kopi Arabika" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Tawaran Buyer (USD/kg)</label>
          <input type="number" step="0.01" placeholder="3.50" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={buyerOffer} onChange={(e) => setBuyerOffer(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Kuantitas (kg)</label>
          <input type="number" placeholder="2000" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Negara Tujuan</label>
          <input type="text" placeholder="Jepang" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Incoterm</label>
          <div className="flex gap-2">
            {['FOB', 'CIF', 'EXW', 'DAP'].map(term => (
              <button
                key={term}
                onClick={() => setIncoterm(term)}
                className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${incoterm === term ? 'bg-accent text-white border-accent' : 'bg-slate-soft text-secondary/60 border-slate-200 hover:border-accent/50'}`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={loading || !buyerOffer} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis tawaran dengan AI...
          </span>
        ) : '🤝 Analisis Tawaran Buyer'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {loading && <div className="space-y-4 animate-pulse"><div className="h-20 bg-slate-100 rounded-2xl" /><div className="h-32 bg-slate-100 rounded-2xl" /></div>}

      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          {/* Recommendation Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${bannerStyle(result.margin_pct)}`}>
            {result.margin_pct < 15 ? <TrendingDown size={20} className="text-red-500 mt-0.5 shrink-0" /> : <TrendingUp size={20} className="text-green-500 mt-0.5 shrink-0" />}
            <p className="text-sm font-bold text-secondary">{result.recommendation}</p>
          </div>

          {/* Source note */}
          {result.source_note && (
            <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-600 font-medium">{result.source_note}</p>
            </div>
          )}

          {/* Comparison Cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Tawaran Buyer</p>
              <p className="text-lg font-black text-red-600">{result.buyer_offer}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Counter-Offer Anda</p>
              <p className="text-lg font-black text-green-600">{result.counter_offer}</p>
            </div>
          </div>

          {/* Market Benchmark */}
          <div className="bg-slate-soft p-4 rounded-2xl border border-slate-200">
            <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-2">Benchmark Harga Pasar Internasional</p>
            <p className="text-sm font-black text-secondary">{result.market_benchmark}</p>
            <div className="mt-2 flex items-center gap-2">
              <DollarSign size={14} className="text-accent" />
              <span className="text-xs font-bold text-secondary/60">
                Margin vs rata-rata: <span className={marginColor(result.margin_pct)}>{result.margin_pct > 0 ? '+' : ''}{result.margin_pct}%</span>
              </span>
            </div>
          </div>

          {/* Profitability */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3">
              <span className="text-sm font-black text-secondary">Analisis Profitabilitas</span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(result.profitability_analysis)
                .filter(([, val]) => val) // skip empty
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-secondary/60 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-secondary text-right max-w-[60%]">{val}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Negotiation Tips */}
          {result.negotiation_tips?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tips Negosiasi AI</p>
              </div>
              <ul className="space-y-2">
                {result.negotiation_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-black text-xs mt-0.5">{i + 1}.</span>
                    <span className="text-sm text-secondary/80 font-medium leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Draft */}
          <div>
            <button onClick={() => setShowEmail(!showEmail)} className="flex items-center gap-2 text-sm font-black text-accent hover:text-accent/80 transition-colors">
              <Mail size={16} />
              {showEmail ? 'Sembunyikan Draft Email' : 'Lihat Draft Email Negosiasi'}
            </button>
            {showEmail && (
              <div className="mt-3 bg-slate-soft p-5 rounded-2xl border border-slate-200 animate-fadeInUp">
                <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-3">Draft Email Counter-Offer (English)</p>
                <pre className="text-sm font-medium text-secondary leading-relaxed whitespace-pre-wrap font-sans">{result.email_draft}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(result.email_draft)}
                  className="mt-3 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  📋 Salin Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
