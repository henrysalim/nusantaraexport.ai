import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-soft pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black text-secondary mb-3">Hubungi Kami</h1>
          <p className="text-secondary/50 font-medium max-w-lg mx-auto">
            Punya pertanyaan, masukan, atau butuh bantuan? Tim kami siap membantu UMKM Indonesia.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {[
              { icon: <Mail size={20} />, title: 'Email', detail: 'support@nusantaraexport.ai', sub: 'Respons dalam 1x24 jam' },
              { icon: <Phone size={20} />, title: 'Telepon', detail: '+62 21-3456-7890', sub: 'Senin-Jumat, 08:00 - 17:00 WIB' },
              { icon: <MapPin size={20} />, title: 'Kantor', detail: 'Jakarta, Indonesia', sub: 'Program DIGDAYA X Hackathon 2025' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent" aria-hidden="true">
                    {c.icon}
                  </div>
                  <h3 className="font-black text-secondary">{c.title}</h3>
                </div>
                <p className="font-bold text-secondary text-sm">{c.detail}</p>
                <p className="text-xs text-secondary/40 mt-1">{c.sub}</p>
              </div>
            ))}

            <div className="bg-secondary rounded-2xl p-6 text-white">
              <h3 className="font-black text-lg mb-2">FAQ Cepat</h3>
              <div className="space-y-3">
                {[
                  { q: 'Apakah gratis?', a: 'Ya, 100% gratis untuk UMKM Indonesia.' },
                  { q: 'Perlu install aplikasi?', a: 'Tidak, cukup buka lewat browser.' },
                  { q: 'Data saya aman?', a: 'Ya, data terenkripsi dan tidak dibagikan.' },
                ].map((faq, i) => (
                  <div key={i}>
                    <p className="text-white/80 text-sm font-bold">{faq.q}</p>
                    <p className="text-white/50 text-xs">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-12 text-center animate-fadeInUp">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-secondary mb-3">Pesan Terkirim!</h2>
                <p className="text-secondary/50 font-medium mb-6">
                  Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1x24 jam kerja.
                </p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }} className="btn-primary px-8 py-3">
                  Kirim Pesan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="c-name" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama</label>
                    <input id="c-name" type="text" placeholder="Nama Anda" className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Email</label>
                    <input id="c-email" type="email" placeholder="email@bisnis.com" className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-subject" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Subjek</label>
                  <select id="c-subject" className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option value="">Pilih topik</option>
                    <option value="general">Pertanyaan Umum</option>
                    <option value="technical">Bantuan Teknis</option>
                    <option value="partnership">Kerja Sama</option>
                    <option value="feedback">Masukan & Saran</option>
                    <option value="bug">Laporkan Masalah</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="c-message" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Pesan</label>
                  <textarea id="c-message" placeholder="Tulis pesan Anda di sini..." className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent resize-none" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Mengirim...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><Send size={18} /> Kirim Pesan</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
