import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const STEP_ICONS = ['①', '②', '③', '④', '⑤']

/**
 * AIThinkingPanel — collapsible panel proses berpikir AI
 * Tema: merah-putih-hitam sesuai NusantaraExport.AI
 *
 * Props:
 *   steps    : string[] — langkah reasoning dari <thinking> block
 *   isLoading: bool     — tampilkan animasi thinking saat loading
 */
export default function AIThinkingPanel({ steps = [], isLoading = false }) {
  const [open, setOpen] = useState(false)

  if (!isLoading && (!steps || steps.length === 0)) return null

  return (
    <div>
      {/* Section title */}
      <p style={{
        fontSize: 10,
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '0 0 6px 0',
      }}>
        Proses Berpikir AI
      </p>

      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #fecaca',
        background: '#fff5f5',
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          aria-expanded={open}
        >
          {/* Red dot indicator */}
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#dc2626',
            flexShrink: 0,
            animation: isLoading ? 'thinking-pulse 1s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: 11, fontWeight: 800,
            color: '#991b1b',
            letterSpacing: '0.02em',
            flex: 1,
          }}>
            {isLoading
              ? 'Sedang berpikir...'
              : `${steps.length} langkah reasoning ditemukan`}
          </span>
          {!isLoading && (
            <ChevronRight
              size={13}
              color="#dc2626"
              style={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }}
            />
          )}
        </button>

        {/* Loading state */}
        {isLoading && (
          <div style={{ padding: '2px 12px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#dc2626',
                  display: 'inline-block',
                  animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes thinking-dot {
                0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1); }
              }
              @keyframes thinking-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>
        )}

        {/* Expanded steps */}
        {open && !isLoading && steps.length > 0 && (
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{
              background: 'white',
              borderRadius: 8,
              border: '1px solid #fecaca',
              overflow: 'hidden',
            }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderBottom: i < steps.length - 1 ? '1px solid #fef2f2' : 'none',
                    animation: `step-in 0.25s ease ${i * 0.07}s both`,
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 900,
                    color: '#dc2626',
                    flexShrink: 0, marginTop: 1,
                    minWidth: 16,
                  }}>
                    {STEP_ICONS[i] || `${i + 1}.`}
                  </span>
                  <span style={{
                    fontSize: 12, color: '#1f2937',
                    fontWeight: 500, lineHeight: 1.5,
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes step-in {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
