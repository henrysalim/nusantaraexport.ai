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
-- SEED DATA: Produk UMKM awal (referensi untuk onboarding)
-- ============================================================
INSERT INTO marketplace_products
    (name, hs_code, category, description, price_usd, price_idr,
     min_order_qty, images, badges, location, lead_time, packaging,
     status, seller_name)
VALUES
    ('Kopi Arabika Gayo Premium',
     '0901.11',
     'Makanan & Minuman',
     'Kopi Arabika Gayo dengan cita rasa kompleks, tingkat keasaman rendah, dan aroma rempah yang khas. Diproses secara fully washed dan ditanam di ketinggian 1200-1500 mdpl.',
     12.50, 195000,
     '100 kg',
     '["https://upload.wikimedia.org/wikipedia/commons/c/c5/Roasted_coffee_beans.jpg"]',
     '["Sertifikasi Organik","Fair Trade"]',
     'Aceh Tengah, Aceh',
     '14 Hari Kerja',
     'Jute Bag (60kg) dengan GrainPro',
     'active',
     'Koperasi Kopi Gayo'),

    ('Kerajinan Tas Anyaman Rotan',
     '4602.19',
     'Kerajinan',
     'Tas anyaman rotan asli Bali buatan tangan pengrajin lokal. Kuat, tahan lama, dan menggunakan pewarna alami yang ramah lingkungan.',
     24.00, 375000,
     '50 pcs',
     '["https://upload.wikimedia.org/wikipedia/commons/0/08/Fashionable_stylish_rattan_bag_on_a_tropical_wood_background._Tropical_island_of_Bali%2C_Indonesia._Rattan_handbag._%2842448810905%29.jpg"]',
     '["Eco-friendly","Handmade"]',
     'Gianyar, Bali',
     '21 Hari Kerja',
     'Karton Box Ekspor',
     'active',
     'Rotan Lestari Bali'),

    ('Kain Batik Tulis Sutera',
     '5209.41',
     'Tekstil & Pakaian',
     'Batik tulis asli berbahan sutera 100% dengan motif klasik Solo. Dikerjakan dengan teknik tradisional selama 3 bulan per lembarnya.',
     85.00, 1325000,
     '20 pcs',
     '["https://upload.wikimedia.org/wikipedia/commons/5/5f/Batik_Trusmi_Cirebon_%2823%29.jpg"]',
     '["Cultural Heritage","Premium Silk"]',
     'Surakarta, Jawa Tengah',
     '30 Hari Kerja',
     'Premium Gift Box & Outer Carton',
     'active',
     'Batik Pusaka Solo'),

    ('Biji Kakao Fermentasi Grade A',
     '1801.00',
     'Makanan & Minuman',
     'Biji kakao fermentasi standar ekspor dengan kadar air maksimal 7.5%. Memiliki profil rasa fruity dan floral khas kakao Bali.',
     8.50, 132000,
     '500 kg',
     '["https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&q=80&w=800"]',
     '["Export Ready","High Cocoa Butter"]',
     'Jembrana, Bali',
     '10 Hari Kerja',
     'Karung Goni 50kg',
     'active',
     'Cokelat Nusantara'),

    ('Minyak Nilam (Patchouli Oil)',
     '3301.19',
     'Minyak Atsiri',
     'Minyak nilam murni hasil destilasi uap. Kandungan Patchouli Alcohol (PA) minimum 30%, sangat cocok untuk industri parfum global.',
     45.00, 700000,
     '10 kg',
     '["https://upload.wikimedia.org/wikipedia/commons/b/b8/Rosemary_Oil_in_a_bottle_and_rosemary_herb.jpg"]',
     '["100% Pure","Sertifikasi ISO"]',
     'Garut, Jawa Barat',
     '14 Hari Kerja',
     'Drum Aluminium (5kg / 10kg)',
     'active',
     'Atsiri Alam Indonesia'),

    ('Mebel Kayu Jati Minimalis',
     '9401.61',
     'Furniture',
     'Set kursi dan meja berbahan kayu jati perhutani TPK. Finishing natural teak oil standar ekspor dengan ketahanan cuaca tinggi.',
     250.00, 3900000,
     '1 Kontainer 20ft',
     '["https://upload.wikimedia.org/wikipedia/commons/0/0a/Teak_Garden_Furniture_Patio_Set.jpg"]',
     '["Sertifikasi SVLK","Kiln Dried"]',
     'Jepara, Jawa Tengah',
     '45 Hari Kerja',
     'Corrugated Paper & Pallet Kayu',
     'active',
     'Jepara Woodcraft')
ON CONFLICT DO NOTHING;

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
     'Hub distribusi minyak atsiri ke seluruh Asia. Payment L/C 90 hari.'),

    ('Green Futures Australia Pty Ltd',
     'Australia',
     'trade@greenfutures.com.au',
     '["Makanan & Minuman","Kerajinan"]',
     '["0901","1801","4602"]',
     600000,
     FALSE,
     'Startup importir fokus produk berkelanjutan dan fair trade. Sedang proses verifikasi.'),

    ('Korea Home Living Corp',
     'Korea Selatan',
     'global@koreahomeliving.kr',
     '["Furniture","Kerajinan","Tekstil & Pakaian"]',
     '["9401","4602","5209"]',
     3200000,
     TRUE,
     'Importir furnitur dan dekorasi rumah terbesar di Korea. MOQ kontainer 40ft.')
ON CONFLICT DO NOTHING;

-- Konfirmasi
SELECT 'marketplace_products created with ' || COUNT(*) || ' records' as status FROM marketplace_products
UNION ALL
SELECT 'marketplace_buyers created with ' || COUNT(*) || ' records' as status FROM marketplace_buyers;
