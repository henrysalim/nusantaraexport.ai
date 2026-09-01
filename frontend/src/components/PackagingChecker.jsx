import { useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Camera, Search, Upload, X, Images } from 'lucide-react'
import { checkPackaging } from '../services/api'
import AIConfidenceBadge from './AIConfidenceBadge'

const DESTINATIONS = [
  { value: 'us', label: 'Amerika Serikat 🇺🇸' },
  { value: 'jp', label: 'Jepang 🇯🇵' },
  { value: 'cn', label: 'Tiongkok 🇨🇳' },
  { value: 'eu', label: 'Uni Eropa 🇪🇺' },
  { value: 'kr', label: 'Korea Selatan 🇰🇷' },
  { value: 'au', label: 'Australia 🇦🇺' },
  { value: 'sg', label: 'Singapura 🇸🇬' },
  { value: 'ae', label: 'Uni Emirat Arab 🇦🇪' },
]

const MAX_IMAGES = 6
const MAX_SIZE_MB = 5

export default function PackagingChecker() {
  const [productType, setProductType] = useState('')
  const [destination, setDestination] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState([])   // [{file, preview, base64, mimeType}]
  const [aiMetadata, setAiMetadata] = useState(null)

  const addImages = useCallback((files) => {
    const incoming = Array.from(files)
    const remaining = MAX_IMAGES - imageFiles.length
    if (remaining <= 0) {
      setError(`Maksimal ${MAX_IMAGES} foto.`)
      return
    }

    const toAdd = incoming.slice(0, remaining)
    setError('')

    toAdd.forEach(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File "${file.name}" melebihi batas ${MAX_SIZE_MB}MB.`)
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result
        const parts = dataUrl.split(',')
        const meta = parts[0].match(/:(.*?);/)
        const mimeType = meta ? meta[1] : 'image/jpeg'
        const base64 = parts[1] || ''

        setImageFiles(prev => [
          ...prev,
          { file, preview: dataUrl, base64, mimeType }
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [imageFiles.length])

  const handleDrop = (e) => {
    e.preventDefault()
    addImages(e.dataTransfer.files)
  }

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAnalyze = async () => {
    if (!productType || !destination) return
    setAnalyzing(true)
    setResult(null)
    setError('')
    setAiMetadata(null)

    try {
      const images = imageFiles.map(img => ({
        base64: img.base64,
        mime_type: img.mimeType,
      }))

      const response = await checkPackaging({
        destination_country: destination,
        product_type: productType,
        images,
      })
      setResult(response.data)
      setAiMetadata(response.data.ai_metadata || null)
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

  const canAddMore = imageFiles.length < MAX_IMAGES

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

      {/* Multi-Image Upload Area */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
            Foto Kemasan (Opsional — maks. {MAX_IMAGES} foto)
          </label>
          {imageFiles.length > 0 && (
            <span className="text-[10px] font-bold text-secondary/40">
              {imageFiles.length}/{MAX_IMAGES} foto
            </span>
          )}
        </div>

        {/* Image grid */}
        {imageFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {imageFiles.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                <img src={img.preview} alt={`Kemasan ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removeImage(idx)}
                    className="bg-white/20 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors"
                    title="Hapus foto"
                  >
                    <X size={16} />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {idx === 0 ? 'Depan' : idx === 1 ? 'Belakang' : idx === 2 ? 'Samping' : idx === 3 ? 'Label' : `#${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone — only shown when below max */}
        {canAddMore && (
          <label
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <div className="flex flex-col items-center justify-center py-3">
              {imageFiles.length === 0 ? (
                <>
                  <Upload className="w-7 h-7 text-secondary/40 mb-2" />
                  <p className="text-sm font-bold text-secondary/60">Klik atau seret foto kemasan di sini</p>
                  <p className="text-xs text-secondary/40 mt-0.5">Depan, belakang, samping, label — PNG/JPG maks {MAX_SIZE_MB}MB/foto</p>
                </>
              ) : (
                <>
                  <Images className="w-6 h-6 text-accent mb-1" />
                  <p className="text-sm font-bold text-accent">+ Tambah foto ({imageFiles.length}/{MAX_IMAGES})</p>
                  <p className="text-xs text-secondary/40 mt-0.5">Lebih banyak sudut = analisis lebih akurat</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              multiple
              onChange={e => addImages(e.target.files)}
            />
          </label>
        )}

        {imageFiles.length > 0 && (
          <p className="text-[10px] text-secondary/40 mt-2 text-center font-medium">
            💡 Gemini Vision akan menganalisis semua {imageFiles.length} foto sekaligus untuk hasil lebih akurat
          </p>
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
            {imageFiles.length > 0 ? `Menganalisis ${imageFiles.length} foto kemasan...` : 'Menganalisis kepatuhan kemasan...'}
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
              <p className="text-xs font-black uppercase tracking-widest text-secondary/40 mb-1">
                Skor Kepatuhan — {result.country_name || destination.toUpperCase()}
              </p>
              <p className={`text-3xl font-black ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.score}/100</p>
              {result.has_image_analysis && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                  <Camera size={10} /> Gemini Vision — {imageFiles.length} foto dianalisis
                </span>
              )}
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

          {/* AI Confidence Badge */}
          {aiMetadata && (
            <div className="pt-2">
              <AIConfidenceBadge
                tier={aiMetadata.ai_tier}
                confidence={aiMetadata.confidence}
                modelUsed={aiMetadata.model_used}
                responseTimeMs={aiMetadata.response_time_ms}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
