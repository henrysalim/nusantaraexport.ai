import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-20 pb-10 px-6" role="contentinfo" aria-label="Informasi kontak dan navigasi tambahan">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6" aria-label="NusantaraExport.AI - Kembali ke halaman utama">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg" aria-hidden="true">
                <span className="text-xl font-bold">N</span>
              </div>
              <span className="font-display font-black text-xl text-secondary tracking-tight">
                Nusantara<span className="text-accent">Export</span>.AI
              </span>
            </Link>
            <p className="text-secondary/50 font-medium max-w-sm mb-8 leading-relaxed">
              Membantu jutaan UMKM Indonesia merambah pasar global melalui
              teknologi AI yang mudah digunakan, inklusif, dan ramah disabilitas.
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <h4 className="font-black text-secondary mb-6 uppercase tracking-widest text-xs">
              Navigasi
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Beranda", href: "/" },
                { label: "Dashboard Ekspor", href: "/demo" },
                { label: "Masuk / Daftar", href: "/login" },
                { label: "Profil", href: "/profil" },
                { label: "Hubungi Kami", href: "/kontak" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm font-bold text-secondary/60 hover:text-accent transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="font-black text-secondary mb-6 uppercase tracking-widest text-xs">
              Aksesibilitas
            </h4>
            <ul className="space-y-4">
              <li><span className="text-sm font-bold text-secondary/60">Navigasi keyboard penuh</span></li>
              <li><span className="text-sm font-bold text-secondary/60">Pembaca layar (screen reader)</span></li>
              <li><span className="text-sm font-bold text-secondary/60">Text-to-Speech bahasa Indonesia</span></li>
              <li><span className="text-sm font-bold text-secondary/60">Mode kontras tinggi</span></li>
              <li><span className="text-sm font-bold text-secondary/60">Perbesar teks</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
            &copy; 2025 NusantaraExport.AI — Prototype DIGDAYA X Hackathon
          </p>
          <span className="text-xs text-secondary/40 font-medium">
            Dibangun untuk UMKM Indonesia | Inklusif & Ramah Disabilitas
          </span>
        </div>
      </div>
    </footer>
  );
}
