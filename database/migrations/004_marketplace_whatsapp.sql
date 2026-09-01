-- ============================================================
-- NusantaraExport.AI — Migration 004: Tambah WhatsApp ke Marketplace
-- Jalankan di Supabase SQL Editor atau psql:
--   psql $AUTH_DATABASE_URL -f 004_marketplace_whatsapp.sql
-- ============================================================

-- Tambahkan kolom whatsapp_number ke marketplace_products (jika belum ada)
ALTER TABLE marketplace_products
    ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

COMMENT ON COLUMN marketplace_products.whatsapp_number IS
    'Nomor WhatsApp penjual dalam format internasional (tanpa +), contoh: 6281318756412';

-- ============================================================
-- Hapus semua produk seed lama (bersihkan data demo sebelumnya)
-- ============================================================
DELETE FROM marketplace_products
WHERE seller_name IN (
    'Koperasi Kopi Gayo',
    'Rotan Lestari Bali',
    'Batik Pusaka Solo',
    'Cokelat Nusantara',
    'Atsiri Alam Indonesia',
    'Jepara Woodcraft',
    'UMKM Lunelo',
    'Lunelo'
);

-- ============================================================
-- SEED DATA: Produk Lunelo — Keycap Fidget Keychain
-- IDR 25.000 ~ USD 1.56 → markup ekspor: USD 2.50
-- ============================================================
INSERT INTO marketplace_products
    (name, hs_code, category, description, price_usd, price_idr,
     min_order_qty, images, badges, location, lead_time, packaging,
     status, seller_name, whatsapp_number)
VALUES
    ('Lunelo Keycap Fidget Keychain',
     '3926.40',
     'Kerajinan',
     'Cute handmade keycap fidget keychain by Lunelo — little things, big smiles! Heart-shaped clicker keycap with kawaii custom sticker inside, paired with a red carabiner ring and adorable strawberry charm. Custom orders available. Handmade with love in Bandung, Indonesia.',
     2.50, 25000,
     '50 pcs',
     '["/lunelo-keychain.jpg"]',
     '["Handmade","Custom Order","Kawaii"]',
     'Bandung, Jawa Barat',
     '7-10 Hari Kerja',
     'Bubble Wrap + OPP Bag, 50 pcs per box',
     'active',
     'Lunelo',
     '6281318756412');

-- Konfirmasi
SELECT name, price_usd, price_idr, seller_name, whatsapp_number
FROM marketplace_products
WHERE seller_name = 'Lunelo';
