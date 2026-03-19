import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { href: '/#tentang', label: 'Tentang' },
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/#fitur', label: 'Fitur' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.hash && location.pathname === '/') {
      const el = document.querySelector(location.hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg">
            <span className="text-xl font-bold">N</span>
          </div>
          <span className="font-display font-black text-xl text-secondary tracking-tight">
            Nusantara<span className="text-accent">Export</span>.AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-2">
            {navLinks.map(l => (
              <li key={l.href}>
                <Link to={l.href} className="px-4 py-2 text-[15px] font-bold text-secondary/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/demo" className="btn-primary">Coba Sekarang</Link>
        </div>

        <button className="md:hidden p-2 text-secondary" onClick={() => setMenuOpen(o => !o)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl py-6 px-6">
          <ul className="flex flex-col gap-4">
            {navLinks.map(l => (
              <li key={l.href}>
                <Link to={l.href} onClick={() => setMenuOpen(false)} className="block text-lg font-bold text-secondary">{l.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/demo" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">Coba Sekarang</Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
