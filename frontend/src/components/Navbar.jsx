import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "/#tentang", label: "Tentang" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  {
    href: "/#fitur",
    label: "Fitur",
    dropdownItems: [
      { href: "/komunitas", label: "Komunitas" },
      { href: "/marketplace", label: "Marketplace" },
    ],
  },
  { href: "/kemitraan", label: "Kemitraan" },
  { href: "/kontak", label: "Hubungi Kami" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.hash && location.pathname === "/") {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = () => setDropdownOpen(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setDropdownOpen(false);
    await logout();
  };

  return (
    <nav
      role="navigation"
      aria-label="Navigasi utama"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white shadow-md py-3`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="NusantaraExport.AI - Halaman Utama">
          <div className="w-20 h-20 flex items-center justify-center text-white" aria-hidden="true">
            <img src="logo.png" alt="NusantaraExport.AI Logo" />
          </div>
          <span className="font-display font-black text-xl text-secondary tracking-tight">
            Nusantara<span className="text-accent">Export</span>.AI
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <ul className="flex items-center gap-1" role="list">
            {navLinks.map((l) => {
              if (l.dropdownItems) {
                return (
                  <li key={l.href} className="relative group py-1">
                    <div className="flex items-center gap-0.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <Link
                        to={l.href}
                        className="pl-4 pr-1 py-2 text-[15px] font-bold text-secondary/70 group-hover:text-accent transition-colors whitespace-nowrap"
                      >
                        {l.label}
                      </Link>
                      <span className="pr-3 py-2 text-secondary/40 group-hover:text-accent transition-colors cursor-pointer flex items-center">
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    <div className="absolute left-0 top-full hidden group-hover:block w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 z-50">
                      {l.dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block px-4 py-2.5 text-sm font-bold text-secondary/80 hover:text-accent hover:bg-slate-50 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              }
              return (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="px-4 py-2 text-[15px] font-bold text-secondary/70 hover:text-accent transition-colors rounded-lg hover:bg-slate-50 whitespace-nowrap"
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 whitespace-nowrap">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Menu pengguna"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-bold text-secondary shrink-0">{user?.full_name?.split(' ')[0] || 'Profil'}</span>
                  <svg
                    className={`w-4 h-4 text-secondary/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 z-50">
                    <Link
                      to="/profil"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-secondary/80 hover:text-accent hover:bg-slate-50 transition-colors"
                    >
                      <User size={16} className="text-secondary/60" /> Profil Saya
                    </Link>
                    <hr className="border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-secondary border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0">
                <LogIn size={16} className="text-accent" /> Masuk
              </Link>
            )}
            <Link to="/demo" className="btn-primary shrink-0">
              Coba Sekarang
            </Link>
          </div>
        </div>

        <button
          className="lg:hidden p-2 text-secondary"
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
        <div id="mobile-menu" className="lg:hidden bg-white border-t border-slate-100 shadow-xl py-6 px-6" role="menu">
          <ul className="flex flex-col gap-4">
            {navLinks.map((l) => (
              <li key={l.href} role="none" className="flex flex-col gap-2">
                <Link
                  to={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-lg font-bold text-secondary"
                  role="menuitem"
                >
                  {l.label}
                </Link>
                {l.dropdownItems && (
                  <div className="flex flex-col gap-2 pl-4 border-l border-slate-100 mt-1">
                    {l.dropdownItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block text-base font-semibold text-secondary/70 hover:text-accent"
                        role="menuitem"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li role="none">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <Link to="/profil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-lg font-bold text-secondary" role="menuitem">
                    <User size={18} /> Profil Saya
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-lg font-bold text-red-500 hover:text-red-600"
                    role="menuitem"
                  >
                    <LogOut size={18} /> Keluar
                  </button>
                </div>
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

