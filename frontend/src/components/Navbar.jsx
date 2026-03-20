import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, LogIn, Phone } from "lucide-react";

const navLinks = [
  { href: "/#tentang", label: "Tentang" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/kontak", label: "Hubungi Kami" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Check localStorage for logged in user
  useEffect(() => {
    const stored = localStorage.getItem('ne_user');
    if (stored) setUser(JSON.parse(stored));
  }, [location]);

  useEffect(() => {
    if (location.hash && location.pathname === "/") {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape" && menuOpen) setMenuOpen(false); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [menuOpen]);

  return (
    <nav
      role="navigation"
      aria-label="Navigasi utama"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-3" : "bg-white py-5"}`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="NusantaraExport.AI - Halaman Utama">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg" aria-hidden="true">
            <span className="text-xl font-bold">N</span>
          </div>
          <span className="font-display font-black text-xl text-secondary tracking-tight">
            Nusantara<span className="text-accent">Export</span>.AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-1" role="list">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className="px-4 py-2 text-[15px] font-bold text-secondary/70 hover:text-accent transition-colors rounded-lg hover:bg-slate-50"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/profil" className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Edit profil saya">
                <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-bold text-secondary">{user.name?.split(' ')[0] || 'Profil'}</span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-secondary border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all">
                <LogIn size={16} className="text-accent" /> Masuk
              </Link>
            )}
            <Link to="/demo" className="btn-primary">
              Coba Sekarang
            </Link>
          </div>
        </div>

        <button
          className="md:hidden p-2 text-secondary"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden bg-white border-t border-slate-100 shadow-xl py-6 px-6" role="menu">
          <ul className="flex flex-col gap-4">
            {navLinks.map((l) => (
              <li key={l.href} role="none">
                <Link to={l.href} onClick={() => setMenuOpen(false)} className="block text-lg font-bold text-secondary" role="menuitem">{l.label}</Link>
              </li>
            ))}
            <li role="none">
              {user ? (
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-lg font-bold text-secondary" role="menuitem">
                  <User size={18} /> Profil Saya
                </Link>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-secondary" role="menuitem">
                  <LogIn size={18} className="text-accent" /> Masuk
                </Link>
              )}
            </li>
            <li role="none">
              <Link to="/demo" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center" role="menuitem">Coba Sekarang</Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
