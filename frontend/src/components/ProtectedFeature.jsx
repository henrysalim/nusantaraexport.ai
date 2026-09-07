/**
 * ProtectedFeature — NusantaraExport.AI
 * Wrapper yang memblokir akses fitur berdasarkan tier langganan aktif.
 * Jika terkunci: tampilkan overlay blur + badge tier + tombol unlock.
 */
import { useState } from 'react'
import { Lock, Zap, Star, Crown } from 'lucide-react'
import { useSubscription, FEATURE_TIER, TIERS } from '../context/SubscriptionContext'
import { Link } from 'react-router-dom'

const TIER_ICONS = {
  starter: <Zap size={16} />,
  pro:     <Star size={16} />,
  premium: <Crown size={16} />,
}

const TIER_COLORS = {
  starter: 'from-blue-500 to-blue-600',
  pro:     'from-violet-500 to-violet-600',
  premium: 'from-amber-500 to-amber-600',
}

const FEATURE_LABELS = {
  docs:       'Auto-DocGen Dokumen Ekspor',
  simulator:  'Dry Run Simulator',
  nego:       'Nego Coach',
  calendar:   'Smart Export Calendar',
  postexport: 'Post-Export Problem Solver',
  hscode:     'HS Code & FTA Optimizer',
  market:     'Market Gap Analysis',
  alerts:     'Notifikasi Regulasi',
  packaging:  'OCR Packaging Checker',
}

export default function ProtectedFeature({ featureKey, children }) {
  const { canAccess } = useSubscription()
  const [showModal, setShowModal] = useState(false)

  if (canAccess(featureKey)) return <>{children}</>

  const requiredTier = FEATURE_TIER[featureKey] ?? 'starter'
  const tierInfo     = TIERS[requiredTier]
  const featureLabel = FEATURE_LABELS[featureKey] ?? featureKey
  const tierColor    = TIER_COLORS[requiredTier] ?? 'from-slate-500 to-slate-600'

  return (
    <div className="relative rounded-[2rem] overflow-hidden">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 scale-[0.99]">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/60 backdrop-blur-[2px] rounded-[2rem]">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tierColor} flex items-center justify-center shadow-xl mb-4`}>
          <Lock size={28} className="text-white" />
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${tierColor} text-white text-xs font-black mb-3 shadow-md`}>
          {TIER_ICONS[requiredTier]}
          Butuh Paket {tierInfo?.label}
        </div>

        <h3 className="text-lg font-black text-secondary mb-1 text-center px-4">
          {featureLabel}
        </h3>
        <p className="text-sm text-secondary/50 font-medium mb-5 text-center px-6">
          Upgrade ke paket {tierInfo?.label} untuk mengakses fitur ini
        </p>

        <Link
          to="/langganan"
          id={`btn-unlock-${featureKey}`}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r ${tierColor} text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity`}
        >
          {TIER_ICONS[requiredTier]}
          Upgrade ke {tierInfo?.label}
        </Link>
      </div>
    </div>
  )
}
