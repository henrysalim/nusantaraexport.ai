import { useState, useEffect, useCallback } from "react";
import { Volume2, Square, Book, Contrast, RotateCcw, Keyboard, Settings, Info } from "lucide-react";
import GlossaryPanel from "./GlossaryPanel";

export default function AccessibilityTools() {
  const [fontSize, setFontSize] = useState("base");
  const [highContrast, setHighContrast] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  const modKey = isMac ? '⌘' : 'Ctrl';

  // TTS Logic
  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToRead = document.querySelector("#main-content")?.innerText || "";
    if (!textToRead) return;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking]);

  // Keyboard shortcuts — using Ctrl (Win) or Cmd (Mac)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      // Menggunakan Shift + Key untuk menghindari bentrok dengan shortcut browser umum
      if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toggleSpeech();
      } else if (e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsGlossaryOpen((prev) => !prev);
      } else if (e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setHighContrast((prev) => !prev);
      } else if (e.key === '[') {
        e.preventDefault();
        setFontSize((prev) => prev === "xl" ? "lg" : "base");
      } else if (e.key === ']') {
        e.preventDefault();
        setFontSize((prev) => prev === "base" ? "lg" : "xl");
      } else if (e.shiftKey && e.key === '0') {
        e.preventDefault();
        setFontSize("base");
        setHighContrast(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpeech, isMac]);

  // Scroll visibility
  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 300);
    window.addEventListener("scroll", toggle);
    return () => {
      window.removeEventListener("scroll", toggle);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Font size & contrast classes
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("text-lg", "text-xl");
    if (fontSize === "lg") html.classList.add("text-lg");
    if (fontSize === "xl") html.classList.add("text-xl");
    if (highContrast) html.classList.add("high-contrast");
    else html.classList.remove("high-contrast");
  }, [fontSize, highContrast]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Skip to Content */}
      <a href="#main-content" className="skip-link" aria-label="Langsung ke konten utama">
        Langsung ke Konten Utama
      </a>

      {/* Floating Controls */}
      <div className="fixed bottom-8 left-8 z-[60] flex flex-col items-start gap-4" role="toolbar" aria-label="Alat aksesibilitas">
        {/* Expanded Menu */}
        <div className={`transition-all duration-300 origin-bottom flex flex-col gap-2 ${isExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="bg-white border border-slate-200 p-2 rounded-3xl shadow-2xl flex flex-col gap-1 w-64 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 mb-1 flex items-center gap-2">
                <Settings size={14} className="text-secondary/40" />
                <span className="text-[10px] font-black uppercase text-secondary/40" aria-hidden="true">Pengaturan Akses</span>
            </div>

            {/* TTS */}
            <button
              onClick={toggleSpeech}
              className={`flex items-center gap-4 w-full p-3 rounded-2xl font-bold transition-all ${isSpeaking ? "bg-accent text-white animate-pulse" : "bg-slate-50 text-secondary hover:bg-slate-100"}`}
              aria-label={isSpeaking ? "Hentikan pembacaan suara" : "Bacakan halaman ini"}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={18} />}
              </div>
              <span className="text-sm">{isSpeaking ? "Berhenti" : "Dengarkan Suara"}</span>
              <span className="ml-auto text-[10px] opacity-40 font-mono">{modKey}+⇧+S</span>
            </button>

            {/* Glossary */}
            <button
              onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
              className={`flex items-center gap-4 w-full p-3 rounded-2xl font-bold transition-all ${isGlossaryOpen ? "bg-secondary text-white" : "bg-slate-50 text-secondary hover:bg-slate-100"}`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Book size={18} />
              </div>
              <span className="text-sm">Kamus Ekspor</span>
              <span className="ml-auto text-[10px] opacity-40 font-mono">{modKey}+⇧+K</span>
            </button>

            <div className="h-px bg-slate-100 my-1 mx-2" aria-hidden="true" />

            {/* High Contrast */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`flex items-center gap-4 w-full p-3 rounded-2xl font-bold transition-all ${highContrast ? "bg-yellow-400 text-black shadow-lg" : "bg-slate-50 text-secondary hover:bg-slate-100"}`}
            >
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center flex-shrink-0">
                <Contrast size={18} />
              </div>
              <span className="text-sm">Kontras Tinggi</span>
              <span className="ml-auto text-[10px] opacity-40 font-mono">{modKey}+⇧+H</span>
            </button>

            {/* Font Control Layout */}
            <div className="flex flex-col gap-1 mt-1 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="px-3 py-1 flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-secondary/30">Ukuran Teks</span>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setFontSize("xl")}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${fontSize === "xl" ? "bg-accent text-white" : "hover:bg-slate-200"}`}
                    >
                        Paling Besar
                    </button>
                    <button
                        onClick={() => setFontSize("lg")}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${fontSize === "lg" ? "bg-accent text-white" : "hover:bg-slate-200"}`}
                    >
                        Besar
                    </button>
                    <button
                        onClick={() => setFontSize("base")}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${fontSize === "base" ? "bg-secondary text-white" : "hover:bg-slate-200"}`}
                    >
                        Normal
                    </button>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-1 mx-2" aria-hidden="true" />

            {/* Shortcuts & Reset Container */}
            <div className="flex gap-2 p-1">
                <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-secondary hover:bg-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                    <Keyboard size={14} /> Pintasan
                </button>
                <button
                    onClick={() => { setFontSize("base"); setHighContrast(false); }}
                    className="w-12 flex items-center justify-center bg-slate-100 text-secondary hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                    title="Reset Semua"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
          </div>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group flex items-center gap-3 px-6 h-14 rounded-2xl shadow-2xl transition-all duration-300 transform border-2 ${isExpanded ? 'bg-secondary text-white border-secondary' : 'bg-white text-secondary border-slate-100 hover:scale-105 active:scale-95'}`}
          aria-label={isExpanded ? "Tutup menu aksesibilitas" : "Buka menu aksesibilitas"}
          aria-expanded={isExpanded}
        >
          <Settings size={22} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'group-hover:rotate-45'}`} />
          <span className="font-black text-sm uppercase tracking-wider">Aksesibilitas</span>
          {isExpanded && <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">×</div>}
        </button>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowShortcuts(false)} role="dialog" aria-modal="true" aria-label="Pintasan keyboard">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-secondary mb-6">Pintasan Keyboard</h2>
            <div className="space-y-3">
              {[
                { keys: `${modKey}+⇧+S`, desc: "Bacakan halaman / hentikan" },
                { keys: `${modKey}+⇧+K`, desc: "Buka/tutup kamus ekspor" },
                { keys: `${modKey}+⇧+H`, desc: "Mode kontras tinggi" },
                { keys: `${modKey}+[`, desc: "Perkecil teks" },
                { keys: `${modKey}+]`, desc: "Perbesar teks" },
                { keys: `${modKey}+⇧+0`, desc: "Reset semua pengaturan" },
                { keys: "Tab", desc: "Navigasi antar elemen" },
                { keys: "Enter", desc: "Aktifkan tombol/link" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <kbd className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-black text-secondary">{s.keys}</kbd>
                  <span className="text-sm font-medium text-secondary/70">{s.desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="btn-primary w-full justify-center mt-6" autoFocus>Tutup</button>
          </div>
        </div>
      )}

      {/* Glossary */}
      <GlossaryPanel isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        className={`fixed bottom-8 right-8 z-[60] w-auto px-4 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 transform border-4 border-white ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50 pointer-events-none"} hover:bg-secondary hover:-translate-y-2 active:scale-95`}
        tabIndex={isVisible ? 0 : -1}
      >
        Kembali ke atas&nbsp;
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
      </button>
    </>
  );
}
