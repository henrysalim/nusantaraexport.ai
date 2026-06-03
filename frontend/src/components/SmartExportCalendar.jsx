import { useState } from 'react'
import { CalendarDays, Sun, Ship, FileText, ShoppingBag, Leaf } from 'lucide-react'
import { getSmartCalendar } from '../services/api'

const TYPE_CONFIG = {
  demand: { icon: <ShoppingBag size={14} />, color: 'bg-accent-light text-accent', label: 'Permintaan' },
  harvest: { icon: <Leaf size={14} />, color: 'bg-green-100 text-green-700', label: 'Panen' },
  logistics: { icon: <Ship size={14} />, color: 'bg-blue-100 text-blue-700', label: 'Logistik' },
  doc: { icon: <FileText size={14} />, color: 'bg-yellow-100 text-yellow-700', label: 'Dokumen' },
}

const MOCK_RESULT = {
  commodity: 'Kopi',
  destination: 'Jepang',
  best_shipping_window: 'September-Oktober (Panen raya selesai → peak demand Eropa/AS)',
  key_deadlines: [
    { deadline: 'SKA (Certificate of Origin)', rule: 'Maks. 7 hari setelah kapal berangkat', priority: 'high' },
    { deadline: 'Phytosanitary Certificate', rule: 'Berlaku 14 hari dari tanggal diterbitkan', priority: 'high' },
    { deadline: 'PEB', rule: 'Diajukan maks. 7 hari sebelum kapal berangkat', priority: 'high' },
    { deadline: 'Booking Kontainer', rule: 'Minimal 14 hari sebelum target sailing date', priority: 'medium' },
  ],
  calendar: [
    { month: 'Januari', events: [{ type: 'demand', title: 'Imlek', desc: 'Permintaan rempah & makanan olahan meningkat', priority: 'high' }] },
    { month: 'Maret-April', events: [{ type: 'demand', title: 'Ramadan', desc: 'Permintaan makanan olahan meningkat', priority: 'high' }, { type: 'harvest', title: 'Awal Panen Kopi', desc: 'Mulai pengumpulan bahan baku', priority: 'medium' }] },
    { month: 'Juni-Agustus', events: [{ type: 'harvest', title: 'Musim Panen Raya', desc: 'Periode produksi maksimal', priority: 'high' }, { type: 'doc', title: 'Sertifikasi Phytosanitary', desc: 'Waktu terbaik mengurus sertifikat', priority: 'high' }] },
    { month: 'September', events: [{ type: 'logistics', title: 'Booking Kontainer FCL', desc: 'Waktu tempuh ke UE/AS: 25-30 hari', priority: 'high' }] },
    { month: 'Oktober-November', events: [{ type: 'demand', title: 'Thanksgiving & Pre-Christmas', desc: 'Peak demand! Harga tertinggi', priority: 'high' }] },
    { month: 'Desember', events: [{ type: 'demand', title: 'Christmas & New Year', desc: 'Permintaan kerajinan & kopi premium', priority: 'high' }] },
  ]
}

export default function SmartExportCalendar() {
  const [commodity, setCommodity] = useState('Kopi')
  const [destination, setDestination] = useState('Jepang')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (!commodity) return
    setLoading(true)
    setResult(null)
    try {
      const response = await getSmartCalendar({ commodity, destination })
      setResult(response.data)
    } catch (error) {
      console.warn('API offline, using mock:', error.message)
      await new Promise(r => setTimeout(r, 1500))
      setResult(MOCK_RESULT)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Smart Export Calendar">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <CalendarDays size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Smart Export Calendar</h3>
          <p className="text-xs text-secondary/50 font-medium">Jadwal ekspor optimal berdasarkan panen, permintaan global & logistik</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Komoditas</label>
          <input type="text" placeholder="Contoh: Kopi" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Negara Tujuan</label>
          <input type="text" placeholder="Contoh: Jepang" className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>
      </div>
      <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full justify-center py-4 mb-6">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Membuat kalender...
          </span>
        ) : '📅 Buat Kalender Ekspor'}
      </button>

      {loading && <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}</div>}

      {result && !loading && (
        <div className="space-y-5 animate-fadeInUp">
          {/* Best Window */}
          <div className="bg-accent-light p-5 rounded-2xl border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={16} className="text-accent" />
              <p className="text-[9px] font-black text-accent uppercase tracking-widest">Window Pengiriman Terbaik</p>
            </div>
            <p className="text-sm font-black text-secondary">{result.best_shipping_window}</p>
          </div>

          {/* Key Deadlines */}
          <div>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Batas Waktu Dokumen Penting</p>
            <div className="space-y-2">
              {result.key_deadlines.map((dl, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${dl.priority === 'high' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className={dl.priority === 'high' ? 'text-red-500' : 'text-yellow-500'} />
                    <span className="text-sm font-bold text-secondary">{dl.deadline}</span>
                  </div>
                  <span className="text-xs font-medium text-secondary/50">{dl.rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Calendar */}
          <div>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Kalender Ekspor Tahunan</p>
            <div className="space-y-3">
              {result.calendar.map((month, mi) => (
                <div key={mi} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-soft px-4 py-2">
                    <span className="text-sm font-black text-secondary">{month.month}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {month.events.map((ev, ei) => {
                      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.demand
                      return (
                        <div key={ei} className="flex items-start gap-3">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-secondary">{ev.title}</p>
                            <p className="text-xs text-secondary/50">{ev.desc}</p>
                          </div>
                          {ev.priority === 'high' && (
                            <span className="ml-auto text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded">PENTING</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
