import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Camera, Search, Upload, X } from 'lucide-react'
import { checkPackaging } from '../services/api'

const DESTINATIONS = [
  { value: 'us', label: 'Amerika Serikat' },
  { value: 'jp', label: 'Jepang' },
  { value: 'cn', label: 'Tiongkok' },
  { value: 'eu', label: 'Uni Eropa' },
  { value: 'kr', label: 'Korea Selatan' },
  { value: 'au', label: 'Australia' },
  { value: 'sg', label: 'Singapura' },
]

export default function PackagingChecker() {
  const [productType, setProductType] = useState('')
  const [destination, setDestination] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB')
        return
      }
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleAnalyze = async () => {
    if (!productType || !destination) return
    setAnalyzing(true)
    setResult(null)
    setError('')

    try {
      let imageBase64 = ""
      let imageMimeType = "image/jpeg"
      
      if (imagePreview) {
        // Base64 from FileReader looks like "data:image/jpeg;base64,/9j/4AAQ..."
        const parts = imagePreview.split(',')
        if (parts.length === 2) {
          const meta = parts[0].match(/:(.*?);/)
          if (meta && meta[1]) {
            imageMimeType = meta[1]
          }
          imageBase64 = parts[1]
        }
      }

      const response = await checkPackaging({
        destination_country: destination,
        product_type: productType,
        filename: imageFile ? imageFile.name : '',
        image_base64: imageBase64,
        image_mime_type: imageMimeType,
      })
      setResult(response.data)
    } catch (err) {
      console.error('Packaging check error:', err)
      setError('Gagal terhubung ke server. Pastikan backend berjalan di port 8081.')
    } finally {
      setAnalyzing(false)
    }
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
          <p className="text-xs text-secondary/50 font-medium">Cek kesesuaian kemasan berdasarkan regulasi negara tujuan</p>
        </div>
      </div>
      {/* Image Upload Area */}
      <div className="mb-6">
        <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Foto Kemasan (Opsional)</label>
        {!imagePreview ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-secondary/40 mb-2" />
              <p className="text-sm font-bold text-secondary/60">Klik untuk unggah foto</p>
              <p className="text-xs text-secondary/40">PNG, JPG, JPEG (Max 5MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 group">
            <img src={imagePreview} alt="Preview kemasan" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={removeImage} className="bg-white/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors" title="Hapus gambar">
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Jenis Produk</label>
          <input
            type="text"
            placeholder="Contoh: Kopi Arabika, Keripik Singkong"
            className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Negara Tujuan</label>
          <select
            className="w-full px-4 py-3 bg-slate-soft border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent text-sm"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Pilih negara</option>
            {DESTINATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={handleAnalyze} disabled={analyzing || !productType || !destination} className="btn-primary w-full justify-center py-4 mb-6">
        {analyzing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Menganalisis kepatuhan kemasan...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search size={18} /> Audit Kemasan
          </span>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-4 animate-fadeInUp">
          <p className="text-sm font-bold text-red-600">{error}</p>
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
