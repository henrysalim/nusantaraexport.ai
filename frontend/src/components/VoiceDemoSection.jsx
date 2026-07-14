import { useState, useEffect, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'
import { sendChatMessage } from '../services/api'

const EXAMPLES = [
  'Apa saja syarat ekspor kopi ke Jepang?',
  'Produk saya keripik singkong, negara mana yang cocok?',
  'Berapa biaya ekspor kerajinan kayu ke Eropa?',
  'Simulasikan dry run ekspor saya',
  'Bantu nego harga dengan buyer',
  'Kapan waktu terbaik ekspor kopi?',
]

const STATUS = {
  idle:       { label: 'Tekan tombol untuk bicara', color: 'bg-accent' },
  listening:  { label: 'Mendengarkan...', color: 'bg-red-600 animate-pulse' },
  processing: { label: 'Sedang mencari jawaban...', color: 'bg-secondary' },
  speaking:   { label: 'Jawaban ditemukan', color: 'bg-accent' },
  error:      { label: 'Gagal mendapat jawaban', color: 'bg-red-500' },
}

export default function VoiceDemoSection() {
  const [status, setStatus] = useState('idle')
  const [inputText, setInputText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [isReadingAnswer, setIsReadingAnswer] = useState(false)
  const [detectedIntent, setDetectedIntent] = useState('')
  const [micError, setMicError] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'id-ID'

      recognitionRef.current.onstart = () => {
        setMicError('')
        setStatus('listening')
      }
      recognitionRef.current.onend = () => {}
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        handleQuery(transcript)
      }
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setMicError('Izin mikrofon ditolak/diblokir. Harap izinkan mikrofon di pengaturan browser Anda (klik ikon gembok di sebelah URL).')
        } else if (event.error === 'no-speech') {
          setMicError('Suara tidak terdeteksi. Silakan bicara lebih dekat ke mikrofon dan coba lagi.')
        } else if (event.error === 'network') {
          setMicError('Server pengenalan suara browser (Google/Apple Speech Service) gagal terhubung. Ini sering terjadi karena pemblokiran DNS oleh provider internet tertentu (seperti IndiHome/Telkomsel) atau jika Anda menggunakan VPN. Silakan ketik langsung di kolom teks di bawah atau segarkan browser.')
        } else {
          setMicError(`Perekaman gagal (${event.error}). Silakan coba lagi.`)
        }
        setStatus('idle')
      }
    } else {
      setMicError('Browser Anda tidak mendukung input suara bawaan. Silakan gunakan Google Chrome, Safari, atau Microsoft Edge.')
    }
  }, [])

  const handleQuery = async (query) => {
    setStatus('processing')
    setQueryResult(null)

    try {
      // Try real API first
      const response = await sendChatMessage(query, {
        current_page: 'assistant',
        user_commodity: 'umum'
      })

      const data = response.data
      setQueryResult({
        answer: data.reply,
        context_used: data.referenced_sources
          ? data.referenced_sources.split('\n').filter(s => s.trim()).map(s => {
              const match = s.match(/\[(.+?)\]/)
              return match ? match[1] : s.substring(0, 60)
            })
          : ['RAG Pipeline']
      })
      setDetectedIntent(data.detected_intent || '')
      setStatus('speaking')
    } catch (error) {
      console.error('Chatbot API error:', error)
      setQueryResult({
        answer: 'Maaf, server AI sedang tidak dapat dihubungi. Pastikan backend berjalan di port 8081 dan coba lagi.',
        context_used: []
      })
      setDetectedIntent('error')
      setStatus('error')
    }
  }

  const handleMic = () => {
    if (!recognitionRef.current) {
      setMicError('Browser Anda tidak mendukung input suara. Mengalihkan ke pertanyaan contoh secara otomatis...')
      setInputText('Apa saja syarat ekspor kopi ke Jepang?')
      handleQuery('Apa saja syarat ekspor kopi ke Jepang?')
      return
    }
    setMicError('')
    if (status === 'idle' || status === 'speaking') {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error("Gagal memulai SpeechRecognition:", err)
        setMicError("Gagal memulai perekaman suara. Silakan segarkan halaman.")
      }
    } else {
      recognitionRef.current.stop()
      setStatus('idle')
    }
  }

  const handleTextSubmit = () => {
    if (!inputText.trim()) return
    handleQuery(inputText)
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
          {micError && (
            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl animate-fadeIn text-center">
              ⚠️ {micError}
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label htmlFor="voice-input" className="sr-only">Ketik pertanyaan ekspor Anda</label>
          <input
            id="voice-input"
            className="flex-1 px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors min-w-0"
            type="text"
            placeholder="Atau ketik pertanyaan Anda di sini..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          />
          <button onClick={handleTextSubmit} className="btn-primary px-8 py-4 justify-center whitespace-nowrap" aria-label="Kirim pertanyaan">
            Kirim
          </button>
        </div>

        {/* Example Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8" role="group" aria-label="Contoh pertanyaan">
          {EXAMPLES.map((ex, i) => (
            <button key={i}
              className="px-3 py-1.5 bg-accent-light border border-accent/10 rounded-full text-xs text-accent font-bold hover:bg-accent hover:text-white transition-all"
              onClick={() => { setInputText(ex); handleQuery(ex) }}
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
              <div className="flex items-center gap-2">
                <h4 className="text-secondary font-black text-xs uppercase tracking-[0.2em]">Jawaban NusantaraExport.AI</h4>
                {detectedIntent && detectedIntent !== 'fallback' && (
                  <span className="px-2 py-0.5 bg-accent-light text-accent text-[9px] font-black rounded-lg uppercase">
                    {detectedIntent.replace('_', ' ')}
                  </span>
                )}
              </div>
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
                  {(Array.isArray(queryResult.context_used) ? queryResult.context_used : [queryResult.context_used]).map((s, i) => (
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
