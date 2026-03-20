import { useState, useEffect, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'

const EXAMPLES = [
  'Apa saja syarat ekspor kopi ke Jepang?',
  'Produk saya keripik singkong, negara mana yang cocok?',
  'Berapa biaya ekspor kerajinan kayu ke Eropa?',
]

// Mock AI responses based on keywords
const MOCK_RESPONSES = {
  kopi: {
    answer: 'Untuk mengekspor kopi ke Jepang, Anda memerlukan beberapa dokumen dan sertifikasi berikut:\n\n1. Surat Keterangan Asal (SKA) Form IJEPA — untuk mendapatkan tarif preferensial 0% melalui perjanjian dagang Indonesia-Jepang.\n2. Phytosanitary Certificate dari Karantina Pertanian — wajib untuk semua produk pertanian.\n3. ICO Certificate of Origin — sertifikat khusus kopi dari International Coffee Organization.\n4. Japan Food Sanitation Act compliance — label harus mencantumkan komposisi dalam bahasa Jepang.\n5. Commercial Invoice dan Packing List dengan format standar internasional.\n\nEstimasi biaya ekspor kopi arabika (1 kontainer 20ft) ke Yokohama:\n- Freight: $1,800 - $2,200\n- Asuransi: $150 - $300\n- Bea masuk (dengan IJEPA): 0%\n- Handling & Clearance: $400 - $600\n\nTotal estimasi: $2,350 - $3,100 per kontainer.',
    context_used: ['Permendag No. 19/2024 tentang Ketentuan Ekspor Kopi', 'IJEPA Rules of Origin', 'Japan Food Sanitation Act', 'ICO Resolution 420']
  },
  singkong: {
    answer: 'Berdasarkan analisis data perdagangan internasional, berikut negara tujuan terbaik untuk keripik singkong dari Indonesia:\n\n1. 🇨🇳 Tiongkok — Impor keripik singkong senilai $89M/tahun, Indonesia baru menyuplai 12%. Peluang besar!\n2. 🇯🇵 Jepang — Pasar premium, harga jual 3x lipat domestik. Butuh sertifikasi JAS.\n3. 🇰🇷 Korea Selatan — Tren makanan Asia Tenggara sedang naik, permintaan tumbuh 23% per tahun.\n4. 🇦🇪 Uni Emirat Arab — Pasar halal, keripik singkong masuk kategori camilan populer.\n\nRekomendasi: Mulai dari Tiongkok karena permintaan tinggi dan tarif ACFTA 0% untuk HS Code 2005.99. Siapkan label kemasan dalam bahasa Mandarin dan pastikan sertifikat halal MUI tersedia.',
    context_used: ['UN COMTRADE Database 2024', 'ACFTA Tariff Schedule', 'Survei Pasar Camilan Asia - ITC 2024']
  },
  kayu: {
    answer: 'Estimasi biaya ekspor kerajinan kayu ke Eropa (1 kontainer 20ft ke Rotterdam):\n\n📦 Rincian Biaya:\n- Harga produksi (500 unit): Rp 75.000.000\n- Freight (FCL 20ft ke Rotterdam): $2,400 (~Rp 38.400.000)\n- Asuransi kargo: $280 (~Rp 4.480.000)\n- Fumigation certificate: Rp 2.500.000 (wajib untuk produk kayu)\n- Bea masuk UE (HS 4420): 0% melalui GSP+ Indonesia\n- Handling & customs clearance: $350 (~Rp 5.600.000)\n- Sertifikat V-Legal/SVLK: Rp 3.000.000 (wajib untuk kayu)\n\n💰 Total estimasi: Rp 128.980.000\n📊 Harga jual rata-rata di Eropa: €25-45/unit\n📈 Estimasi margin: 35-55% setelah semua biaya\n⏱️ Timeline pengiriman: 28-35 hari\n\nDokumen wajib untuk kayu ke UE: V-Legal/SVLK, Fumigation Certificate (ISPM-15), EU Timber Regulation compliance.',
    context_used: ['EU Timber Regulation (EUTR)', 'SVLK - Sistem Verifikasi Legalitas Kayu', 'GSP+ Indonesia-EU Tariff Schedule', 'ISPM-15 Standard']
  },
  default: {
    answer: 'Terima kasih atas pertanyaan Anda. Berikut informasi umum mengenai ekspor UMKM:\n\nDokumen dasar yang diperlukan untuk ekspor:\n1. NIB (Nomor Induk Berusaha) yang sudah terverifikasi\n2. Surat Keterangan Asal (SKA) — untuk mendapat tarif preferensial FTA\n3. Commercial Invoice — nota tagihan resmi ke pembeli luar negeri\n4. Packing List — daftar isi pengiriman secara detail\n5. Bill of Lading / Airway Bill — bukti pengiriman dari perusahaan logistik\n\nBiaya rata-rata ekspor pertama kali untuk UMKM:\n- Pengurusan dokumen: Rp 2-5 juta\n- Freight (tergantung tujuan): $800 - $3,000\n- Asuransi: 0.3-0.5% dari nilai barang\n\nTips: Gunakan fitur Simulasi Kesiapan Ekspor kami untuk menghitung biaya lengkap dan mengecek kelengkapan dokumen Anda sebelum mengirim barang.',
    context_used: ['Permendag tentang Ketentuan Ekspor', 'Panduan UMKM Go Export - Bank Indonesia', 'Prosedur Kepabeanan Ekspor - DJBC']
  }
}

function getMockResponse(query) {
  const q = query.toLowerCase()
  if (q.includes('kopi') || q.includes('jepang') || q.includes('syarat')) return MOCK_RESPONSES.kopi
  if (q.includes('singkong') || q.includes('keripik') || q.includes('negara')) return MOCK_RESPONSES.singkong
  if (q.includes('kayu') || q.includes('eropa') || q.includes('biaya')) return MOCK_RESPONSES.kayu
  return MOCK_RESPONSES.default
}

const STATUS = {
  idle:       { label: 'Tekan tombol untuk bicara', color: 'bg-accent' },
  listening:  { label: 'Mendengarkan...', color: 'bg-red-600 animate-pulse' },
  processing: { label: 'Sedang mencari jawaban...', color: 'bg-secondary' },
  speaking:   { label: 'Jawaban ditemukan', color: 'bg-accent' },
}

export default function VoiceDemoSection() {
  const [status, setStatus] = useState('idle')
  const [inputText, setInputText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [isReadingAnswer, setIsReadingAnswer] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'id-ID'

      recognitionRef.current.onstart = () => setStatus('listening')
      recognitionRef.current.onend = () => {}
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        simulateQuery(transcript)
      }
      recognitionRef.current.onerror = () => setStatus('idle')
    }
  }, [])

  const simulateQuery = (query) => {
    setStatus('processing')
    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getMockResponse(query)
      setQueryResult(response)
      setStatus('speaking')
    }, 1500)
  }

  const handleMic = () => {
    if (!recognitionRef.current) {
      // Fallback: if no speech recognition, simulate with a default query
      setInputText('Apa saja syarat ekspor kopi ke Jepang?')
      simulateQuery('Apa saja syarat ekspor kopi ke Jepang?')
      return
    }
    if (status === 'idle' || status === 'speaking') {
      recognitionRef.current.start()
    } else {
      recognitionRef.current.stop()
      setStatus('idle')
    }
  }

  const handleTextSubmit = () => {
    if (!inputText.trim()) return
    simulateQuery(inputText)
  }

  const toggleReadAnswer = () => {
    if (isReadingAnswer) {
      window.speechSynthesis.cancel()
      setIsReadingAnswer(false)
      return
    }
    if (!queryResult?.answer) return
    const utterance = new SpeechSynthesisUtterance(queryResult.answer)
    utterance.lang = 'id-ID'
    utterance.rate = 0.95
    utterance.onend = () => setIsReadingAnswer(false)
    utterance.onerror = () => setIsReadingAnswer(false)
    window.speechSynthesis.speak(utterance)
    setIsReadingAnswer(true)
  }

  return (
    <div className="bg-white danantara-card rounded-[2.5rem] p-10 md:p-12" role="region" aria-label="Konsultasi ekspor lewat suara atau teks">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-display font-black text-secondary mb-4">Konsultasi Ekspor</h2>
        <p className="text-secondary/50 font-medium mb-10">
          Tanya apa saja seputar regulasi, biaya, dan peluang ekspor. Bisa lewat suara atau ketik.
        </p>

        {/* Big Mic Button */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <button
            onClick={handleMic}
            className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${STATUS[status].color}`}
            aria-label={status === 'idle' || status === 'speaking' ? 'Tekan untuk mulai berbicara' : 'Tekan untuk berhenti'}
          >
            {status === 'listening' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect width="14" height="14" x="5" y="5" rx="2" /></svg>
            ) : status === 'processing' ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="6" height="10" x="9" y="2" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" x2="12" y1="17" y2="22" /></svg>
            )}
          </button>
          <div className="px-6 py-2 bg-slate-soft rounded-full border border-slate-200" role="status" aria-live="polite">
            <span className="text-sm font-black text-secondary uppercase tracking-widest">{STATUS[status].label}</span>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex gap-2 mb-4">
          <label htmlFor="voice-input" className="sr-only">Ketik pertanyaan ekspor Anda</label>
          <input
            id="voice-input"
            className="flex-1 px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            type="text"
            placeholder="Atau ketik pertanyaan Anda di sini..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          />
          <button onClick={handleTextSubmit} className="btn-primary px-6" aria-label="Kirim pertanyaan">
            Kirim
          </button>
        </div>

        {/* Example Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8" role="group" aria-label="Contoh pertanyaan">
          {EXAMPLES.map((ex, i) => (
            <button key={i}
              className="px-3 py-1.5 bg-accent-light border border-accent/10 rounded-full text-xs text-accent font-bold hover:bg-accent hover:text-white transition-all"
              onClick={() => { setInputText(ex); simulateQuery(ex) }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Transcript */}
        {inputText && status !== 'idle' && (
          <div className="mb-8 p-6 bg-slate-soft rounded-2xl border border-dashed border-slate-300 text-left">
            <p className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2">Pertanyaan Anda:</p>
            <p className="text-lg font-bold text-secondary italic">&ldquo;{inputText}&rdquo;</p>
          </div>
        )}

        {/* Results */}
        {status === 'speaking' && queryResult && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-left animate-fadeInUp shadow-lg" role="region" aria-label="Jawaban AI" aria-live="polite">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-secondary font-black text-xs uppercase tracking-[0.2em]">Jawaban NusantaraExport.AI</h4>
              <button
                onClick={toggleReadAnswer}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isReadingAnswer
                    ? 'bg-accent text-white animate-pulse'
                    : 'bg-white border border-accent/20 text-accent hover:bg-accent hover:text-white'
                }`}
                aria-label={isReadingAnswer ? 'Hentikan pembacaan' : 'Dengarkan jawaban ini'}
                aria-pressed={isReadingAnswer}
              >
                {isReadingAnswer ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
                {isReadingAnswer ? 'Hentikan' : 'Dengarkan'}
              </button>
            </div>
            <div className="text-secondary leading-relaxed font-medium text-[15px] mb-6 whitespace-pre-line">
              {queryResult.answer}
            </div>
            {queryResult.context_used && (
              <div className="pt-6 border-t border-accent/10">
                <p className="text-[10px] font-black text-accent/60 uppercase tracking-widest mb-3">Sumber Referensi:</p>
                <div className="flex flex-wrap gap-2">
                  {queryResult.context_used.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-accent/10 rounded-lg text-[10px] font-bold text-accent">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
