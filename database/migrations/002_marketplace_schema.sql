-- ============================================================
-- NusantaraExport.AI — Migration 002: Marketplace Schema
-- Jalankan di Supabase SQL Editor atau psql:
--   psql $AUTH_DATABASE_URL -f 002_marketplace_schema.sql
-- ============================================================

-- marketplace_products: Produk UMKM siap ekspor
CREATE TABLE IF NOT EXISTS marketplace_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    hs_code         VARCHAR(20),
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    price_usd       NUMERIC(12,2) NOT NULL CHECK (price_usd > 0),
    price_idr       NUMERIC(15,0),
    min_order_qty   VARCHAR(50),
    images          JSONB DEFAULT '[]'::jsonb,
    badges          JSONB DEFAULT '[]'::jsonb,
    location        VARCHAR(255),
    lead_time       VARCHAR(100),
    packaging       VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','draft','pending_review','archived')),
    seller_name     VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketplace_updated_at ON marketplace_products;
CREATE TRIGGER trg_marketplace_updated_at
    BEFORE UPDATE ON marketplace_products
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

-- marketplace_buyers: Buyer internasional
CREATE TABLE IF NOT EXISTS marketplace_buyers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name        VARCHAR(255) NOT NULL,
    country             VARCHAR(100) NOT NULL,
    contact_email       VARCHAR(255),
    target_categories   JSONB DEFAULT '[]'::jsonb,
    interested_hs_codes JSONB DEFAULT '[]'::jsonb,
    annual_volume_usd   NUMERIC(15,2),
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mp_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_mp_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_mp_products_hs_code ON marketplace_products(hs_code);
CREATE INDEX IF NOT EXISTS idx_mp_products_created ON marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_buyers_country ON marketplace_buyers(country);
CREATE INDEX IF NOT EXISTS idx_mp_buyers_verified ON marketplace_buyers(is_verified);

-- ============================================================
-- SEED DATA: Lihat migration 004_marketplace_whatsapp.sql
-- Produk aktif marketplace dikelola via migration 004.
-- ============================================================

-- ============================================================
-- SEED DATA: Buyer Internasional
-- ============================================================
INSERT INTO marketplace_buyers
    (company_name, country, contact_email, target_categories,
     interested_hs_codes, annual_volume_usd, is_verified, notes)
VALUES
    ('Yamamoto Trading Co.',
     'Jepang',
     'sourcing@yamamoto-trading.co.jp',
     '["Makanan & Minuman","Minyak Atsiri"]',
     '["0901","0803","2101"]',
     2500000,
     TRUE,
     'Importir kopi dan teh premium Jepang. Prioritas produk organik bersertifikat.'),

    ('Global Craft Imports GmbH',
     'Jerman',
     'buy@globalcraft-imports.de',
     '["Kerajinan","Tekstil & Pakaian","Furniture"]',
     '["4602","6304","9401"]',
     1800000,
     TRUE,
     'Distributor produk artisanal Asia Tenggara ke pasar UE. Perlu bukti EUDR.'),

    ('Sunrise Aromatics Pte Ltd',
     'Singapura',
     'procurement@sunrise-aromatics.sg',
     '["Minyak Atsiri"]',
     '["3301","3302"]',
     900000,
     TRUE,
     'Hub distribusi minyak atsiri ke seluruh Asia. Payment L/C 90 hari.')
ON CONFLICT DO NOTHING;

-- Konfirmasi
SELECT 'marketplace_products table ready' as status
UNION ALL
SELECT 'marketplace_buyers created with ' || COUNT(*) || ' records' as status FROM marketplace_buyers;
