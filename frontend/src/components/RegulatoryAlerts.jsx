import { Bell, CheckCircle2, AlertTriangle } from 'lucide-react'

const MOCK_ALERTS = [
  {
    id: 1,
    date: '18 Maret 2025',
    severity: 'high',
    title: 'Perubahan Regulasi Ekspor Kopi ke UE',
    desc: 'Uni Eropa memberlakukan EU Deforestation Regulation (EUDR) mulai 30 Desember 2024. Semua eksportir kopi wajib menyertakan bukti bahwa produk tidak berasal dari lahan deforestasi.',
    affected: ['Kopi', 'Kakao', 'Minyak Kelapa Sawit', 'Karet', 'Kayu'],
    action: 'Siapkan dokumentasi supply chain traceability sebelum pengiriman berikutnya ke UE.',
  },
  {
    id: 2,
    date: '15 Maret 2025',
    severity: 'medium',
    title: 'Update Tarif RCEP untuk Keripik Olahan',
    desc: 'Tarif preferensial RCEP untuk HS Code 2005.99 (keripik olahan) diturunkan dari 5% menjadi 2.5% untuk pengiriman ke Korea Selatan mulai April 2025.',
    affected: ['Keripik Singkong', 'Keripik Pisang', 'Keripik Kentang'],
    action: 'Gunakan SKA Form RCEP untuk mendapatkan tarif baru yang lebih rendah.',
  },
  {
    id: 3,
    date: '10 Maret 2025',
    severity: 'low',
    title: 'Pembaruan Sistem INSW 2.0',
    desc: 'Indonesia National Single Window (INSW) meluncurkan versi 2.0 yang menyederhanakan proses pengajuan dokumen ekspor secara elektronik.',
    affected: ['Semua produk ekspor'],
    action: 'Update akun INSW Anda dan pelajari fitur baru di portal insw.go.id.',
  },
  {
    id: 4,
    date: '5 Maret 2025',
    severity: 'medium',
    title: 'Jepang Memperketat Standar Residu Pestisida',
    desc: 'Kementerian Kesehatan Jepang menurunkan batas maksimum residu pestisida Chlorpyrifos pada produk pertanian impor dari 0.05 ppm menjadi 0.01 ppm.',
    affected: ['Kopi', 'Teh', 'Rempah-rempah', 'Sayuran'],
    action: 'Pastikan uji lab terbaru memenuhi batas baru sebelum mengirim ke Jepang.',
  },
]

export default function RegulatoryAlerts() {
  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Notifikasi perubahan regulasi ekspor">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white relative" aria-hidden="true">
          <Bell size={20} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-black">{MOCK_ALERTS.length}</span>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Notifikasi Regulasi</h3>
          <p className="text-xs text-secondary/50 font-medium">Pemberitahuan otomatis jika aturan ekspor berubah</p>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_ALERTS.map((alert) => (
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
              <div className="bg-slate-soft p-3 rounded-xl">
                <p className="text-xs text-secondary/40 font-black uppercase tracking-widest mb-1">Tindakan yang Disarankan</p>
                <p className="text-sm font-medium text-secondary">{alert.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
