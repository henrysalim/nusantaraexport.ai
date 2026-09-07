/**
 * PricingPage — NusantaraExport.AI
 * Halaman langganan mandiri di route /langganan.
 * Dapat diakses tanpa login. Tombol "Aktifkan" redirect ke /login jika belum login.
 */
import { useState } from 'react'
import { Check, Zap, Star, Crown, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription, TIERS, TOKEN_QUOTA } from '../context/SubscriptionContext'

// ── Data Paket ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    key:      'free',
    name:     'Free',
    price:    0,
    icon:     <Sparkles size={22} />,
    gradient: 'from-slate-500 to-slate-600',
    ring:     'ring-slate-200',
    badge:    null,
    features: [
      { text: 'Chatbot Regulasi (1.000 token/hari)', included: true },
      { text: 'OCR Packaging Checker (1x/hari)', included: true },
      { text: 'Akses komunitas & marketplace', included: true },
      { text: 'Auto-DocGen Dokumen Ekspor', included: false },
      { text: 'Dry Run Simulator', included: false },
      { text: 'Nego Coach', included: false },
    ],
  },
  {
    key:      'starter',
    name:     'Starter',
    price:    49000,
    icon:     <Zap size={22} />,
    gradient: 'from-blue-500 to-blue-700',
    ring:     'ring-blue-200',
    badge:    null,
    features: [
      { text: 'Chatbot Regulasi (10.000 token/hari)', included: true },
      { text: 'OCR Packaging Checker unlimited', included: true },
      { text: 'Akses komunitas & marketplace', included: true },
      { text: 'Auto-DocGen Dokumen Ekspor', included: false },
      { text: 'Dry Run Simulator', included: false },
      { text: 'Nego Coach', included: false },
    ],
  },
  {
    key:      'pro',
    name:     'Pro',
    price:    79000,
    icon:     <Star size={22} />,
    gradient: 'from-violet-500 to-violet-700',
    ring:     'ring-violet-200',
    badge:    'Paling Populer',
    features: [
      { text: 'Chatbot Regulasi (50.000 token/hari)', included: true },
      { text: 'OCR Packaging Checker unlimited', included: true },
      { text: 'Akses komunitas & marketplace', included: true },
      { text: 'Auto-DocGen 9 dokumen ekspor (PDF)', included: true },
      { text: 'Dry Run Simulator', included: false },
      { text: 'Nego Coach', included: false },
    ],
  },
  {
    key:      'premium',
    name:     'Premium',
    price:    99000,
    icon:     <Crown size={22} />,
    gradient: 'from-amber-500 to-amber-600',
    ring:     'ring-amber-200',
    badge:    'Akses Penuh',
    features: [
      { text: 'Token chatbot tidak terbatas', included: true },
      { text: 'OCR Packaging Checker unlimited', included: true },
      { text: 'Akses komunitas & marketplace', included: true },
      { text: 'Auto-DocGen 9 dokumen ekspor (PDF)', included: true },
      { text: 'Dry Run & Export Simulator', included: true },
      { text: 'Nego Coach + Smart Calendar + Problem Solver', included: true },
    ],
  },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Apakah ini benar-benar gratis?',
    a: 'Ya! Paket Free tidak memerlukan kartu kredit. Anda bisa mencoba chatbot regulasi dan packaging checker setiap hari.',
  },
  {
    q: 'Apa itu "token" dalam kuota chatbot?',
    a: 'Token adalah satuan teks yang diproses AI. Kira-kira 1 token ≈ 4 karakter. Pertanyaan pendek (~100 karakter) menghabiskan ~25 token. Kuota direset otomatis setiap tengah malam.',
  },
  {
    q: 'Bagaimana cara upgrade ke paket berbayar?',
    a: 'Klik tombol "Aktifkan" pada paket yang diinginkan. Saat ini sistem berjalan dalam mode demo — upgrade akan aktif langsung tanpa pembayaran nyata.',
  },
  {
    q: 'Apakah langganan bisa dibatalkan?',
    a: 'Ya, Anda bisa kembali ke paket Free kapan saja dari halaman ini. Tidak ada kontrak jangka panjang.',
  },
]

