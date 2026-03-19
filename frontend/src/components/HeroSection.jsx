import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-white pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="animate-fadeInUp text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Program Transformasi Ekspor UMKM
          </div>

          <h1 className="text-4xl lg:text-6xl font-display font-black text-secondary leading-[1.1] mb-6">
            Bantu UMKM <span className="text-accent underline decoration-accent/20">Ekspor</span> ke Luar Negeri.
          </h1>

          <p className="text-lg md:text-xl text-secondary/70 mb-10 max-w-lg leading-relaxed font-medium">
            Tanya syarat ekspor, cari pembeli, dan buat dokumen otomatis lewat suara. Gratis dan mudah untuk siapa saja.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/demo" className="btn-primary px-10 py-4 text-lg w-full sm:w-auto justify-center">
              Mulai Sekarang — Gratis
            </Link>
            <a href="#cara-kerja" className="px-8 py-4 text-secondary font-bold hover:text-accent transition-colors">
              Lihat Caranya →
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center md:justify-start gap-6 opacity-60">
            <div className="text-center">
              <div className="text-2xl font-black text-secondary">30+</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Dialek Daerah</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-secondary">100%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">Aman & Terpercaya</div>
            </div>
          </div>
        </div>

        <div className="relative animate-fadeInUp hidden md:block">
          <div className="danantara-card pb-0 overflow-hidden rounded-[2.5rem]">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-light rounded-2xl flex items-center justify-center text-accent">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-secondary">Analisis Produk Anda</div>
                  <div className="text-[11px] font-bold text-secondary/50 uppercase tracking-widest">Global Market Gap Detector</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Potensi Pasar', val: 'Tinggi (87/100)', bar: 'w-[87%]', color: 'bg-accent' },
                  { label: 'Permintaan Dunia', val: '$14.2M / Tahun', bar: 'w-[65%]', color: 'bg-secondary' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-soft p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-secondary/60">{item.label}</span>
                      <span className="text-xs font-black text-secondary">{item.val}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.bar} ${item.color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-secondary p-6 mt-8">
              <div className="flex items-center gap-3 text-white">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">AI Sedang Menganalisis...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
