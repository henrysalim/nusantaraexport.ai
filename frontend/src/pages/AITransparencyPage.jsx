import { useState, useEffect } from 'react'
import { ExternalLink, Shield, Database, Cpu, AlertTriangle, Eye, BarChart3, CheckCircle, XCircle } from 'lucide-react'
import { API_BASE_URL } from '../config'

const CRITERIA = [
  { icon: '📥', label: 'Input Model' },
  { icon: '🗄️', label: 'Sumber Data' },
  { icon: '⚙️', label: 'Proses Data' },
  { icon: '📤', label: 'Output Model' },
  { icon: '🎯', label: 'Penggunaan Output' },
  { icon: '📊', label: 'Metrik Performa' },
  { icon: '🧪', label: 'Pengujian Model' },
  { icon: '⚠️', label: 'Keterbatasan' },
  { icon: '👁️', label: 'Human Oversight' },
]

const TIER_COLORS = {
  gemini_flash: { bg: '#ecfdf5', text: '#065f46', bar: '#10b981', label: '✨ Gemini Flash' },
  backup_llm:   { bg: '#fffbeb', text: '#92400e', bar: '#f59e0b', label: '🔄 Backup LLM' },
  rule_based:   { bg: '#f9fafb', text: '#374151', bar: '#6b7280', label: '📋 Rule-based' },
}

