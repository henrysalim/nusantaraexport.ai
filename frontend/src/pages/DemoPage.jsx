/**
 * DemoPage — NusantaraExport.AI (dengan Subscription Gating)
 * Setiap fitur di-wrap dengan ProtectedFeature sesuai tier yang dibutuhkan.
 * Chatbot tab menggunakan token tracking dari SubscriptionContext.
 */
import { useState } from 'react'
import { Mic, FileText, Camera, TrendingUp, Tag, ClipboardCheck, Bell, Handshake, CalendarDays, AlertOctagon, Lock, Zap, Crown, Star } from 'lucide-react'
import VoiceDemoSection from '../components/VoiceDemoSection'
import DocumentGenerator from '../components/DocumentGenerator'
import MarketAnalysisCard from '../components/MarketAnalysisCard'
import PackagingChecker from '../components/PackagingChecker'
import HSCodeOptimizer from '../components/HSCodeOptimizer'
import ExportSimulator from '../components/ExportSimulator'
import RegulatoryAlerts from '../components/RegulatoryAlerts'
import NegoCoach from '../components/NegoCoach'
import SmartExportCalendar from '../components/SmartExportCalendar'
import PostExportSolver from '../components/PostExportSolver'
import ProtectedFeature from '../components/ProtectedFeature'
import UpgradeModal from '../components/UpgradeModal'
import { useSubscription, TIERS, TOKEN_QUOTA } from '../context/SubscriptionContext'
import { Link } from 'react-router-dom'

// ── Definisi Tab dengan featureKey ────────────────────────────────────────────
const TABS = [
  { key: 'assistant', label: 'Konsultasi AI',  icon: <Mic size={18} />,          desc: 'Tanya regulasi & biaya',    featureKey: 'chatbot' },
  { key: 'market',    label: 'Peluang Pasar',  icon: <TrendingUp size={18} />,   desc: 'Analisis data COMTRADE',    featureKey: 'market' },
  { key: 'docs',      label: 'Buat Dokumen',   icon: <FileText size={18} />,     desc: '9 dokumen ekspor',          featureKey: 'docs' },
  { key: 'packaging', label: 'Audit Kemasan',  icon: <Camera size={18} />,       desc: 'Cek kepatuhan label',       featureKey: 'packaging' },
  { key: 'hscode',    label: 'HS Code & FTA',  icon: <Tag size={18} />,          desc: 'Klasifikasi & tarif',       featureKey: 'hscode' },
  { key: 'simulator', label: 'Simulasi Ekspor',icon: <ClipboardCheck size={18} />,desc: 'Kesiapan & rute ekspor',   featureKey: 'simulator' },
  { key: 'nego',      label: 'Nego Coach',     icon: <Handshake size={18} />,    desc: 'Analisis tawaran buyer',    featureKey: 'nego',      isNew: true },
  { key: 'calendar',  label: 'Kalender Ekspor',icon: <CalendarDays size={18} />, desc: 'Jadwal panen & demand',     featureKey: 'calendar',  isNew: true },
  { key: 'postexport',label: 'Problem Solver', icon: <AlertOctagon size={18} />, desc: 'Masalah pasca ekspor',      featureKey: 'postexport',isNew: true },
  { key: 'alerts',    label: 'Notifikasi',     icon: <Bell size={18} />,         desc: 'Perubahan regulasi',        featureKey: 'alerts' },
]

// ── Tier badge config ─────────────────────────────────────────────────────────
const TIER_BADGE = {
  starter: { icon: <Zap size={10} />,   label: 'Starter', bg: 'bg-blue-500' },
  pro:     { icon: <Star size={10} />,  label: 'Pro',     bg: 'bg-violet-500' },
  premium: { icon: <Crown size={10} />, label: 'Premium', bg: 'bg-amber-500' },
}

