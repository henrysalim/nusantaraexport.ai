/**
 * SkeletonLoader — reusable skeleton loading components
 * Gunakan variant yang sesuai per fitur.
 *
 * Exports:
 *   SkeletonBlock       — satu blok rectangle
 *   SkeletonText        — baris teks (lebar variatif)
 *   SkeletonBadge       — pill/badge kecil
 *   SkeletonCard        — card dengan header + beberapa baris teks
 *   SkeletonResultPanel — panel hasil AI (cocok untuk semua fitur)
 *   SkeletonMarket      — spesifik untuk MarketAnalysisCard
 *   SkeletonHSCode      — spesifik untuk HSCodeOptimizer
 *   SkeletonChat        — spesifik untuk VoiceDemoSection
 */

const pulse = {
  animation: 'skeleton-pulse 1.6s ease-in-out infinite',
  borderRadius: 8,
  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
  backgroundSize: '200% 100%',
}

const KEYFRAMES = `
  @keyframes skeleton-pulse {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

function SkeletonBlock({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ ...pulse, width, height, borderRadius: radius, ...style }} />
    </>
  )
}

function SkeletonText({ lines = 3, lastLineWidth = '60%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{KEYFRAMES}</style>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...pulse,
            height: 13,
            borderRadius: 6,
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  )
}

function SkeletonBadge({ width = 80 }) {
  return <div style={{ ...pulse, width, height: 22, borderRadius: 999 }} />
}

/** Panel hasil AI generik — header icon + label + 3 baris teks + confidence bar */
function SkeletonResultPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{KEYFRAMES}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ ...pulse, width: 36, height: 36, borderRadius: 10 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...pulse, height: 14, borderRadius: 6, width: '45%', marginBottom: 6 }} />
          <div style={{ ...pulse, height: 10, borderRadius: 6, width: '30%' }} />
        </div>
        <div style={{ ...pulse, width: 60, height: 28, borderRadius: 8 }} />
      </div>

      {/* Body lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[100, 85, 92, 70].map((w, i) => (
          <div key={i} style={{ ...pulse, height: 13, borderRadius: 6, width: `${w}%` }} />
        ))}
      </div>

      {/* Confidence bar area */}
      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...pulse, height: 12, borderRadius: 6, width: '40%' }} />
          <div style={{ ...pulse, height: 22, borderRadius: 6, width: 48 }} />
        </div>
        <div style={{ ...pulse, height: 6, borderRadius: 999 }} />
      </div>
    </div>
  )
}

/** Skeleton spesifik MarketAnalysisCard */
function SkeletonMarket() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
      <style>{KEYFRAMES}</style>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ ...pulse, height: 60, borderRadius: 12 }} />
        ))}
      </div>

      {/* Destination label */}
      <div style={{ ...pulse, height: 12, borderRadius: 6, width: '40%' }} />

      {/* Destination rows */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...pulse, height: 13, borderRadius: 6, width: '45%' }} />
          <div style={{ ...pulse, height: 8, borderRadius: 999, width: 80 }} />
        </div>
      ))}

      {/* Gap score box */}
      <div style={{ ...pulse, height: 72, borderRadius: 12 }} />

      {/* AI summary box */}
      <div style={{ ...pulse, height: 100, borderRadius: 12 }} />

      {/* Confidence badge */}
      <div style={{ ...pulse, height: 72, borderRadius: 12 }} />
    </div>
  )
}

/** Skeleton spesifik HSCodeOptimizer */
function SkeletonHSCode() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{KEYFRAMES}</style>

      {/* HS Code header chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ ...pulse, width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...pulse, height: 20, borderRadius: 6, width: '35%', marginBottom: 6 }} />
          <div style={{ ...pulse, height: 12, borderRadius: 6, width: '65%' }} />
        </div>
      </div>

      {/* FTA rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ ...pulse, height: 12, borderRadius: 6, width: 120 }} />
              <div style={{ ...pulse, height: 10, borderRadius: 6, width: 80 }} />
            </div>
            <div style={{ ...pulse, height: 22, borderRadius: 6, width: 56 }} />
          </div>
        ))}
      </div>

      {/* Best FTA banner */}
      <div style={{ ...pulse, height: 72, borderRadius: 16 }} />

      {/* Confidence badge */}
      <div style={{ ...pulse, height: 72, borderRadius: 12 }} />
    </div>
  )
}

/** Skeleton spesifik Chat/VoiceDemoSection */
function SkeletonChat() {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 24,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <style>{KEYFRAMES}</style>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...pulse, width: 120, height: 12, borderRadius: 6 }} />
          <div style={{ ...pulse, width: 60, height: 18, borderRadius: 999 }} />
        </div>
        <div style={{ ...pulse, width: 90, height: 30, borderRadius: 8 }} />
      </div>

      {/* Thinking panel placeholder */}
      <div style={{ ...pulse, height: 36, borderRadius: 10 }} />

      {/* Answer body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[100, 95, 88, 78, 60].map((w, i) => (
          <div key={i} style={{ ...pulse, height: 14, borderRadius: 6, width: `${w}%` }} />
        ))}
      </div>

      {/* Sources */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[80, 110, 90].map((w, i) => (
          <div key={i} style={{ ...pulse, height: 26, borderRadius: 999, width: w }} />
        ))}
      </div>

      {/* Confidence badge */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
        <div style={{ ...pulse, height: 72, borderRadius: 12 }} />
      </div>
    </div>
  )
}

export {
  SkeletonBlock,
  SkeletonText,
  SkeletonBadge,
  SkeletonResultPanel,
  SkeletonMarket,
  SkeletonHSCode,
  SkeletonChat,
}
