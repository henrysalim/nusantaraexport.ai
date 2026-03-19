import VoiceDemoSection from "../components/VoiceDemoSection";
import MarketAnalysisCard from "../components/MarketAnalysisCard";
import DocumentGenerator from "../components/DocumentGenerator";
import Navbar from "../components/Navbar"; // Added import for Navbar

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-soft">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 animate-fadeInUp">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              📊
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-secondary">
                Dashboard Ekspor Anda
              </h1>
              <p className="text-secondary/50 font-medium">
                Gunakan alat di bawah untuk mulai menganalisis pasar global.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Console: Voice Interaction (7 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8 animate-fadeInUp">
            <VoiceDemoSection />
          </div>

          {/* Side Tools: Market Analysis & Documents (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-8 animate-fadeInUp delay-200">
            <div className="danantara-card bg-white p-8 rounded-[2rem]">
              <MarketAnalysisCard />
            </div>
            <div className="danantara-card bg-white p-8 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📋</span>
                <h3 className="text-xl font-black text-secondary">
                  Buat Dokumen
                </h3>
              </div>
              <DocumentGenerator />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center text-secondary/40 text-xs font-bold uppercase tracking-[0.2em] border-t border-slate-200 bg-white">
        NusantaraExport.AI &copy; 2025 — Program Transformasi Digital UMKM
      </footer>
    </div>
  );
}
