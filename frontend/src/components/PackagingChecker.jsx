import { useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle, XCircle, Camera } from 'lucide-react'

const MOCK_RESULTS = {
  good: {
    score: 92,
    status: 'Siap Ekspor',
    items: [
      { label: 'Label Bahasa Inggris', status: 'pass', note: 'Terdeteksi — sudah sesuai standar internasional' },
      { label: 'Informasi Nutrisi', status: 'pass', note: 'Format Nutrition Facts sesuai FDA style' },
      { label: 'Tanggal Kedaluwarsa', status: 'pass', note: 'Format DD/MM/YYYY terdeteksi dengan jelas' },
      { label: 'Kode Barcode', status: 'pass', note: 'EAN-13 valid terdeteksi' },
      { label: 'Berat Bersih / Netto', status: 'warning', note: 'Tambahkan satuan oz untuk pasar AS' },
      { label: 'Sertifikasi Halal', status: 'pass', note: 'Logo MUI terdeteksi' },
      { label: 'Negara Asal', status: 'pass', note: '"Made in Indonesia" terdeteksi' },
    ],
    suggestion: 'Kemasan Anda sudah 92% siap ekspor. Tambahkan satuan oz di samping gram untuk memenuhi standar FDA Amerika Serikat.'
  },
  bad: {
    score: 45,
    status: 'Perlu Perbaikan',
    items: [
      { label: 'Label Bahasa Inggris', status: 'fail', note: 'Tidak ditemukan — wajib untuk ekspor' },
      { label: 'Informasi Nutrisi', status: 'fail', note: 'Belum ada Nutrition Facts panel' },
      { label: 'Tanggal Kedaluwarsa', status: 'warning', note: 'Format tidak standar, gunakan DD/MM/YYYY' },
      { label: 'Kode Barcode', status: 'pass', note: 'EAN-13 valid terdeteksi' },
      { label: 'Berat Bersih / Netto', status: 'fail', note: 'Tidak terlihat pada kemasan' },
      { label: 'Sertifikasi Halal', status: 'warning', note: 'Logo tidak jelas, resolusi rendah' },
      { label: 'Negara Asal', status: 'fail', note: '"Made in Indonesia" belum tercantum' },
    ],
    suggestion: 'Kemasan Anda belum siap ekspor. Prioritas utama: tambahkan label bahasa Inggris, Nutrition Facts, dan tulisan "Made in Indonesia".'
  }
}

export default function PackagingChecker() {
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleUpload = () => {
    // Simulate file selection
    setFileName('kemasan_keripik_singkong.jpg')
    setAnalyzing(true)
    setResult(null)
    setTimeout(() => {
      // Randomly pick good or bad result for demo variation
      setResult(Math.random() > 0.4 ? MOCK_RESULTS.good : MOCK_RESULTS.bad)
      setAnalyzing(false)
    }, 2000)
  }

  const statusIcon = (s) => {
    if (s === 'pass') return <CheckCircle2 size={16} className="text-green-500" />
    if (s === 'warning') return <AlertTriangle size={16} className="text-yellow-500" />
    return <XCircle size={16} className="text-red-500" />
  }

  const statusBg = (s) => {
    if (s === 'pass') return 'bg-green-50 border-green-100'
    if (s === 'warning') return 'bg-yellow-50 border-yellow-100'
    return 'bg-red-50 border-red-100'
  }

  return (
    <div className="bg-white danantara-card rounded-[2rem] p-8" role="region" aria-label="Audit kemasan produk">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white" aria-hidden="true">
          <Camera size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-secondary">Audit Kemasan Produk</h3>
          <p className="text-xs text-secondary/50 font-medium">Upload foto kemasan untuk dicek kesesuaian regulasi negara tujuan</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={handleUpload}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-accent/40 hover:bg-slate-soft/50 transition-all group"
        role="button"
        tabIndex={0}
        aria-label="Klik untuk upload foto kemasan"
        onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
      >
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/10 transition-colors">
          <Upload size={28} className="text-secondary/30 group-hover:text-accent transition-colors" />
        </div>
        <p className="font-bold text-secondary/60 mb-1">Klik untuk upload foto kemasan</p>
        <p className="text-xs text-secondary/30">JPG, PNG (maks. 5MB)</p>
      </div>

      {/* File selected */}
      {fileName && (
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-slate-soft rounded-xl">
          <Camera size={16} className="text-accent" />
          <span className="text-sm font-bold text-secondary">{fileName}</span>
          {analyzing && <span className="text-xs font-bold text-secondary/40 animate-pulse ml-auto">Menganalisis...</span>}
        </div>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="mt-6 space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="mt-6 animate-fadeInUp">
          {/* Score */}
          <div className={`p-5 rounded-2xl mb-4 flex items-center justify-between ${result.score >= 70 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-secondary/40 mb-1">Skor Kepatuhan Kemasan</p>
              <p className={`text-3xl font-black ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.score}/100</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-black ${result.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {result.status}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2 mb-4">
            {result.items.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${statusBg(item.status)}`}>
                <span className="mt-0.5">{statusIcon(item.status)}</span>
                <div>
                  <p className="text-sm font-bold text-secondary">{item.label}</p>
                  <p className="text-xs text-secondary/50">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestion */}
          <div className="bg-slate-soft p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Rekomendasi AI</p>
            <p className="text-sm font-medium text-secondary leading-relaxed">{result.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
