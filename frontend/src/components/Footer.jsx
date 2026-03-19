import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-20 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg">
                <span className="text-xl font-bold">N</span>
              </div>
              <span className="font-display font-black text-xl text-secondary tracking-tight">
                Nusantara<span className="text-accent">Export</span>.AI
              </span>
            </Link>
            <p className="text-secondary/50 font-medium max-w-sm mb-8 leading-relaxed">
              Membantu jutaan UMKM Indonesia merambah pasar global melalui teknologi AI yang mudah digunakan dan inklusif.
            </p>
          </div>

          <div>
            <h4 className="font-black text-secondary mb-6 uppercase tracking-widest text-xs">Navigasi</h4>
            <ul className="space-y-4">
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Tentang', href: '/#tentang' },
                { label: 'Fitur', href: '/#fitur' },
                { label: 'Cara Kerja', href: '/#cara-kerja' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm font-bold text-secondary/60 hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-secondary mb-6 uppercase tracking-widest text-xs">Pusat Bantuan</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-bold text-secondary/60 hover:text-accent">Panduan Ekspor</a></li>
              <li><a href="#" className="text-sm font-bold text-secondary/60 hover:text-accent">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-sm font-bold text-secondary/60 hover:text-accent">Hubungi Kami</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-secondary/30 uppercase tracking-widest">
            &copy; 2025 NusantaraExport.AI — Hackathon Bank Indonesia & OJK
          </p>
          <span className="text-xs text-secondary/30">Dibangun dengan ❤️ untuk UMKM Indonesia</span>
        </div>
      </div>
    </footer>
  )
}
