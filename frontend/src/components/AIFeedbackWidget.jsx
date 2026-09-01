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
        gap: 4,
        fontSize: 10,
        color: voted === 1 ? '#059669' : '#dc2626',
        fontWeight: 700,
        opacity: 0.7,
      }}>
        {voted === 1 ? '👍 Terima kasih!' : '🚩 Laporan diterima'}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 4 : 6,
      }}>
        {!compact && (
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
            Apakah jawaban ini membantu?
          </span>
        )}

        <button
          onClick={() => submitFeedback(1)}
          disabled={submitting || !inferenceId}
          title="Jawaban membantu"
          style={{
            background: 'none',
            border: '1px solid #d1fae5',
            borderRadius: 8,
            padding: compact ? '2px 6px' : '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: '#10b981',
            fontSize: 10,
            fontWeight: 700,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ThumbsUp size={11} />
          {!compact && 'Ya'}
        </button>

        <button
          onClick={() => setShowReport(true)}
          disabled={submitting || !inferenceId}
          title="Laporkan jawaban salah"
          style={{
            background: 'none',
            border: '1px solid #fee2e2',
            borderRadius: 8,
            padding: compact ? '2px 6px' : '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: '#ef4444',
            fontSize: 10,
            fontWeight: 700,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ThumbsDown size={11} />
          {!compact && 'Laporkan'}
        </button>
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
