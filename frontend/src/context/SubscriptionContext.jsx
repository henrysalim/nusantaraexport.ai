/**
 * SubscriptionContext — NusantaraExport.AI
 * Mengelola tier langganan aktif & kuota token chatbot harian.
 *
 * Tier: 'free' | 'starter' | 'pro' | 'premium'
 * Token: diestimasi dengan rumus industri 1 token ≈ 4 karakter (OpenAI standard)
 *
 * PENTING — Storage keys bersifat USER-SPECIFIC:
 *   ne_subscription_{userId}, ne_token_usage_{userId}, ne_packaging_usage_{userId}
 * Sehingga data satu user tidak "bocor" ke user lain di browser yang sama.
 * Jika user belum login (guest), key menggunakan suffix "guest".
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

// ── Konstanta Tier ─────────────────────────────────────────────────────────────
export const TIERS = {
  free:    { label: 'Free',    price: 0,      color: '#64748b', badge: 'bg-slate-500' },
  starter: { label: 'Starter', price: 49000,  color: '#3b82f6', badge: 'bg-blue-500' },
  pro:     { label: 'Pro',     price: 79000,  color: '#8b5cf6', badge: 'bg-violet-500' },
  premium: { label: 'Premium', price: 99000,  color: '#f59e0b', badge: 'bg-amber-500' },
}

// ── Kuota Token Chatbot per Tier (per hari) ────────────────────────────────────
export const TOKEN_QUOTA = {
  free:    1_000,
  starter: 10_000,
  pro:     50_000,
  premium: Infinity,
}

// ── Feature Access Map: fitur → tier minimum yang dibutuhkan ──────────────────
const TIER_RANK = { free: 0, starter: 1, pro: 2, premium: 3 }

export const FEATURE_TIER = {
  chatbot:    'free',     // semua bisa, tapi kuota token berbeda
  packaging:  'free',     // free: 1x/hari, starter+: unlimited
  docs:       'pro',
  simulator:  'premium',
  nego:       'premium',
  calendar:   'premium',
  postexport: 'premium',
  hscode:     'premium',
  market:     'premium',
  alerts:     'premium',
}

// ── Packaging daily usage (khusus Free) ───────────────────────────────────────
const PACKAGING_FREE_LIMIT = 1

// ── Storage key builders — SELALU sertakan userId ────────────────────────────
function makeKey(base, userId) {
  // Gunakan suffix 'guest' jika belum login, user ID spesifik jika sudah login
  const suffix = userId ? String(userId).slice(0, 16) : 'guest'
  return `${base}_${suffix}`
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // "2025-09-07"
}

// ── Helpers baca/tulis localStorage ──────────────────────────────────────────
function loadSubscription(userId) {
  try {
    const raw = localStorage.getItem(makeKey('ne_subscription', userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveSubscription(data, userId) {
  localStorage.setItem(makeKey('ne_subscription', userId), JSON.stringify(data))
}

function loadTokenUsage(userId) {
  try {
    const raw = localStorage.getItem(makeKey('ne_token_usage', userId))
    if (!raw) return { date: getTodayKey(), used: 0 }
    const parsed = JSON.parse(raw)
    // Reset otomatis jika hari berbeda
    if (parsed.date !== getTodayKey()) return { date: getTodayKey(), used: 0 }
    return parsed
  } catch {
    return { date: getTodayKey(), used: 0 }
  }
}

function saveTokenUsage(data, userId) {
  localStorage.setItem(makeKey('ne_token_usage', userId), JSON.stringify(data))
}

function loadPackagingUsage(userId) {
  try {
    const raw = localStorage.getItem(makeKey('ne_packaging_usage', userId))
    if (!raw) return { date: getTodayKey(), used: 0 }
    const parsed = JSON.parse(raw)
    if (parsed.date !== getTodayKey()) return { date: getTodayKey(), used: 0 }
    return parsed
  } catch {
    return { date: getTodayKey(), used: 0 }
  }
}

function savePackagingUsage(data, userId) {
  localStorage.setItem(makeKey('ne_packaging_usage', userId), JSON.stringify(data))
}

// ── Estimasi token dari string (1 token ≈ 4 karakter) ────────────────────────
export function estimateTokens(text = '') {
  return Math.ceil(text.length / 4)
}

// ── Context ───────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null // null jika guest

  const [subscription, setSubscription]     = useState(null)
  const [tokenUsage, setTokenUsage]         = useState({ date: getTodayKey(), used: 0 })
  const [packagingUsage, setPackagingUsage] = useState({ date: getTodayKey(), used: 0 })

  // ── Reload semua data dari localStorage setiap kali userId berubah ───────────
  // Ini menangani: login, logout, ganti akun — selalu load data user yang benar.
  useEffect(() => {
    const sub = loadSubscription(userId)
    setSubscription(sub)  // null berarti Free (default)
    setTokenUsage(loadTokenUsage(userId))
    setPackagingUsage(loadPackagingUsage(userId))
  }, [userId]) // ← key: re-run setiap userId berubah

  // ── Tier aktif (default 'free' jika belum ada data untuk user ini) ──────────
  const tier = subscription?.tier ?? 'free'

  // ── Aktivasi tier (dummy — tanpa payment) ────────────────────────────────
  const activateTier = useCallback((newTier) => {
    if (!TIERS[newTier]) return
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + 30)

    const data = {
      tier: newTier,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    }
    saveSubscription(data, userId)
    setSubscription(data)

    // Reset token & packaging usage agar quota baru langsung terpakai penuh.
    // Ini berlaku baik saat upgrade MAUPUN downgrade — user selalu mulai fresh
    // dengan quota tier yang baru diaktifkan.
    const freshUsage = { date: getTodayKey(), used: 0 }
    saveTokenUsage(freshUsage, userId)
    setTokenUsage(freshUsage)
    savePackagingUsage(freshUsage, userId)
    setPackagingUsage(freshUsage)
  }, [userId])

  // ── Cek akses fitur berdasarkan tier aktif ───────────────────────────────
  const canAccess = useCallback((featureKey) => {
    const requiredTier = FEATURE_TIER[featureKey] ?? 'free'
    return TIER_RANK[tier] >= TIER_RANK[requiredTier]
  }, [tier])

  const isFeatureLocked = useCallback((featureKey) => !canAccess(featureKey), [canAccess])

  // ── Sisa token chatbot ───────────────────────────────────────────────────
  const tokenQuota     = TOKEN_QUOTA[tier]
  const tokensUsed     = tokenUsage.used
  const tokensRemaining = tokenQuota === Infinity ? Infinity : Math.max(0, tokenQuota - tokensUsed)
  const hasTokens      = tokensRemaining > 0

  // ── Konsumsi token setelah response chatbot ──────────────────────────────
  const consumeTokens = useCallback((inputText = '', outputText = '') => {
    if (tokenQuota === Infinity) return
    const tokens = estimateTokens(inputText) + estimateTokens(outputText)
    const updated = { date: getTodayKey(), used: tokenUsage.used + tokens }
    saveTokenUsage(updated, userId)
    setTokenUsage(updated)
  }, [tokenUsage.used, tokenQuota, userId])

  // ── Cek & konsumsi packaging usage (Free: 1x/hari) ──────────────────────
  const canUsePackaging = useCallback(() => {
    if (tier !== 'free') return true
    return packagingUsage.used < PACKAGING_FREE_LIMIT
  }, [tier, packagingUsage.used])

  const consumePackaging = useCallback(() => {
    if (tier !== 'free') return
    const updated = { date: getTodayKey(), used: packagingUsage.used + 1 }
    savePackagingUsage(updated, userId)
    setPackagingUsage(updated)
  }, [tier, packagingUsage.used, userId])

  const value = {
    tier,
    subscription,
    activateTier,
    canAccess,
    isFeatureLocked,
    // Token
    tokenQuota,
    tokensUsed,
    tokensRemaining,
    hasTokens,
    consumeTokens,
    // Packaging
    packagingUsed: packagingUsage.used,
    packagingLimit: PACKAGING_FREE_LIMIT,
    canUsePackaging,
    consumePackaging,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

export default SubscriptionContext
