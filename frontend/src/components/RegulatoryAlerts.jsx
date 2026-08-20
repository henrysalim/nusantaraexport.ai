import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, AlertTriangle, Loader, RefreshCw, ExternalLink } from 'lucide-react'
import { sendChatMessage } from '../services/api'

// Seed data regulasi terbaru — dipakai sebagai fallback jika AI offline
const SEED_ALERTS = [
  {
    id: 1,
    date: 'Maret 2026',
    severity: 'high',
    title: 'EU Deforestation Regulation (EUDR) — Berlaku 30 Des 2024',
    desc: 'Uni Eropa memberlakukan EUDR. Semua eksportir kopi, kakao, kayu, karet, minyak sawit, dan sapi wajib menyertakan bukti bahwa produk tidak berasal dari lahan deforestasi setelah 31 Desember 2020.',
    affected: ['Kopi', 'Kakao', 'Minyak Kelapa Sawit', 'Karet', 'Kayu'],
    action: 'Siapkan dokumentasi supply chain traceability (geolokasi kebun/pabrik). Gunakan platform seperti KYC/EUDR compliance tool.',
    source: 'EUR-Lex EUDR Regulation (EU) 2023/1115',
  },
  {
    id: 2,
    date: 'April 2026',
    severity: 'medium',
    title: 'Penurunan Tarif RCEP Produk Keripik Olahan ke Korea',
    desc: 'Tarif preferensial RCEP untuk HS Code 2005.99 (keripik olahan) diturunkan dari 5% menjadi 2.5% untuk pengiriman ke Korea Selatan mulai April 2026.',
    affected: ['Keripik Singkong', 'Keripik Pisang', 'Keripik Kentang'],
    action: 'Gunakan SKA Form RCEP (diterbitkan oleh Kemendag) untuk mendapatkan tarif baru yang lebih rendah.',
    source: 'RCEP Schedule of Concessions Korea',
  },
  {
    id: 3,
    date: 'Januari 2026',
    severity: 'low',
    title: 'Pembaruan Sistem INSW 2.0 — Pengajuan Dokumen Digital',
    desc: 'Indonesia National Single Window (INSW) meluncurkan versi 2.0 yang menyederhanakan proses pengajuan dokumen ekspor secara elektronik, termasuk PEB, CoO, dan perizinan ekspor.',
    affected: ['Semua produk ekspor'],
    action: 'Update akun INSW Anda di insw.go.id dan pelajari fitur baru termasuk e-PEB dan integrasi LNSW.',
    source: 'Kementerian Keuangan RI — Portal INSW',
  },
  {
    id: 4,
    date: 'Februari 2026',
    severity: 'medium',
    title: 'Jepang Perketat Batas Residu Pestisida (Chlorpyrifos)',
    desc: 'Kementerian Kesehatan Jepang menurunkan batas maksimum residu pestisida Chlorpyrifos pada produk pertanian impor dari 0.05 ppm menjadi 0.01 ppm efektif Maret 2026.',
    affected: ['Kopi', 'Teh', 'Rempah-rempah', 'Sayuran', 'Buah-buahan'],
    action: 'Pastikan uji laboratorium terbaru memenuhi batas baru sebelum mengirim ke Jepang. Sertakan hasil uji lab dari lembaga terakreditasi.',
    source: 'Japan MHL Ministry Notification No. 370',
  },
]

export default function RegulatoryAlerts() {
  const [alerts, setAlerts] = useState(SEED_ALERTS)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiError, setAiError] = useState('')

  const fetchAISummary = async () => {
    setLoadingAI(true)
    setAiError('')
    try {
      const res = await sendChatMessage(
        'Berikan ringkasan 3 regulasi ekspor Indonesia terbaru tahun 2025-2026 yang paling penting untuk UMKM. ' +
        'Format: nomor, judul regulasi, dampak singkat, dan tindakan yang harus diambil.',
        {}
      )
      setAiSummary(res.data?.reply || '')
    } catch (err) {
      console.error('Regulatory AI error:', err)
      setAiError('Koneksi ke AI Engine tidak tersedia. Menampilkan data regulasi terkurasi.')
    } finally {
      setLoadingAI(false)
    }
  }

  // Load AI summary sekali saat komponen mount
  useEffect(() => {
    fetchAISummary()
  }, [])

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Notifikasi perubahan regulasi ekspor">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white relative" aria-hidden="true">
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[9px] text-white font-black">{alerts.length}</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-secondary">Notifikasi Regulasi</h3>
            <p className="text-xs text-secondary/50 font-medium">Regulasi ekspor terbaru 2025–2026</p>
          </div>
        </div>
        <button
          onClick={fetchAISummary}
          disabled={loadingAI}
          className="flex items-center gap-1.5 text-xs font-bold text-secondary/50 hover:text-accent transition-colors disabled:opacity-40"
        >
          {loadingAI ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Update AI
        </button>
      </div>

      {/* AI Summary Panel */}
      {(aiSummary || loadingAI || aiError) && (
        <div className={`mb-6 p-5 rounded-2xl border ${aiError ? 'bg-yellow-50 border-yellow-200' : 'bg-accent-light border-accent/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
              <Bell size={12} className="text-white" />
            </div>
            <span className="text-xs font-black text-accent uppercase tracking-widest">
              {aiError ? 'Catatan' : 'Ringkasan AI — Regulasi Terkini'}
            </span>
          </div>
          {loadingAI ? (
            <div className="flex items-center gap-2 text-accent text-sm font-bold">
              <Loader size={14} className="animate-spin" />
              AI sedang menganalisis regulasi terkini...
            </div>
          ) : aiError ? (
            <p className="text-yellow-700 text-sm font-medium">{aiError}</p>
          ) : (
            <p className="text-secondary/80 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
          )}
        </div>
      )}

      {/* Alert Cards */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`border rounded-2xl overflow-hidden ${
            alert.severity === 'high' ? 'border-red-200' : alert.severity === 'medium' ? 'border-yellow-200' : 'border-slate-200'
          }`}>
            <div className={`px-5 py-3 flex items-center justify-between ${
              alert.severity === 'high' ? 'bg-red-50' : alert.severity === 'medium' ? 'bg-yellow-50' : 'bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                {alert.severity === 'high' ? (
                  <AlertTriangle size={14} className="text-red-500" />
                ) : alert.severity === 'medium' ? (
                  <AlertTriangle size={14} className="text-yellow-500" />
                ) : (
                  <CheckCircle2 size={14} className="text-green-500" />
                )}
                <span className={`text-xs font-black uppercase tracking-widest ${
                  alert.severity === 'high' ? 'text-red-600' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {alert.severity === 'high' ? 'Penting' : alert.severity === 'medium' ? 'Perhatian' : 'Info'}
                </span>
              </div>
              <span className="text-[10px] text-secondary/30 font-bold">{alert.date}</span>
            </div>
            <div className="p-5">
              <h4 className="font-black text-secondary mb-2">{alert.title}</h4>
              <p className="text-sm text-secondary/60 leading-relaxed mb-3">{alert.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {alert.affected.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-secondary/50">{a}</span>
                ))}
              </div>
              <div className="bg-slate-soft p-3 rounded-xl mb-3">
                <p className="text-xs text-secondary/40 font-black uppercase tracking-widest mb-1">Tindakan yang Disarankan</p>
                <p className="text-sm font-medium text-secondary">{alert.action}</p>
              </div>
              {alert.source && (
                <p className="text-[10px] text-secondary/30 font-bold flex items-center gap-1">
                  <ExternalLink size={10} /> Sumber: {alert.source}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
