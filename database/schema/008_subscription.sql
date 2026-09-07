-- =============================================
-- NusantaraExport.AI — Subscription Schema
-- Tambahkan kolom langganan ke tabel users
-- Database: nusantaraexport_ai (port 5432)
-- =============================================

-- Tambah kolom subscription_tier dan expires_at ke tabel users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Index untuk query cepat berdasarkan tier
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Pastikan semua user yang sudah ada mendapat tier 'free' sebagai default
UPDATE users
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

-- Verifikasi hasil migrasi
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE subscription_tier = 'free')    AS free_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'starter') AS starter_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'pro')     AS pro_tier,
  COUNT(*) FILTER (WHERE subscription_tier = 'premium') AS premium_tier
FROM users;
