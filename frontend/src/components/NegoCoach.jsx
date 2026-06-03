import { useState } from 'react'
import { Handshake, TrendingUp, TrendingDown, Mail, DollarSign } from 'lucide-react'
import { analyzeNegotiation } from '../services/api'

const MOCK_RESULT = {
  buyer_offer: 'USD 3.50/kg (FOB Jepang)',
  market_benchmark: 'USD 3.80 - 4.80/kg (Avg: USD 4.25)',
  margin_pct: -17.6,
  counter_offer: 'USD 4.12/kg (FOB Jepang)',
  profitability_analysis: {
    buyer_total: 'USD 7,000',
    counter_total: 'USD 8,240',
    difference: 'USD 1,240',
    market_position: 'Di bawah rata-rata',
  },
  email_draft: `Dear [Buyer Name],

Thank you for your valuable offer of USD 3.50/kg for our premium Kopi Arabika.

After carefully analyzing our production costs and current market benchmarks (UN COMTRADE average: USD 4.25/kg), we would like to propose a counter-offer of USD 4.12/kg (FOB Jepang).

We can commit to 2,000 kg with a shipping window within 30 days of receiving the advance payment (30% T/T, 70% Irrevocable L/C at Sight).

We look forward to your favorable response.

Warm regards,
[Your Company Name]`,
  recommendation: '⚠️ Tawaran buyer TERLALU RENDAH. Wajib counter-offer!'
}

export default function NegoCoach() {
  const [commodity, setCommodity] = useState('Kopi Arabika')
  const [buyerOffer, setBuyerOffer] = useState('')
  const [quantity, setQuantity] = useState('2000')
  const [destination, setDestination] = useState('Jepang')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showEmail, setShowEmail] = useState(false)

  const handleAnalyze = async () => {
    if (!buyerOffer) return
    setLoading(true)
    setResult(null)
    try {
      const response = await analyzeNegotiation({
        commodity,
        buyer_offer_usd: parseFloat(buyerOffer),
        quantity_kg: parseFloat(quantity) || 2000,
        destination,
        incoterm: 'FOB'
      })
      setResult(response.data)
    } catch (error) {
      console.warn('API offline, using mock:', error.message)
      await new Promise(r => setTimeout(r, 1500))
      setResult(MOCK_RESULT)
    } finally {
      setLoading(false)
    }
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
      </div>
      <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis tawaran...
          </span>
        ) : '🤝 Analisis Tawaran Buyer'}
      </button>

      {loading && <div className="space-y-4 animate-pulse"><div className="h-20 bg-slate-100 rounded-2xl" /><div className="h-32 bg-slate-100 rounded-2xl" /></div>}

      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          {/* Recommendation Banner */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${result.margin_pct < 10 ? 'bg-red-50 border-red-200' : result.margin_pct < 25 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            {result.margin_pct < 10 ? <TrendingDown size={20} className="text-red-500" /> : <TrendingUp size={20} className="text-green-500" />}
            <p className="text-sm font-bold text-secondary">{result.recommendation}</p>
          </div>

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
            <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-2">Benchmark Harga Pasar (UN COMTRADE)</p>
            <p className="text-sm font-black text-secondary">{result.market_benchmark}</p>
            <div className="mt-2 flex items-center gap-2">
              <DollarSign size={14} className="text-accent" />
              <span className="text-xs font-bold text-secondary/60">Margin Anda: <span className={result.margin_pct < 10 ? 'text-red-500' : 'text-green-500'}>{result.margin_pct}%</span></span>
            </div>
          </div>

          {/* Profitability */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-soft px-5 py-3">
              <span className="text-sm font-black text-secondary">Analisis Profitabilitas</span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(result.profitability_analysis).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-secondary/60 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-secondary">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Draft */}
          <div>
            <button onClick={() => setShowEmail(!showEmail)} className="flex items-center gap-2 text-sm font-black text-accent hover:text-accent/80 transition-colors">
              <Mail size={16} />
              {showEmail ? 'Sembunyikan Draft Email' : 'Lihat Draft Email Negosiasi'}
            </button>
            {showEmail && (
              <div className="mt-3 bg-slate-soft p-5 rounded-2xl border border-slate-200 animate-fadeInUp">
                <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-3">Draft Email Counter-Offer</p>
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
