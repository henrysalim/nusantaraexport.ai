-- =======================================================
-- NusantaraExport.AI — Community Forum Seed Data
-- =======================================================

INSERT INTO community_categories (name, description, icon, slug)
VALUES 
    ('Logistik & Kontainer', 'Diskusi mengenai pengiriman barang, pemilihan kargo, LCL/FCL, dokumen kepabeanan, dan tips pengapalan.', 'Truck', 'logistik-dan-kontainer'),
    ('Sertifikasi & Regulasi', 'Tanya jawab seputar sertifikasi Halal, HACCP, standar FDA, phytosanitary, dan bea cukai negara tujuan ekspor.', 'FileCheck', 'sertifikasi-dan-regulasi'),
    ('Pembayaran & Keuangan', 'Membahas Letter of Credit (L/C), metode pembayaran ekspor yang aman, asuransi ekspor, dan pendanaan ekspor.', 'DollarSign', 'pembayaran-dan-keuangan'),
    ('Pojok Curhat UMKM', 'Ruang santai sesama pelaku UMKM untuk berbagi perjuangan, hambatan, kegagalan, dan motivasi dalam perjalanan ekspor.', 'HeartHandshake', 'pojok-curhat-umkm')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;
