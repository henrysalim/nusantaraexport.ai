import { ExternalLink, Database } from 'lucide-react'

const SOURCE_ICONS = {
  'insw': '🏛️',
  'bea cukai': '🛃',
  'kemendag': '🤝',
  'bpom': '🧪',
  'karantina': '🌱',
  'gemini': '✨',
  'chromadb': '🗄️',
  'rag': '🗄️',
  'packaging_regulations': '📦',
  'hs_code': '🏷️',
  'rule-based': '📋',
  'huggingface': '🔄',
}

const getSourceIcon = (src) => {
  const s = src.toLowerCase()
  for (const [key, icon] of Object.entries(SOURCE_ICONS)) {
    if (s.includes(key)) return icon
  }
  return '📂'
}

/**
 * AISourcesPanel — tampilkan sumber data yang digunakan AI untuk menjawab
 *
 * Props:
 *   sources: string[] — daftar sumber data dari ai_metadata.data_sources
 */
export default function AISourcesPanel({ sources = [] }) {
  if (!sources || sources.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      padding: '6px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Database size={11} color="#94a3b8" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Sumber:
        </span>
      </div>
      {sources.map((src, i) => (
        <span
          key={i}
          title={src}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            color: '#475569',
          }}
        >
          <span>{getSourceIcon(src)}</span>
          <span>{src}</span>
        </span>
      ))}
    </div>
  )
}
