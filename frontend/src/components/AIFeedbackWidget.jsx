import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react'
import { API_BASE_URL } from '../config'

/**
 * AIFeedbackWidget — tombol 👍/👎 per respons AI (human oversight mechanism)
 *
 * Props:
 *   inferenceId: string — UUID dari inference log
 *   compact    : bool   — tampilan mini (untuk inline di chat bubble)
 */
export default function AIFeedbackWidget({ inferenceId = '', compact = false }) {
  const [voted, setVoted] = useState(null)   // null | 1 | -1
  const [showReport, setShowReport] = useState(false)
  const [reportNote, setReportNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitFeedback = async (feedbackVal, note = '') => {
    if (voted !== null || submitting) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('ne_access_token') || ''
      await fetch(`${API_BASE_URL}/api/ai/transparency/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          inference_id: inferenceId,
          feedback: feedbackVal,
          note: note || null,
        }),
      })
      setVoted(feedbackVal)
      if (feedbackVal === -1) setSubmitted(true)
    } catch {
      // Jangan crash UI jika feedback API gagal
      setVoted(feedbackVal)
    } finally {
      setSubmitting(false)
      setShowReport(false)
    }
  }

  const handleReport = () => {
    if (reportNote.trim()) {
      submitFeedback(-1, reportNote)
    }
  }

  if (voted !== null) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: voted === 1 ? '#059669' : '#dc2626',
        fontWeight: 700,
        padding: '2px 0',
      }}>
        {voted === 1
          ? '👍 Terima kasih! Masukan Anda membantu kalibrasi tingkat keyakinan AI.'
          : '🚩 Laporan diterima. Masukan Anda akan digunakan untuk peningkatan akurasi model.'}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: compact ? 4 : 10,
      }}>
        {!compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
              Bantu validasi: Apakah jawaban AI di atas akurat & bermanfaat?
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => submitFeedback(1)}
            disabled={submitting || !inferenceId}
            title="Jawaban akurat dan membantu"
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: compact ? '2px 6px' : '4px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#059669',
              fontSize: 11,
              fontWeight: 700,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
            onMouseLeave={e => e.currentTarget.style.background = '#ecfdf5'}
          >
            <ThumbsUp size={12} />
            {!compact && 'Ya, Akurat'}
          </button>

          <button
            onClick={() => setShowReport(true)}
            disabled={submitting || !inferenceId}
            title="Laporkan jawaban kurang tepat"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: compact ? '2px 6px' : '4px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#dc2626',
              fontSize: 11,
              fontWeight: 700,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
          >
            <ThumbsDown size={12} />
            {!compact && 'Kurang Tepat'}
          </button>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          width: 280,
          background: 'white',
          border: '1px solid #fee2e2',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Flag size={13} color="#ef4444" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#991b1b' }}>
              Laporkan Jawaban Salah / Menyesatkan
            </span>
          </div>
          <textarea
            placeholder="Apa yang salah atau menyesatkan? (opsional)"
            value={reportNote}
            onChange={e => setReportNote(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '6px 8px',
              fontSize: 11,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleReport}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '5px 0',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
            <button
              onClick={() => setShowReport(false)}
              style={{
                padding: '5px 10px',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
