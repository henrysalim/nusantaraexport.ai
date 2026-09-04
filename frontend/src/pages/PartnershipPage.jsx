import { useEffect, useRef } from 'react';
import { 
  HandshakeIcon, MessageCircle, CheckCircle, 
  Globe, TrendingUp, ShieldCheck, Users, 
  ArrowRight, Star, MapPin, Phone, Mail,
  Package, Award, BarChart3
} from 'lucide-react';
import gsap from 'gsap';

const WA_NUMBER = '6281586043931';
const WA_PARTNERSHIP_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  'Halo, saya ingin mengetahui lebih lanjut tentang program kemitraan UMKM di NusantaraExport.AI.\n\nMohon informasikan syarat dan prosedur bergabung sebagai mitra. Terima kasih!'
)}`;

const MITRA_DATA = [
  {
    name: 'Lunelo',
    tagline: 'Little Things, Big Smiles ✨',
    location: 'Bandung, Jawa Barat',
    category: 'Kerajinan & Aksesori',
    products: ['Keycap Fidget Keychain', 'Custom Clicker Keychain', 'Kawaii Charm Keychain'],
    highlight: 'Mitra Ekspor Perdana',
    badge: 'Verified Partner',
    rating: 4.9,
    exportCount: 1,
    waNumber: WA_NUMBER,
    description:
      'Lunelo adalah brand aksesori handmade asal Bandung yang menghadirkan kebahagiaan lewat produk-produk kecil yang imut dan unik. Spesialis clicker & custom keychain kawaii yang dibuat dengan penuh perasaan — cocok sebagai souvenir, merchandise, maupun produk ekspor ke pasar Asia dan Eropa.',
    achievements: ['Handmade with love', 'Custom order ready', 'Kawaii aesthetic'],
  },
];

const BENEFITS = [
  {
    icon: Globe,
    title: 'Jangkauan Pasar Global',
    desc: 'Produk Anda tampil di hadapan buyer internasional dari 50+ negara melalui platform NusantaraExport.AI.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: TrendingUp,
    title: 'Analisis Harga AI',
    desc: 'Dapatkan rekomendasi harga ekspor optimal berbasis data pasar global real-time dari AI kami.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: ShieldCheck,
    title: 'Verifikasi & Sertifikasi',
    desc: 'Tim kami membantu proses verifikasi produk, dokumen ekspor, dan standar internasional.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Users,
    title: 'Komunitas Eksklusif',
    desc: 'Bergabung dengan komunitas eksportir UMKM, dapatkan mentoring dan sharing session rutin.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analitik',
    desc: 'Pantau performa produk, tren permintaan, dan potensi pasar melalui dashboard interaktif.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: Package,
    title: 'Panduan Packaging Ekspor',
    desc: 'Bimbingan packaging standar internasional agar produk aman sampai ke tangan buyer.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
];

const STEPS = [
  { num: '01', title: 'Hubungi Kami via WhatsApp', desc: 'Kirim pesan ke nomor WA kami dan ceritakan produk UMKM Anda.' },
  { num: '02', title: 'Verifikasi & Konsultasi', desc: 'Tim kami akan menghubungi untuk verifikasi dan konsultasi ekspor gratis.' },
  { num: '03', title: 'Daftarkan Produk', desc: 'Daftarkan produk ke marketplace NusantaraExport.AI dengan panduan lengkap.' },
  { num: '04', title: 'Go Global!', desc: 'Produk Anda siap menjangkau buyer internasional dari seluruh dunia.' },
];

export default function PartnershipPage() {
  const heroRef = useRef(null);
  const mitraRef = useRef(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-soft pt-28 pb-20">

      {/* ── HERO ── */}
      <section className="bg-secondary text-white py-20 px-6 mb-16 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div ref={heroRef} className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-full px-5 py-2 text-sm font-black mb-6">
            <HandshakeIcon size={16} />
            Program Kemitraan UMKM
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-6">
            Bersama Kita{' '}
            <span className="text-accent">Menduniakan</span>
            <br />Produk UMKM Indonesia
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Jadilah bagian dari ekosistem ekspor digital terdepan. Kami hadir untuk membantu 
            UMKM Indonesia menembus pasar global dengan teknologi AI dan jaringan buyer internasional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WA_PARTNERSHIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              id="cta-partnership-wa-hero"
              className="inline-flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-2xl transition-all text-lg shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              <MessageCircle size={22} />
              Daftar Kemitraan via WhatsApp
            </a>
            <a
              href="#mitra-kami"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all"
            >
              Lihat Mitra Kami <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">

        {/* ── STATISTIK ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {[
            { num: '1', label: 'Mitra UMKM Aktif', suffix: '' },
            { num: '50', label: 'Negara Tujuan Ekspor', suffix: '+' },
            { num: '1', label: 'Produk Terdaftar', suffix: '' },
            { num: '100', label: 'Kepuasan Mitra', suffix: '%' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <p className="text-4xl font-display font-black text-accent mb-1">
                {s.num}<span className="text-2xl">{s.suffix}</span>
              </p>
              <p className="text-sm font-bold text-secondary/60">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── MITRA KAMI ── */}
        <section id="mitra-kami" className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-accent uppercase tracking-widest">Mitra Terpercaya</span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-secondary mt-2">
              Mitra UMKM Kami
            </h2>
            <p className="text-secondary/60 mt-3 max-w-xl mx-auto">
              Kenali mitra-mitra UMKM yang telah bergabung dan buktikan kualitas produk Indonesia di pasar global.
            </p>
          </div>

          <div ref={mitraRef} className="space-y-8">
            {MITRA_DATA.map((mitra, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left: Branding */}
                  <div className="lg:w-72 bg-gradient-to-br from-secondary to-secondary/80 p-10 flex flex-col items-center justify-center text-white shrink-0">
                    <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mb-4 text-4xl font-display font-black">
                      {mitra.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-display font-black text-center">{mitra.name}</h3>
                    <p className="text-white/70 text-sm text-center mt-1">{mitra.tagline}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <MapPin size={14} className="text-accent" />
                      <span className="text-sm font-bold text-white/80">{mitra.location}</span>
                    </div>
                    <span className="mt-4 bg-accent text-white text-xs font-black px-4 py-1.5 rounded-full">
                      {mitra.highlight}
                    </span>
                  </div>

                  {/* Right: Detail */}
                  <div className="flex-1 p-8 flex flex-col">
                    <div className="flex flex-wrap items-start gap-3 mb-6">
                      <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-black px-3 py-1.5 rounded-full border border-green-100">
                        <ShieldCheck size={13} /> {mitra.badge}
                      </span>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full border border-amber-100">
                        <Star size={13} fill="currentColor" /> {mitra.rating} / 5.0
                      </span>
                      <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1.5 rounded-full border border-blue-100">
                        {mitra.exportCount} Produk Terdaftar
                      </span>
                    </div>

                    <p className="text-secondary/70 text-sm leading-relaxed mb-6">{mitra.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Produk Unggulan</p>
                        <ul className="space-y-1.5">
                          {mitra.products.map((p, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm font-bold text-secondary">
                              <Package size={14} className="text-accent shrink-0" /> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Pencapaian</p>
                        <ul className="space-y-1.5">
                          {mitra.achievements.map((a, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm font-bold text-secondary">
                              <CheckCircle size={14} className="text-green-500 shrink-0" /> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Contact CTA */}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                      <a
                        href={`https://wa.me/${mitra.waNumber}?text=${encodeURIComponent(
                          `Halo Lunelo! Saya menemukan produk Anda di NusantaraExport.AI dan ingin mengetahui lebih lanjut tentang produk unggulan Anda. Bisakah kita terhubung?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        id={`cta-mitra-wa-${idx}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black py-3.5 px-6 rounded-xl transition-colors shadow-md"
                      >
                        <MessageCircle size={18} />
                        Hubungi via WhatsApp
                      </a>
                      <a
                        href="/marketplace"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-secondary font-bold py-3.5 px-6 rounded-xl transition-colors border border-slate-200"
                      >
                        <Package size={18} />
                        Lihat Produk di Marketplace
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MANFAAT BERMITRA ── */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-accent uppercase tracking-widest">Mengapa Bermitra?</span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-secondary mt-2">
              Keuntungan Menjadi Mitra
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${b.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <b.icon size={22} className={b.color} />
                </div>
                <h3 className="font-black text-secondary mb-2">{b.title}</h3>
                <p className="text-secondary/60 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CARA BERGABUNG ── */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-accent uppercase tracking-widest">Cara Bergabung</span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-secondary mt-2">
              4 Langkah Mudah
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-md transition-shadow h-full">
                  <span className="text-5xl font-display font-black text-slate-100 block mb-4 leading-none">{step.num}</span>
                  <h3 className="font-black text-secondary mb-2 text-base">{step.title}</h3>
                  <p className="text-secondary/60 text-sm leading-relaxed">{step.desc}</p>
                  {i === 0 && (
                    <a
                      href={WA_PARTNERSHIP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-green-600 font-black text-sm hover:text-green-700"
                    >
                      <MessageCircle size={15} /> Chat Sekarang
                    </a>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight size={20} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA UTAMA ── */}
        <section className="bg-gradient-to-br from-secondary to-secondary/80 rounded-3xl p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10">
            <Award size={48} className="text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              Siap Membawa Produk Anda<br />ke Pasar Dunia?
            </h2>
            <p className="text-white/75 text-lg max-w-xl mx-auto mb-8">
              Bergabunglah bersama kami sekarang. Konsultasi awal gratis dan tanpa komitmen. 
              Tim kami siap membantu setiap langkah perjalanan ekspor Anda.
            </p>

            {/* WA Contact Card */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-5 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">WhatsApp Kemitraan</p>
                  <p className="text-white font-black text-lg">+62 813-1875-6412</p>
                </div>
              </div>
              <div className="h-px sm:h-10 w-full sm:w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={22} className="text-white/80" />
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Jam Operasional</p>
                  <p className="text-white font-black text-sm">Senin–Jumat, 08.00–17.00 WIB</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WA_PARTNERSHIP_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="cta-partnership-wa-bottom"
                className="inline-flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-black px-10 py-4 rounded-2xl transition-all text-lg shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
              >
                <MessageCircle size={22} />
                Mulai Kemitraan via WhatsApp
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
