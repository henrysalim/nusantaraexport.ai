import { useState } from 'react'
import { Globe } from 'lucide-react'

const MOCK_RESULTS = {
  kopi: {
    top_destinations: [
      { country: '🇯🇵 Jepang', score: 92 },
      { country: '🇺🇸 Amerika Serikat', score: 88 },
      { country: '🇩🇪 Jerman', score: 85 },
      { country: '🇰🇷 Korea Selatan', score: 79 },
    ],
    gap_score: 87,
    avg_price: '$4,200/ton',
    growth: '+12.3%',
  },
  singkong: {
    top_destinations: [
      { country: '🇨🇳 Tiongkok', score: 94 },
      { country: '🇯🇵 Jepang', score: 82 },
      { country: '🇰🇷 Korea Selatan', score: 78 },
      { country: '🇦🇪 Uni Emirat Arab', score: 71 },
    ],
    gap_score: 91,
    avg_price: '$1,800/ton',
    growth: '+23.1%',
  },
  kayu: {
    top_destinations: [
      { country: '🇳🇱 Belanda', score: 89 },
      { country: '🇬🇧 Inggris', score: 84 },
      { country: '🇦🇺 Australia', score: 80 },
      { country: '🇸🇬 Singapura', score: 76 },
    ],
    gap_score: 72,
    avg_price: '€25-45/unit',
    growth: '+8.7%',
  },
  default: {
    top_destinations: [
      { country: '🇨🇳 Tiongkok', score: 88 },
      { country: '🇯🇵 Jepang', score: 85 },
      { country: '🇺🇸 Amerika Serikat', score: 82 },
      { country: '🇸🇬 Singapura', score: 78 },
    ],
    gap_score: 76,
    avg_price: 'Bervariasi',
    growth: '+10.5%',
  },
}

function getMockMarket(product) {
  const p = product.toLowerCase()
  if (p.includes('kopi') || p.includes('coffee')) return MOCK_RESULTS.kopi
  if (p.includes('singkong') || p.includes('keripik') || p.includes('cassava')) return MOCK_RESULTS.singkong
  if (p.includes('kayu') || p.includes('wood') || p.includes('kerajinan')) return MOCK_RESULTS.kayu
  return MOCK_RESULTS.default
}

export default function MarketAnalysisCard() {
  const [productName, setProductName] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = () => {
    if (!productName) return
    setLoading(true)
    setTimeout(() => {
      setData(getMockMarket(productName))
      setLoading(false)
    }, 1200)
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
        </div>
      )}
    </div>
  )
}
