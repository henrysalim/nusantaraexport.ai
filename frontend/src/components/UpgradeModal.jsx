/**
 * UpgradeModal — NusantaraExport.AI
 * Modal yang muncul ketika user mencoba akses fitur terkunci (dari tab di DemoPage).
 */
import { X, Lock, Zap, Star, Crown, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TIERS, FEATURE_TIER } from '../context/SubscriptionContext'

const TIER_GRADIENT = {
  starter: 'from-blue-500 to-blue-700',
  pro:     'from-violet-500 to-violet-700',
  premium: 'from-amber-500 to-amber-600',
}

const TIER_ICONS = {
  starter: <Zap  size={20} className="text-white" />,
  pro:     <Star size={20} className="text-white" />,
  premium: <Crown size={20} className="text-white" />,
}

// Fitur unggulan yang ditawarkan per tier
const TIER_HIGHLIGHTS = {
  starter: [
    'Chatbot Regulasi tanpa batas (10.000 token/hari)',
    'OCR Packaging Checker unlimited',
    'Akses komunitas & marketplace',
  ],
  pro: [
    'Semua fitur Starter (50.000 token/hari)',
    'Auto-DocGen 9 jenis dokumen ekspor',
    'PDF siap cetak & download',
  ],
  premium: [
    'Token chatbot tidak terbatas',
    'Dry Run & Export Simulator penuh',
    'Nego Coach + Smart Export Calendar',
    'Post-Export Problem Solver',
    'HS Code & FTA Optimizer',
    'Market Gap Analysis global',
  ],
}

export default function UpgradeModal({ featureKey, featureLabel, onClose }) {
  const requiredTier  = FEATURE_TIER[featureKey] ?? 'starter'
  const tierInfo      = TIERS[requiredTier]
  const gradient      = TIER_GRADIENT[requiredTier] ?? 'from-slate-500 to-slate-700'
  const highlights    = TIER_HIGHLIGHTS[requiredTier] ?? []

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Upgrade ke ${tierInfo?.label}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${gradient} px-6 pt-6 pb-8 relative`}>
          <button
            type="button"
            onClick={onClose}
            id="btn-upgrade-modal-close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Tutup modal upgrade"
          >
            <X size={15} className="text-white" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {TIER_ICONS[requiredTier]}
            </div>
            <div>
              <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">Fitur Terkunci</div>
              <div className="text-sm font-black text-white">{featureLabel}</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
            <Lock size={11} className="text-white/80" />
            <span className="text-[11px] font-black text-white">Perlu Paket {tierInfo?.label}</span>
          </div>
        </div>

        {/* Konten */}
        <div className="px-6 py-5">
          <p className="text-sm font-bold text-secondary/60 mb-4">
            Dengan paket <span className="text-secondary font-black">{tierInfo?.label}</span> (Rp {tierInfo?.price?.toLocaleString('id-ID')}/bln), Anda mendapat:
          </p>

          <ul className="space-y-2.5 mb-6">
            {highlights.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-bold text-secondary">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/langganan"
              id={`btn-upgrade-modal-cta-${featureKey}`}
              onClick={onClose}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r ${gradient} text-white font-black text-sm shadow-lg hover:opacity-90 transition-opacity`}
            >
              {TIER_ICONS[requiredTier]}
              Lihat Paket {tierInfo?.label} →
            </Link>
            <button
              type="button"
              onClick={onClose}
              id="btn-upgrade-modal-dismiss"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-secondary/60 text-sm font-bold rounded-2xl transition-colors"
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