// ── Komponen Token Meter ──────────────────────────────────────────────────────
function TokenMeter({ tier, tokensUsed, tokenQuota }) {
  if (tier === 'premium') return null
  const pct = tokenQuota === Infinity ? 0 : Math.min(100, (tokensUsed / tokenQuota) * 100)
  const remaining = tokenQuota - tokensUsed

  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-black text-secondary/50 uppercase tracking-widest">Token Hari Ini</span>
        <span className="text-[11px] font-black text-secondary">
          {tokensUsed.toLocaleString('id-ID')} / {tokenQuota.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-secondary/40 font-medium mt-1.5">
        {remaining > 0 ? `${remaining.toLocaleString('id-ID')} token tersisa hari ini` : 'Kuota habis — reset tengah malam'}
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { isAuthenticated } = useAuth()
  const { tier: activeTier, activateTier, tokensUsed, tokenQuota } = useSubscription()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [activatingTier, setActivatingTier] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const handleActivate = (planKey) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (planKey === activeTier) return

    setActivatingTier(planKey)
    // Simulasi delay agar terkesan ada proses
    setTimeout(() => {
      activateTier(planKey)
      setActivatingTier(null)
      setToast(`Paket ${TIERS[planKey]?.label} berhasil diaktifkan!`)
      setTimeout(() => setToast(null), 3500)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-soft pt-28 pb-20 px-4">
      {/* Toast notifikasi */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-2 animate-fadeInUp">
          <Check size={16} className="text-green-400" />
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Crown size={14} className="text-accent" />
            <span className="text-xs font-black text-accent uppercase tracking-widest">Paket Langganan</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black text-secondary leading-tight mb-4">
            Skema Ramah <span className="text-accent">UMKM</span>
          </h1>
          <p className="text-secondary/60 font-medium text-lg max-w-xl mx-auto leading-relaxed">
            Mulai gratis, upgrade sesuai kebutuhan ekspor Anda.
            Tidak ada biaya tersembunyi, tidak perlu kartu kredit.
          </p>

          {/* Token meter untuk user yang sudah login */}
          {isAuthenticated && activeTier !== 'premium' && (
            <div className="max-w-xs mx-auto mt-6">
              <TokenMeter tier={activeTier} tokensUsed={tokensUsed} tokenQuota={tokenQuota} />
            </div>
          )}
        </div>

        {/* Kartu Paket */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const isActive   = activeTier === plan.key
            const isLoading  = activatingTier === plan.key
            const isFree     = plan.price === 0

            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-3xl shadow-lg border-2 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fadeInUp ${
                  isActive
                    ? `border-transparent ring-4 ${plan.ring} scale-[1.02]`
                    : plan.badge === 'Paling Populer'
                    ? 'border-violet-200 shadow-violet-100'
                    : 'border-slate-100'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-black text-white uppercase tracking-widest bg-gradient-to-r ${plan.gradient}`}>
                    {plan.badge}
                  </div>
                )}

                {/* Aktif badge */}
                {isActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-green-500 rounded-full">
                    <Check size={10} className="text-white" strokeWidth={3} />
                    <span className="text-[9px] font-black text-white">AKTIF</span>
                  </div>
                )}

                <div className={`pt-${plan.badge ? '8' : '6'} px-6 pb-6`}>
                  {/* Icon + nama */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {plan.icon}
                  </div>
                  <h2 className="text-xl font-black text-secondary mb-1">{plan.name}</h2>
                  <div className="flex items-end gap-1 mb-5">
                    {isFree ? (
                      <span className="text-3xl font-black text-secondary">Gratis</span>
                    ) : (
                      <>
                        <span className="text-[13px] font-bold text-secondary/40 self-start mt-1">Rp</span>
                        <span className="text-3xl font-black text-secondary">
                          {plan.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-bold text-secondary/40 mb-0.5">/bln</span>
                      </>
                    )}
                  </div>

                  {/* Fitur list */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-start gap-2 text-[13px] font-bold ${f.included ? 'text-secondary' : 'text-secondary/30'}`}>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.included ? `bg-gradient-to-br ${plan.gradient}` : 'bg-slate-100'}`}>
                          {f.included
                            ? <Check size={9} className="text-white" strokeWidth={3} />
                            : <span className="text-[8px] text-slate-400 font-black">—</span>
                          }
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    id={`btn-activate-${plan.key}`}
                    onClick={() => handleActivate(plan.key)}
                    disabled={isActive || isLoading}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-green-50 text-green-600 cursor-default border-2 border-green-200'
                        : isLoading
                        ? `bg-gradient-to-r ${plan.gradient} text-white opacity-70 cursor-wait`
                        : !isAuthenticated && !isFree
                        ? `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 shadow-md`
                        : isFree
                        ? 'bg-slate-100 text-secondary/60 cursor-default'
                        : `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 shadow-md`
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Mengaktifkan...
                      </>
                    ) : isActive ? (
                      <><Check size={14} /> Paket Aktif</>
                    ) : !isAuthenticated && !isFree ? (
                      <><Lock size={14} /> Login untuk Aktifkan</>
                    ) : isFree ? (
                      'Paket Default'
                    ) : (
                      `Aktifkan ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-secondary text-center mb-8">Pertanyaan Umum</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  type="button"
                  id={`btn-faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-black text-secondary text-sm">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} className="text-secondary/40 shrink-0" />
                    : <ChevronDown size={16} className="text-secondary/40 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm font-medium text-secondary/60 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14">
          <p className="text-secondary/50 font-medium mb-4">Sudah siap mulai ekspor?</p>
          <Link
            to="/demo"
            id="btn-pricing-go-demo"
            className="btn-primary px-10 py-4 text-base"
          >
            Buka Dashboard Ekspor →
          </Link>
        </div>
      </div>
    </div>
  )
}
