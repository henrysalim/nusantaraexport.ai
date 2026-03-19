import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const EXAMPLES = [
  'Berapa harga kayu manis Ceylon di pasar Eropa?',
  'Produk UMKM saya keripik singkong, kira-kira negara mana yang cocok?',
  'Cek peluang ekspor kopi arabika ke Jepang',
]

const STATUS = {
  idle:       { label: 'Tekan tombol untuk bicara', icon: '🎙️', color: 'bg-accent' },
  listening:  { label: 'Mendengarkan...', icon: '🔴', color: 'bg-red-600 animate-pulse' },
  processing: { label: 'Sedang Berpikir...', icon: '⚙️', color: 'bg-secondary' },
  speaking:   { label: 'Rekomendasi Ditemukan', icon: '✅', color: 'bg-accent' },
}

export default function VoiceDemoSection() {
  const [status, setStatus] = useState('idle')
  const [inputText, setInputText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'id-ID'

      recognitionRef.current.onstart = () => setStatus('listening')
      recognitionRef.current.onend = () => {
        if (status === 'listening') setStatus('processing')
      }
      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        setStatus('processing')
        try {
          const res = await axios.post(`${API_BASE_URL}/api/rag/query`, {
            user_id: 'guest_user',
            query: transcript
          })
          setQueryResult(res.data)
          setStatus('speaking')
        } catch (err) {
          console.error('RAG Error:', err)
          setStatus('idle')
        }
      }
      recognitionRef.current.onerror = () => setStatus('idle')
    }
  }, [])

  const handleMic = () => {
    if (!recognitionRef.current) {
      alert('Browser Anda tidak mendukung fitur ini. Gunakan Chrome atau Edge.')
      return
    }
    if (status === 'idle') {
      recognitionRef.current.start()
    } else {
      recognitionRef.current.stop()
      setStatus('idle')
    }
  }

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return
    setStatus('processing')
    try {
      const res = await axios.post(`${API_BASE_URL}/api/rag/query`, {
        user_id: 'guest_user',
        query: inputText
      })
      setQueryResult(res.data)
      setStatus('speaking')
    } catch (err) {
      console.error('RAG Error:', err)
      setStatus('idle')
    }
  }

  return (
    <div className="bg-white danantara-card rounded-[2.5rem] p-10 md:p-12">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-display font-black text-secondary mb-4">Konsultasi Lewat Suara</h2>
        <p className="text-secondary/50 font-medium mb-10">Tanya apa saja seputar ekspor, sistem kami akan langsung menjawabnya.</p>

        {/* Big Mic Button */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <button
            onClick={handleMic}
            className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${STATUS[status].color}`}
          >
            {STATUS[status].icon}
          </button>
          <div className="px-6 py-2 bg-slate-soft rounded-full border border-slate-200">
            <span className="text-sm font-black text-secondary uppercase tracking-widest">{STATUS[status].label}</span>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent transition-colors"
            type="text"
            placeholder="Atau ketik pertanyaan Anda di sini..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          />
          <button onClick={handleTextSubmit} className="btn-primary px-6">
            Kirim
          </button>
        </div>

        {/* Example Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {EXAMPLES.map((ex, i) => (
            <button key={i}
              className="px-3 py-1.5 bg-accent-light border border-accent/10 rounded-full text-xs text-accent font-bold hover:bg-accent hover:text-white transition-all"
              onClick={() => setInputText(ex)}>
              {ex}
            </button>
          ))}
        </div>

        {/* Transcript */}
        {inputText && status !== 'idle' && (
          <div className="mb-8 p-6 bg-slate-soft rounded-2xl border border-dashed border-slate-300 text-left">
            <p className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2">Suara Anda:</p>
            <p className="text-lg font-bold text-secondary italic">"{inputText}"</p>
          </div>
        )}

        {/* Results */}
        {status === 'speaking' && queryResult && (
          <div className="bg-accent-light border border-accent/20 rounded-3xl p-8 text-left animate-fadeInUp">
            <h4 className="text-accent font-black text-xs uppercase tracking-[0.2em] mb-4">Jawaban Pintar NusantaraExport</h4>
            <div className="text-secondary leading-relaxed font-bold text-lg mb-6">
              {queryResult.answer}
            </div>
            {queryResult.context_used && (
              <div className="pt-6 border-t border-accent/10">
                <p className="text-[10px] font-black text-accent/60 uppercase tracking-widest mb-3">Dokumen Referensi:</p>
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
