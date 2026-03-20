import { useState } from 'react'
import { Search, Tag, ArrowRight } from 'lucide-react'

const MOCK_HS = {
  kopi: {
    product: 'Kopi Arabika Gayo',
    hs_code: '0901.21.10',
    description: 'Kopi, tidak disangrai, tidak dihilangkan kafeinnya — Arabika WIB',
    chapter: 'Chapter 09 — Kopi, Teh, Mate dan Rempah-rempah',
    mfn_tariff: '5-15%',
    fta_results: [
      { agreement: 'IJEPA (Jepang)', tariff: '0%', saving: '¥180,000/kontainer', status: 'Berlaku' },
      { agreement: 'ACFTA (Tiongkok)', tariff: '0%', saving: '¥120,000/kontainer', status: 'Berlaku' },
      { agreement: 'AKFTA (Korea)', tariff: '2%', saving: '₩95,000/kontainer', status: 'Berlaku' },
      { agreement: 'AIFTA (India)', tariff: '5%', saving: '₹85,000/kontainer', status: 'Berlaku' },
      { agreement: 'IA-CEPA (Australia)', tariff: '0%', saving: 'A$2,100/kontainer', status: 'Berlaku' },
      { agreement: 'RCEP', tariff: '0%', saving: 'Bervariasi', status: 'Berlaku' },
    ],
    best_fta: 'IJEPA (Jepang)',
    best_saving: '¥180,000/kontainer (~Rp 19.800.000)',
  },
  singkong: {
    product: 'Keripik Singkong',
    hs_code: '2005.99.90',
    description: 'Sayuran lainnya, disiapkan atau diawetkan — keripik singkong',
    chapter: 'Chapter 20 — Olahan Sayuran, Buah, dan Kacang',
    mfn_tariff: '10-25%',
    fta_results: [
      { agreement: 'ACFTA (Tiongkok)', tariff: '0%', saving: '¥95,000/kontainer', status: 'Berlaku' },
      { agreement: 'AANZFTA (ASEAN-ANZ)', tariff: '0%', saving: 'A$1,800/kontainer', status: 'Berlaku' },
      { agreement: 'RCEP', tariff: '5%', saving: 'Bervariasi', status: 'Berlaku' },
      { agreement: 'IJEPA (Jepang)', tariff: '8.5%', saving: '¥42,000/kontainer', status: 'Berlaku' },
    ],
    best_fta: 'ACFTA (Tiongkok)',
    best_saving: '¥95,000/kontainer (~Rp 10.450.000)',
  },
  default: {
    product: 'Produk Umum',
    hs_code: '9999.99.00',
    description: 'Masukkan nama produk spesifik untuk klasifikasi akurat',
    chapter: 'Chapter — Memerlukan analisis lebih lanjut',
    mfn_tariff: '5-30%',
    fta_results: [
      { agreement: 'ACFTA (Tiongkok)', tariff: '0-5%', saving: 'Bervariasi', status: 'Perlu Cek' },
      { agreement: 'IJEPA (Jepang)', tariff: '0-8%', saving: 'Bervariasi', status: 'Perlu Cek' },
      { agreement: 'RCEP', tariff: '0-10%', saving: 'Bervariasi', status: 'Perlu Cek' },
    ],
    best_fta: 'Tergantung produk',
    best_saving: 'Masukkan produk spesifik',
  }
}

function getMockHS(product) {
  const p = product.toLowerCase()
  if (p.includes('kopi') || p.includes('coffee')) return MOCK_HS.kopi
  if (p.includes('singkong') || p.includes('keripik') || p.includes('cassava')) return MOCK_HS.singkong
  return MOCK_HS.default
}

export default function HSCodeOptimizer() {
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleClassify = () => {
    if (!product) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(getMockHS(product))
      setLoading(false)
    }, 1500)
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

      {result && (
        <div className="animate-fadeInUp space-y-4">
          {/* HS Code Result */}
          <div className="bg-slate-soft p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Klasifikasi HS Code</span>
              <span className="px-3 py-1 bg-secondary text-white rounded-lg text-xs font-black">{result.hs_code}</span>
            </div>
            <p className="text-sm font-bold text-secondary mb-1">{result.product}</p>
            <p className="text-xs text-secondary/50">{result.description}</p>
            <p className="text-xs text-secondary/40 mt-1">{result.chapter}</p>
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
        </div>
      )}
    </div>
  )
}
