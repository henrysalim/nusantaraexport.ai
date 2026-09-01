import { useEffect, useRef } from 'react'

const TIER_CONFIG = {
  gemini_flash: {
    icon: '✦',
    label: 'Gemini Flash',
  },
  backup_llm: {
    icon: '↺',
    label: 'Backup LLM',
  },
  rule_based: {
    icon: '≡',
    label: 'Rule-based',
  },
  error: {
    icon: '!',
    label: 'Error',
  },
}

/**
 * AIConfidenceBadge — badge kepercayaan AI terhadap jawabannya
 *
 * Props:
 *   tier          : "gemini_flash" | "backup_llm" | "rule_based"
 *   confidence    : 0.0 – 1.0
 *   modelUsed     : string nama model
 *   responseTimeMs: int latency ms
 *   compact       : bool — tampilan mini untuk inline
 */
export default function AIConfidenceBadge({
  tier = 'gemini_flash',
  confidence = 0.85,
  modelUsed = '',
  responseTimeMs = 0,
  compact = false,
}) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.rule_based
  const pct = Math.round((confidence || 0) * 100)
  const barRef = useRef(null)

  // Confidence level label
  const confidenceLabel =
    pct >= 80 ? 'Sangat Yakin' :
    pct >= 60 ? 'Cukup Yakin' :
    pct >= 50 ? 'Agak Yakin' :
    'Kurang Yakin'

  // Bar & badge color based on confidence threshold
  const barColor =
    pct >= 80 ? '#16a34a' :   // hijau
    pct >= 60 ? '#ca8a04' :   // kuning
    '#dc2626'                  // merah

  const badgeBg =
    pct >= 80 ? '#16a34a' :
    pct >= 60 ? '#ca8a04' :
    '#dc2626'

  // Animate bar fill on mount
  useEffect(() => {
    if (!barRef.current) return
    barRef.current.style.width = '0%'
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (barRef.current) barRef.current.style.width = `${pct}%`
      }, 80)
    })
    return () => cancelAnimationFrame(raf)
  }, [pct])

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: 700,
          background: pct >= 80 ? '#dcfce7' : pct >= 60 ? '#fef9c3' : '#fee2e2',
          border: `1px solid ${pct >= 80 ? '#86efac' : pct >= 60 ? '#fde047' : '#fca5a5'}`,
          color: barColor,
          cursor: 'default',
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span style={{ fontWeight: 900 }}>{pct}%</span>
      </span>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Section title */}
      <p style={{
        fontSize: 10,
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 6,
        margin: '0 0 6px 0',
      }}>
        Tingkat Keyakinan AI
      </p>

      <div style={{
        background: pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fefce8' : '#fff5f5',
        border: `1px solid ${pct >= 80 ? '#86efac' : pct >= 60 ? '#fde047' : '#fecaca'}`,
        borderRadius: '12px',
        padding: '10px 14px',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 22, height: 22,
              background: barColor,
              color: 'white',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, flexShrink: 0,
            }}>
              {config.icon}
            </span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1f2937' }}>
                {config.label}
              </span>
              {modelUsed && (
                <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 6 }}>
                  {modelUsed}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Confidence label badge */}
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: badgeBg,
              color: 'white',
            }}>
              {confidenceLabel}
            </span>
            {/* Percentage */}
            <span style={{ fontSize: 18, fontWeight: 900, color: barColor, lineHeight: 1 }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 6,
          background: '#e5e7eb',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: responseTimeMs > 0 ? 6 : 0,
        }}>
          <div
            ref={barRef}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
              borderRadius: 999,
              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              width: 0,
            }}
          />
        </div>

        {/* Latency */}
        {responseTimeMs > 0 && (
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
            Waktu respons:{' '}
            {responseTimeMs < 1000
              ? `${responseTimeMs} ms`
              : `${(responseTimeMs / 1000).toFixed(1)} detik`}
          </div>
        )}
      </div>
    </div>
  )
}
