import { useState } from 'react'
import { Mic, FileText, Camera, TrendingUp, Tag, ClipboardCheck, Bell } from 'lucide-react'
import VoiceDemoSection from '../components/VoiceDemoSection'
import DocumentGenerator from '../components/DocumentGenerator'
import MarketAnalysisCard from '../components/MarketAnalysisCard'
import PackagingChecker from '../components/PackagingChecker'
import HSCodeOptimizer from '../components/HSCodeOptimizer'
import ExportReadinessSimulator from '../components/ExportReadinessSimulator'
import RegulatoryAlerts from '../components/RegulatoryAlerts'

const TABS = [
  { key: 'assistant', label: 'Konsultasi AI', icon: <Mic size={18} />, desc: 'Tanya regulasi & biaya' },
  { key: 'market', label: 'Peluang Pasar', icon: <TrendingUp size={18} />, desc: 'Analisis data COMTRADE' },
  { key: 'docs', label: 'Buat Dokumen', icon: <FileText size={18} />, desc: '7 jenis dokumen ekspor' },
  { key: 'packaging', label: 'Audit Kemasan', icon: <Camera size={18} />, desc: 'Cek kepatuhan label' },
  { key: 'hscode', label: 'HS Code & FTA', icon: <Tag size={18} />, desc: 'Klasifikasi & tarif' },
  { key: 'readiness', label: 'Simulasi Ekspor', icon: <ClipboardCheck size={18} />, desc: 'Skor kesiapan & biaya' },
  { key: 'alerts', label: 'Notifikasi', icon: <Bell size={18} />, desc: 'Perubahan regulasi' },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('assistant')

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant': return <VoiceDemoSection />
      case 'market': return (
        <div className="bg-white danantara-card rounded-[2rem] p-8">
          <MarketAnalysisCard />
        </div>
      )
      case 'docs': return (
        <div className="bg-white danantara-card rounded-[2rem] p-8">
          <DocumentGenerator />
        </div>
      )
      case 'packaging': return <PackagingChecker />
      case 'hscode': return <HSCodeOptimizer />
      case 'readiness': return <ExportReadinessSimulator />
      case 'alerts': return <RegulatoryAlerts />
      default: return <VoiceDemoSection />
    }
  }

  return (
    <div className="min-h-screen bg-slate-soft">
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-secondary">Dashboard Ekspor</h1>
              <p className="text-secondary/50 font-medium text-sm">Tujuh modul AI untuk membantu UMKM Indonesia siap ekspor</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2" role="tablist" aria-label="Modul ekspor">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-secondary text-white shadow-lg'
                    : 'bg-white text-secondary/60 hover:bg-white hover:text-secondary border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={activeTab === tab.key ? 'text-white' : 'text-secondary/30'}>{tab.icon}</span>
                <div className="text-left">
                  <div className="leading-tight">{tab.label}</div>
                  <div className={`text-[10px] font-medium ${activeTab === tab.key ? 'text-white/60' : 'text-secondary/30'}`}>{tab.desc}</div>
                </div>
                {tab.key === 'alerts' && (
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black ml-1">4</span>
                )}
              </button>
            ))}
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
    </div>
  )
}
