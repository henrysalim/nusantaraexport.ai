import { useState, useEffect, useCallback } from "react";
import { Volume2, Square, Book, Contrast, RotateCcw, Keyboard } from "lucide-react";
import GlossaryPanel from "./GlossaryPanel";

export default function AccessibilityTools() {
  const [fontSize, setFontSize] = useState("base");
  const [highContrast, setHighContrast] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleSpeech();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setIsGlossaryOpen((prev) => !prev);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setHighContrast((prev) => !prev);
      } else if (e.key === '=') {
        e.preventDefault();
        setFontSize((prev) => prev === "base" ? "lg" : "xl");
      } else if (e.key === '-') {
        e.preventDefault();
        setFontSize((prev) => prev === "xl" ? "lg" : "base");
      } else if (e.key === '0') {
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
      <div className="fixed bottom-8 left-8 z-[60] flex flex-col gap-2" role="toolbar" aria-label="Alat aksesibilitas">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 items-center">
          <span className="text-[10px] font-black uppercase text-secondary/40 mb-1" aria-hidden="true">Akses</span>

          {/* TTS */}
          <button
            onClick={toggleSpeech}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${isSpeaking ? "bg-accent text-white animate-pulse" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label={isSpeaking ? "Hentikan pembacaan suara" : "Bacakan halaman ini"}
            aria-pressed={isSpeaking}
            title={`${modKey}+S`}
          >
            {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={20} />}
          </button>

          <div className="w-8 h-px bg-slate-100 my-1" aria-hidden="true" />

          {/* Glossary */}
          <button
            onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${isGlossaryOpen ? "bg-secondary text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label={isGlossaryOpen ? "Tutup kamus ekspor" : "Buka kamus ekspor"}
            aria-expanded={isGlossaryOpen}
            title={`${modKey}+K`}
          >
            <Book size={20} />
          </button>

          <div className="w-8 h-px bg-slate-100 my-1" aria-hidden="true" />

          {/* High Contrast */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${highContrast ? "bg-yellow-400 text-black" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label={highContrast ? "Nonaktifkan kontras tinggi" : "Aktifkan kontras tinggi"}
            aria-pressed={highContrast}
            title={`${modKey}+J`}
          >
            <Contrast size={20} />
          </button>

          {/* Font A+ */}
          <button
            onClick={() => setFontSize("xl")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "xl" ? "bg-accent text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label="Teks sangat besar"
            aria-pressed={fontSize === "xl"}
          >
            A+
          </button>

          {/* Font A */}
          <button
            onClick={() => setFontSize("lg")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "lg" ? "bg-accent text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label="Teks besar"
            aria-pressed={fontSize === "lg"}
          >
            A
          </button>

          {/* Reset */}
          <button
            onClick={() => { setFontSize("base"); setHighContrast(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "base" && !highContrast ? "bg-secondary text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label="Reset aksesibilitas"
            title={`${modKey}+0`}
          >
            <RotateCcw size={18} />
          </button>

          <div className="w-8 h-px bg-slate-100 my-1" aria-hidden="true" />

          {/* Shortcuts */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${showShortcuts ? "bg-secondary text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            aria-label="Tampilkan pintasan keyboard"
            aria-expanded={showShortcuts}
          >
            <Keyboard size={18} />
          </button>
        </div>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} role="dialog" aria-modal="true" aria-label="Pintasan keyboard">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-secondary mb-6">Pintasan Keyboard</h2>
            <div className="space-y-3">
              {[
                { keys: `${modKey}+S`, desc: "Bacakan halaman / hentikan" },
                { keys: `${modKey}+K`, desc: "Buka/tutup kamus ekspor" },
                { keys: `${modKey}+J`, desc: "Mode kontras tinggi" },
                { keys: `${modKey}+=`, desc: "Perbesar teks" },
                { keys: `${modKey}+-`, desc: "Perkecil teks" },
                { keys: `${modKey}+0`, desc: "Reset semua pengaturan" },
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
        className={`fixed bottom-8 right-8 z-[60] w-14 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 transform border-4 border-white ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50 pointer-events-none"} hover:bg-secondary hover:-translate-y-2 active:scale-95`}
        tabIndex={isVisible ? 0 : -1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
      </button>
    </>
  );
}