// ── Token Usage Meter ─────────────────────────────────────────────────────────
function TokenMeter({ tokensUsed, tokenQuota, tier }) {
  if (tier === 'premium' || tokenQuota === Infinity) return null
  const pct = Math.min(100, (tokensUsed / tokenQuota) * 100)
  const remaining = tokenQuota - tokensUsed

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Token Hari Ini</span>
          <span className="text-[10px] font-black text-secondary">{tokensUsed.toLocaleString('id-ID')}/{tokenQuota.toLocaleString('id-ID')}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-400' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Link to="/langganan" className="text-[10px] font-black text-accent hover:underline whitespace-nowrap">
        {remaining <= 0 ? 'Upgrade →' : `${remaining.toLocaleString('id-ID')} sisa`}
      </Link>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [activeTab, setActiveTab]       = useState('assistant')
  const [upgradeModal, setUpgradeModal] = useState(null) // { featureKey, featureLabel }
  const { tier, canAccess, tokensUsed, tokenQuota } = useSubscription()

  const handleTabClick = (tab) => {
    if (!canAccess(tab.featureKey)) {
      // Tampilkan UpgradeModal alih-alih ganti tab
      setUpgradeModal({ featureKey: tab.featureKey, featureLabel: tab.label })
      return
    }
    setActiveTab(tab.key)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant': return (
        <ProtectedFeature featureKey="chatbot">
          <VoiceDemoSection />
        </ProtectedFeature>
      )
      case 'market': return (
        <ProtectedFeature featureKey="market">
          <div className="bg-white danantara-card rounded-2xl sm:rounded-[2rem] p-4 sm:p-8">
            <MarketAnalysisCard />
          </div>
        </ProtectedFeature>
      )
      case 'docs': return (
        <ProtectedFeature featureKey="docs">
          <div className="bg-white danantara-card rounded-2xl sm:rounded-[2rem] p-4 sm:p-8">
            <DocumentGenerator />
          </div>
        </ProtectedFeature>
      )
      case 'packaging': return (
        <ProtectedFeature featureKey="packaging">
          <PackagingChecker />
        </ProtectedFeature>
      )
      case 'hscode': return (
        <ProtectedFeature featureKey="hscode">
          <HSCodeOptimizer />
        </ProtectedFeature>
      )
      case 'simulator': return (
        <ProtectedFeature featureKey="simulator">
          <ExportSimulator />
        </ProtectedFeature>
      )
      case 'nego': return (
        <ProtectedFeature featureKey="nego">
          <NegoCoach />
        </ProtectedFeature>
      )
      case 'calendar': return (
        <ProtectedFeature featureKey="calendar">
          <SmartExportCalendar />
        </ProtectedFeature>
      )
      case 'postexport': return (
        <ProtectedFeature featureKey="postexport">
          <PostExportSolver />
        </ProtectedFeature>
      )
      case 'alerts': return (
        <ProtectedFeature featureKey="alerts">
          <RegulatoryAlerts />
        </ProtectedFeature>
      )
      default: return (
        <ProtectedFeature featureKey="chatbot">
          <VoiceDemoSection />
        </ProtectedFeature>
      )
    }
  }

  const tierBadge = TIER_BADGE[tier]

  return (
    <div className="min-h-screen bg-slate-soft">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-28 sm:pb-20">

        {/* Header */}
        <div className="mb-6 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <div>
                <h1 className="text-3xl font-display font-black text-secondary">Dashboard Ekspor</h1>
                <p className="text-secondary/50 font-medium text-sm">10 modul AI untuk membantu UMKM Indonesia siap ekspor</p>
              </div>
            </div>

            {/* Tier badge + token meter */}
            <div className="flex items-center gap-3 flex-wrap">
              {tierBadge && (
                <Link
                  to="/langganan"
                  id="link-tier-badge-demo"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierBadge.bg} text-white text-[11px] font-black shadow-md hover:opacity-90 transition-opacity`}
                >
                  {tierBadge.icon}
                  Paket {tierBadge.label}
                </Link>
              )}
              {!tierBadge && (
                <Link
                  to="/langganan"
                  id="link-free-badge-demo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 text-secondary text-[11px] font-black hover:bg-slate-300 transition-colors"
                >
                  Paket Free → Upgrade
                </Link>
              )}
              <TokenMeter tokensUsed={tokensUsed} tokenQuota={tokenQuota} tier={tier} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2" role="tablist" aria-label="Modul ekspor">
            {TABS.map((tab) => {
              const locked   = !canAccess(tab.featureKey)
              const isActive = activeTab === tab.key && !locked

              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  id={`tab-${tab.key}`}
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'bg-secondary text-white shadow-lg'
                      : locked
                      ? 'bg-slate-100 text-secondary/40 border border-dashed border-slate-300 cursor-pointer hover:border-slate-400'
                      : 'bg-white text-secondary/60 hover:bg-white hover:text-secondary border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={isActive ? 'text-white' : locked ? 'text-secondary/30' : 'text-secondary/30'}>
                    {locked ? <Lock size={16} /> : tab.icon}
                  </span>
                  <div className="text-left">
                    <div className="leading-tight">{tab.label}</div>
                    <div className={`text-[10px] font-medium ${isActive ? 'text-white/60' : 'text-secondary/30'}`}>{tab.desc}</div>
                  </div>
                  {tab.isNew && !locked && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-accent text-white rounded-full text-[8px] font-black">NEW</span>
                  )}
                  {tab.key === 'alerts' && !locked && (
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black ml-1">4</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find(t => t.key === activeTab)?.label}
          className="animate-fadeInUp"
          key={activeTab}
        >
          {renderContent()}
        </div>
      </main>

      {/* Upgrade Modal */}
      {upgradeModal && (
        <UpgradeModal
          featureKey={upgradeModal.featureKey}
          featureLabel={upgradeModal.featureLabel}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </div>
  )
}
