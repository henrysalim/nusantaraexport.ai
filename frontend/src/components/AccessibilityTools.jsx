import { useState, useEffect } from "react";
import { Volume2, Square, Book, Contrast, RotateCcw } from "lucide-react";
import GlossaryPanel from "./GlossaryPanel";

export default function AccessibilityTools() {
  const [fontSize, setFontSize] = useState("base"); // base, lg, xl
  const [highContrast, setHighContrast] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Text-To-Speech Logic
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = document.querySelector("#main-content")?.innerText || "";
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID"; // Indonesian voice
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Monitor Scroll for Back to Top
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      window.speechSynthesis.cancel(); // Stop speech if component unmounts
    };
  }, []);

  // Update HTML classes for Font Size and Contrast
  useEffect(() => {
    const html = document.documentElement;

    // Font Size
    html.classList.remove("text-lg", "text-xl");
    if (fontSize === "lg") html.classList.add("text-lg");
    if (fontSize === "xl") html.classList.add("text-xl");

    // Contrast
    if (highContrast) {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }
  }, [fontSize, highContrast]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Floating Controls (Bottom Left for Font, Bottom Right for Scroll) */}
      <div className="fixed bottom-8 left-8 z-[60] flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 items-center">
          <span className="text-[10px] font-black uppercase text-secondary/40 mb-1">
            Teks
          </span>
          <button
            onClick={toggleSpeech}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${isSpeaking ? "bg-accent text-white animate-pulse" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title={isSpeaking ? "Hentikan Suara" : "Dengarkan Halaman Ini"}
          >
            {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={20} />}
          </button>
          <div className="w-8 h-px bg-slate-100 my-1" />
          <button
            onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${isGlossaryOpen ? "bg-secondary text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title="Kamus Bahasa Manusia"
          >
            <Book size={20} />
          </button>
          <div className="w-8 h-px bg-slate-100 my-1" />
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${highContrast ? "bg-white text-black" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title="Mode Kontras Tinggi"
          >
            <Contrast size={20} />
          </button>
          <button
            onClick={() => setFontSize("xl")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "xl" ? "bg-accent text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title="Sangat Besar"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize("lg")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "lg" ? "bg-accent text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title="Besar"
          >
            A
          </button>
          <button
            onClick={() => setFontSize("base")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${fontSize === "base" ? "bg-secondary text-white" : "bg-slate-100 text-secondary hover:bg-slate-200"}`}
            title="Normal"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Glossary Panel */}
      <GlossaryPanel
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[60] w-14 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center font-bold text-2xl transition-all duration-300 transform border-4 border-white ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-20 opacity-0 scale-50"
        } hover:bg-secondary hover:-translate-y-2 active:scale-95`}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-up-icon font-bold lucide-arrow-up"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </span>
      </button>
    </>
  );
}
