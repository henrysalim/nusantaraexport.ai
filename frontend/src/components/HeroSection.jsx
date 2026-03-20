import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const WORDS = ["Ekspor!", "Mendunia!", "Berkembang!", "Bersaing!"];

export default function HeroSection() {
  const wordRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      let tl = gsap.timeline({ repeat: -1 });

      WORDS.forEach((word) => {
        // Typing effect
        tl.to(wordRef.current, {
          duration: word.length * 0.1,
          text: {
            value: word,
            delimiter: "",
          },
          ease: "none",
        })
        .to({}, { duration: 2 }) // Pause
        .to(wordRef.current, {
          duration: word.length * 0.05,
          text: {
            value: "",
            delimiter: "",
          },
          ease: "none",
        })
        .to({}, { duration: 0.5 }); // Short pause before next word
      });
    }, wordRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      className="relative h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden"
      aria-label="Halaman utama NusantaraExport.AI"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1553673257-c9c9cb846dfc?q=80&w=2070&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
      </div>

      {/* Ornament Blur */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-20" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 z-20" aria-hidden="true" />

      {/* Content */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-30 w-full">
        {/* Left Column */}
        <div className="animate-fadeInUp text-center md:text-left md:max-w-xl pl-0 md:pl-4">
          <h1 className="text-4xl lg:text-6xl font-display font-black text-white leading-tight min-h-[160px] md:min-h-[220px]">
            UMKM Indonesia, <br />
            sudah saatnya <br />
            <span
              ref={wordRef}
              className="text-accent underline decoration-accent/85 inline-block"
              aria-label="Ekspor, Mendunia, Berkembang, Bersaing"
            >
              Ekspor!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed font-medium">
            Tanya aturan ekspor, cek peluang pasar dunia, verifikasi kemasan,
            hingga buat dokumen otomatis — cukup bicara atau ketik, gratis!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/demo"
              className="btn-primary px-10 py-4 text-lg w-full sm:w-auto justify-center"
              aria-label="Mulai menggunakan NusantaraExport.AI secara gratis"
            >
              Mulai Sekarang — Gratis
            </Link>
            <a
              href="#cara-kerja"
              className="px-8 py-4 text-white w-full md:w-auto font-bold hover:text-accent transition-colors ease-in-out duration-200 hover:bg-white rounded-md"
            >
              Lihat Caranya →
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center md:justify-start gap-6 opacity-80">
            <div className="text-center">
              <div className="text-2xl font-black text-white" aria-label="Tujuh jenis dokumen ekspor">7+</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Dokumen Ekspor
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <div className="text-2xl font-black text-white" aria-label="Seratus persen aman dan terpercaya">100%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Aman & Terpercaya
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <div className="text-2xl font-black text-white" aria-label="Ramah disabilitas">♿</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Inklusif
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Dashboard Preview */}
        <div className="relative animate-fadeInUp hidden md:block w-full max-w-md ml-auto" aria-hidden="true">
          <div className="bg-white/25 border border-white/20 pb-0 overflow-hidden rounded-[2.5rem] shadow-2xl transform translate-z-0">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-white">
                    Analisis Produk Anda
                  </div>
                  <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                    Export Readiness Simulator
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Kesiapan Ekspor",
                    val: "Tinggi (87/100)",
                    bar: "w-[87%]",
                    color: "bg-accent",
                  },
                  {
                    label: "Permintaan Dunia",
                    val: "$14.2M / Tahun",
                    bar: "w-[65%]",
                    color: "bg-white",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white/5 p-4 rounded-2xl border border-white/10"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white/60">
                        {item.label}
                      </span>
                      <span className="text-xs font-black text-white">
                        {item.val}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={parseInt(item.bar.match(/\d+/)?.[0] || 0)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full ${item.bar} ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 p-6 mt-8 border-t border-white/10">
              <div className="flex items-center gap-3 text-white">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                  AI Sedang Menganalisis...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