function MetricCard({ icon, label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '20px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: 28,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function AITransparencyPage() {
  const [systemCard, setSystemCard] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardRes, metricsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ai/transparency/system-card`),
          fetch(`${API_BASE_URL}/api/ai/transparency/metrics`),
        ])
        const card = await cardRes.json()
        const met = await metricsRes.json()
        setSystemCard(card)
        setMetrics(met)
      } catch (e) {
        console.error('Failed to fetch AI transparency data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalInferences = metrics?.total_inferences || 0
  const tierDist = metrics?.tier_distribution || {}
  const feedbackData = metrics?.feedback || {}

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🤖
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: 0 }}>
                AI System Card
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>
                NusantaraExport.AI — Transparansi & Akuntabilitas Sistem AI
              </p>
            </div>
          </div>

          {/* Coverage badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CRITERIA.map((c, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#166534',
              }}>
                <CheckCircle size={11} color="#16a34a" />
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 60, fontSize: 14 }}>
            Memuat data transparansi AI...
          </div>
        )}

        {!loading && (
          <>
            {/* Real-time Metrics */}
            <Section title="Metrik Performa Real-time" icon="📊">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                <MetricCard
                  icon="🔢"
                  label="Total Inferensi"
                  value={totalInferences.toLocaleString('id-ID')}
                  sub="semua modul"
                  color="#6366f1"
                />
                <MetricCard
                  icon="👍"
                  label="Feedback Positif"
                  value={`${feedbackData.helpful_pct || 0}%`}
                  sub={`dari ${feedbackData.total_feedback || 0} feedback`}
                  color="#10b981"
                />
                <MetricCard
                  icon="🚩"
                  label="Dilaporkan Salah"
                  value={`${feedbackData.wrong_pct || 0}%`}
                  sub="human oversight"
                  color="#ef4444"
                />
                <MetricCard
                  icon="✨"
                  label="Gemini Flash"
                  value={`${tierDist.gemini_flash || 0}%`}
                  sub="dari total calls"
                  color="#10b981"
                />
              </div>

              {/* Tier distribution bar */}
              {totalInferences > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Distribusi AI Tier
                  </p>
                  <div style={{ height: 20, borderRadius: 999, overflow: 'hidden', display: 'flex', background: '#f1f5f9' }}>
                    {Object.entries(tierDist).map(([tier, pct]) => {
                      const cfg = TIER_COLORS[tier] || TIER_COLORS.rule_based
                      return pct > 0 ? (
                        <div
                          key={tier}
                          title={`${cfg.label}: ${pct}%`}
                          style={{ width: `${pct}%`, background: cfg.bar, transition: 'width 0.8s ease' }}
                        />
                      ) : null
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    {Object.entries(tierDist).map(([tier, pct]) => {
                      const cfg = TIER_COLORS[tier] || TIER_COLORS.rule_based
                      return (
                        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.bar }} />
                          <span style={{ fontWeight: 700 }}>{cfg.label}</span>
                          <span>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {totalInferences === 0 && (
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Belum ada data inferensi. Gunakan fitur AI di Dashboard untuk mulai merekam metrik.
                </div>
              )}
            </Section>

            {/* Input & Output */}
            <Section title="Input & Output Model" icon="📥">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Input
                  </p>
                  {[
                    { icon: '💬', label: 'Text Prompt', desc: 'Pertanyaan user (Bahasa Indonesia/Inggris)' },
                    { icon: '🗄️', label: 'RAG Context', desc: 'Regulasi dari ChromaDB (auto-injected)' },
                    { icon: '📷', label: 'Image (Vision)', desc: 'Foto kemasan base64 — Packaging Checker' },
                    { icon: '📋', label: 'Structured Params', desc: 'Country, commodity, price, quantity' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Output
                  </p>
                  {(systemCard?.output_types || []).map((out, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{out.module}</div>
                      <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{out.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Processing Pipeline */}
            <Section title="Pipeline Pemrosesan — 3-Tier Fallback" icon="⚙️">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(systemCard?.processing_pipeline?.tiers || []).map((tier, i) => (
                  <div key={i} style={{
                    background: i === 0 ? '#f0fdf4' : i === 1 ? '#fffbeb' : '#f9fafb',
                    border: `1px solid ${i === 0 ? '#bbf7d0' : i === 1 ? '#fde68a' : '#e5e7eb'}`,
                    borderRadius: 12,
                    padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 24, height: 24,
                        background: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#6b7280',
                        color: 'white', borderRadius: 999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900, flexShrink: 0,
                      }}>{tier.tier}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{tier.name}</span>
                      <code style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 6, color: '#475569' }}>
                        {tier.model}
                      </code>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px 34px' }}>{tier.trigger}</p>
                    {tier.anti_hallucination && (
                      <div style={{ marginLeft: 34 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                          🛡️ Anti-Hallucination Guards:
                        </p>
                        {tier.anti_hallucination.map((g, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#374151', display: 'flex', gap: 6 }}>
                            <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                            <span>{g}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Data Sources */}
            <Section title="Sumber Data" icon="🗄️">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {(systemCard?.data_sources || []).map((ds, i) => (
                  <div key={i} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{ds.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{ds.description}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: '#ede9fe', color: '#6d28d9', fontWeight: 700,
                      }}>{ds.type}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: '#fef9c3', color: '#854d0e', fontWeight: 700,
                      }}>{ds.update_frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Limitations */}
            <Section title="Keterbatasan Sistem" icon="⚠️">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(systemCard?.limitations || []).map((lim, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10,
                    padding: '10px 14px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 10,
                  }}>
                    <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>{lim}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Human Oversight */}
            <Section title="Mekanisme Human Oversight" icon="👁️">
              <div style={{ marginBottom: 16 }}>
                {(systemCard?.human_oversight?.mechanism || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{m}</span>
                  </div>
                ))}
              </div>
              {systemCard?.human_oversight?.disclaimer && (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    <strong>⚖️ Disclaimer:</strong> {systemCard.human_oversight.disclaimer}
                  </p>
                </div>
              )}
            </Section>

            {/* Third-party disclosure */}
            {systemCard?.third_party_disclosure && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 16, padding: '16px 20px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🔗</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#1e40af', marginBottom: 4 }}>
                      Penggunaan Model Pihak Ketiga
                    </p>
                    <p style={{ fontSize: 11, color: '#1e40af', margin: 0, lineHeight: 1.6, opacity: 0.8 }}>
                      {systemCard.third_party_disclosure}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* API Links */}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
              <p>Data diambil real-time dari backend NusantaraExport.AI</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                <a href={`${API_BASE_URL}/api/ai/transparency/system-card`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ExternalLink size={11} /> System Card JSON
                </a>
                <a href={`${API_BASE_URL}/api/ai/transparency/metrics`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ExternalLink size={11} /> Metrics JSON
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
