"""
Mock Data Service — Comprehensive backup data for all modules.
Used when external APIs are unavailable or for instant demo responses.
"""

# ──────────────────────────────────────────────────────
# HS Code Database
# ──────────────────────────────────────────────────────
HS_CODE_DB = {
    "kopi": {
        "product": "Kopi Arabika",
        "hs_code": "0901.21.10",
        "description": "Kopi, tidak disangrai, tidak dihilangkan kafeinnya — Arabika WIB",
        "chapter": "Chapter 09 — Kopi, Teh, Mate dan Rempah-rempah",
        "mfn_tariff": "5-15%",
        "fta_results": [
            {"agreement": "IJEPA (Jepang)", "tariff": "0%", "saving": "¥180,000/kontainer", "status": "Berlaku"},
            {"agreement": "ACFTA (Tiongkok)", "tariff": "0%", "saving": "¥120,000/kontainer", "status": "Berlaku"},
            {"agreement": "AKFTA (Korea)", "tariff": "2%", "saving": "₩95,000/kontainer", "status": "Berlaku"},
            {"agreement": "AIFTA (India)", "tariff": "5%", "saving": "₹85,000/kontainer", "status": "Berlaku"},
            {"agreement": "IA-CEPA (Australia)", "tariff": "0%", "saving": "A$2,100/kontainer", "status": "Berlaku"},
            {"agreement": "RCEP", "tariff": "0%", "saving": "Bervariasi", "status": "Berlaku"},
        ],
        "best_fta": "IJEPA (Jepang)",
        "best_saving": "¥180,000/kontainer (~Rp 19.800.000)",
    },
    "singkong": {
        "product": "Keripik Singkong",
        "hs_code": "2005.99.90",
        "description": "Sayuran lainnya, disiapkan atau diawetkan — keripik singkong",
        "chapter": "Chapter 20 — Olahan Sayuran, Buah, dan Kacang",
        "mfn_tariff": "10-25%",
        "fta_results": [
            {"agreement": "ACFTA (Tiongkok)", "tariff": "0%", "saving": "¥95,000/kontainer", "status": "Berlaku"},
            {"agreement": "AANZFTA (ASEAN-ANZ)", "tariff": "0%", "saving": "A$1,800/kontainer", "status": "Berlaku"},
            {"agreement": "RCEP", "tariff": "5%", "saving": "Bervariasi", "status": "Berlaku"},
            {"agreement": "IJEPA (Jepang)", "tariff": "8.5%", "saving": "¥42,000/kontainer", "status": "Berlaku"},
        ],
        "best_fta": "ACFTA (Tiongkok)",
        "best_saving": "¥95,000/kontainer (~Rp 10.450.000)",
    },
    "kayu": {
        "product": "Kerajinan Kayu",
        "hs_code": "4420.90.00",
        "description": "Barang dari kayu untuk ornamen dan dekorasi",
        "chapter": "Chapter 44 — Kayu dan Barang dari Kayu",
        "mfn_tariff": "0-5%",
        "fta_results": [
            {"agreement": "GSP+ (Uni Eropa)", "tariff": "0%", "saving": "€2,500/kontainer", "status": "Berlaku"},
            {"agreement": "IA-CEPA (Australia)", "tariff": "0%", "saving": "A$1,200/kontainer", "status": "Berlaku"},
            {"agreement": "RCEP", "tariff": "0%", "saving": "Bervariasi", "status": "Berlaku"},
        ],
        "best_fta": "GSP+ (Uni Eropa)",
        "best_saving": "€2,500/kontainer (~Rp 42.500.000)",
    },
    "rempah": {
        "product": "Rempah-rempah",
        "hs_code": "0910.11.00",
        "description": "Jahe — tidak dihancurkan dan tidak ditumbuk",
        "chapter": "Chapter 09 — Kopi, Teh, Mate dan Rempah-rempah",
        "mfn_tariff": "5-20%",
        "fta_results": [
            {"agreement": "ACFTA (Tiongkok)", "tariff": "0%", "saving": "¥80,000/kontainer", "status": "Berlaku"},
            {"agreement": "AIFTA (India)", "tariff": "8%", "saving": "₹60,000/kontainer", "status": "Berlaku"},
            {"agreement": "RCEP", "tariff": "3%", "saving": "Bervariasi", "status": "Berlaku"},
        ],
        "best_fta": "ACFTA (Tiongkok)",
        "best_saving": "¥80,000/kontainer (~Rp 8.800.000)",
    },
}

# ──────────────────────────────────────────────────────
# Market Data (Mock UN COMTRADE)
# ──────────────────────────────────────────────────────
MARKET_DATA = {
    "kopi": {
        "top_destinations": [
            {"country": "🇯🇵 Jepang", "score": 92, "demand_usd": 890_000_000},
            {"country": "🇺🇸 Amerika Serikat", "score": 88, "demand_usd": 1_200_000_000},
            {"country": "🇩🇪 Jerman", "score": 85, "demand_usd": 720_000_000},
            {"country": "🇰🇷 Korea Selatan", "score": 79, "demand_usd": 340_000_000},
        ],
        "gap_score": 87,
        "avg_price": "$4,200/ton",
        "growth": "+12.3%",
        "idn_export_usd": 1_200_000_000,
        "global_demand_usd": 8_500_000_000,
    },
    "singkong": {
        "top_destinations": [
            {"country": "🇨🇳 Tiongkok", "score": 94, "demand_usd": 650_000_000},
            {"country": "🇯🇵 Jepang", "score": 82, "demand_usd": 180_000_000},
            {"country": "🇰🇷 Korea Selatan", "score": 78, "demand_usd": 120_000_000},
            {"country": "🇦🇪 Uni Emirat Arab", "score": 71, "demand_usd": 85_000_000},
        ],
        "gap_score": 91,
        "avg_price": "$1,800/ton",
        "growth": "+23.1%",
        "idn_export_usd": 450_000_000,
        "global_demand_usd": 3_200_000_000,
    },
    "kayu": {
        "top_destinations": [
            {"country": "🇳🇱 Belanda", "score": 89, "demand_usd": 420_000_000},
            {"country": "🇬🇧 Inggris", "score": 84, "demand_usd": 280_000_000},
            {"country": "🇦🇺 Australia", "score": 80, "demand_usd": 190_000_000},
            {"country": "🇸🇬 Singapura", "score": 76, "demand_usd": 95_000_000},
        ],
        "gap_score": 72,
        "avg_price": "€25-45/unit",
        "growth": "+8.7%",
        "idn_export_usd": 280_000_000,
        "global_demand_usd": 2_100_000_000,
    },
}

# ──────────────────────────────────────────────────────
# Packaging Check Results
# ──────────────────────────────────────────────────────
PACKAGING_PASS = {
    "score": 92,
    "status": "Siap Ekspor",
    "items": [
        {"label": "Label Bahasa Inggris", "status": "pass", "note": "Terdeteksi — sudah sesuai standar internasional"},
        {"label": "Informasi Nutrisi", "status": "pass", "note": "Format Nutrition Facts sesuai FDA style"},
        {"label": "Tanggal Kedaluwarsa", "status": "pass", "note": "Format DD/MM/YYYY terdeteksi dengan jelas"},
        {"label": "Kode Barcode", "status": "pass", "note": "EAN-13 valid terdeteksi"},
        {"label": "Berat Bersih / Netto", "status": "warning", "note": "Tambahkan satuan oz untuk pasar AS"},
        {"label": "Sertifikasi Halal", "status": "pass", "note": "Logo MUI terdeteksi"},
        {"label": "Negara Asal", "status": "pass", "note": "'Made in Indonesia' terdeteksi"},
    ],
    "suggestion": "Kemasan Anda sudah 92% siap ekspor. Tambahkan satuan oz di samping gram untuk memenuhi standar FDA Amerika Serikat."
}

PACKAGING_FAIL = {
    "score": 45,
    "status": "Perlu Perbaikan",
    "items": [
        {"label": "Label Bahasa Inggris", "status": "fail", "note": "Tidak ditemukan — wajib untuk ekspor"},
        {"label": "Informasi Nutrisi", "status": "fail", "note": "Belum ada Nutrition Facts panel"},
        {"label": "Tanggal Kedaluwarsa", "status": "warning", "note": "Format tidak standar, gunakan DD/MM/YYYY"},
        {"label": "Kode Barcode", "status": "pass", "note": "EAN-13 valid terdeteksi"},
        {"label": "Berat Bersih / Netto", "status": "fail", "note": "Tidak terlihat pada kemasan"},
        {"label": "Sertifikasi Halal", "status": "warning", "note": "Logo tidak jelas, resolusi rendah"},
        {"label": "Negara Asal", "status": "fail", "note": "'Made in Indonesia' belum tercantum"},
    ],
    "suggestion": "Kemasan Anda belum siap ekspor. Prioritas utama: tambahkan label bahasa Inggris, Nutrition Facts, dan tulisan 'Made in Indonesia'."
}

# ──────────────────────────────────────────────────────
# Export Readiness Simulation
# ──────────────────────────────────────────────────────
COUNTRY_NAMES = {
    "jp": "Jepang", "cn": "Tiongkok", "us": "Amerika Serikat",
    "de": "Jerman", "au": "Australia", "kr": "Korea Selatan",
    "sg": "Singapura", "nl": "Belanda", "gb": "Inggris",
}

REQUIRED_DOCS_BY_COUNTRY = {
    "jp": ["NIB", "SKA Form IJEPA", "Phytosanitary Certificate", "ICO Certificate", "Commercial Invoice", "Packing List", "Bill of Lading"],
    "cn": ["NIB", "SKA Form E (ACFTA)", "Phytosanitary Certificate", "Health Certificate", "Commercial Invoice", "Packing List", "Bill of Lading"],
    "us": ["NIB", "FDA Registration", "Phytosanitary Certificate", "Commercial Invoice", "Packing List", "Bill of Lading"],
    "default": ["NIB", "SKA", "Phytosanitary Certificate", "Commercial Invoice", "Packing List", "Bill of Lading"],
}

# ──────────────────────────────────────────────────────
# Dry Run Checkpoint Data
# ──────────────────────────────────────────────────────
DRY_RUN_CHECKPOINTS = [
    {
        "checkpoint": "Gudang UMKM (Origin)",
        "description": "Menyiapkan CoA & SKA Form D/E",
        "documents": ["Certificate of Analysis (CoA)", "Surat Keterangan Asal (SKA)"],
        "risk_level": "low",
        "risk_detail": "Pastikan QC kemasan aman dan label sesuai regulasi tujuan"
    },
    {
        "checkpoint": "Pabean Keberangkatan (Bea Cukai RI)",
        "description": "Upload PEB & NPE ke sistem INSW",
        "documents": ["Pemberitahuan Ekspor Barang (PEB)", "Nota Pelayanan Ekspor (NPE)"],
        "risk_level": "medium",
        "risk_detail": "Kesalahan HS Code 8-digit sering terjadi dan menyebabkan penolakan"
    },
    {
        "checkpoint": "Terminal Peti Kemas (Pelabuhan)",
        "description": "Pemeriksaan fisik oleh Karantina Pertanian/Hewan",
        "documents": ["Phytosanitary Certificate", "Fumigation Certificate (jika kayu)"],
        "risk_level": "high",
        "risk_detail": "Kadar air atau kontaminasi serangga dapat menyebabkan penolakan total"
    },
    {
        "checkpoint": "Transit Logistik (Pelayaran)",
        "description": "Penerbitan B/L dan monitoring kontainer",
        "documents": ["Bill of Lading (B/L)", "Marine Insurance Certificate"],
        "risk_level": "medium",
        "risk_detail": "Keterlambatan jadwal pelayaran mempengaruhi L/C expiry date"
    },
    {
        "checkpoint": "Pabean Tujuan (Negara Buyer)",
        "description": "Import Custom Clearance & SPS inspection",
        "documents": ["Import Declaration", "SPS Certificate", "Label Compliance"],
        "risk_level": "very_high",
        "risk_detail": "Kemasan tanpa negara asal atau label lokal akan ditahan di customs"
    },
    {
        "checkpoint": "Gudang Buyer (Destination)",
        "description": "Serah terima fisik, pencairan L/C",
        "documents": ["Delivery Order", "Certificate of Acceptance"],
        "risk_level": "low",
        "risk_detail": "Pencairan sisa 70% invoice via L/C at Sight"
    },
]

# ──────────────────────────────────────────────────────
# Smart Calendar Events
# ──────────────────────────────────────────────────────
CALENDAR_EVENTS = [
    {
        "month": "Januari",
        "events": [
            {"type": "demand", "title": "Imlek (Chinese New Year)", "desc": "Permintaan rempah & makanan olahan meningkat di Tiongkok dan Asia Tenggara", "priority": "high"},
            {"type": "doc", "title": "Perpanjangan NIB Tahunan", "desc": "Pastikan NIB Anda masih berlaku untuk tahun ini", "priority": "medium"},
        ]
    },
    {
        "month": "Maret-April",
        "events": [
            {"type": "demand", "title": "Ramadan Season", "desc": "Permintaan kurma, rempah, dan makanan olahan meningkat di Timur Tengah & domestik", "priority": "high"},
            {"type": "harvest", "title": "Awal Musim Panen Kopi", "desc": "Mulai persiapan pengumpulan bahan baku kopi arabika", "priority": "medium"},
        ]
    },
    {
        "month": "Juni-Agustus",
        "events": [
            {"type": "harvest", "title": "Musim Panen Raya", "desc": "Periode produksi maksimal kopi, kakao, dan rempah", "priority": "high"},
            {"type": "doc", "title": "Sertifikasi Phytosanitary", "desc": "Waktu terbaik untuk mengurus sertifikat karena panen segar", "priority": "high"},
        ]
    },
    {
        "month": "September",
        "events": [
            {"type": "logistics", "title": "Booking Kontainer FCL", "desc": "Booking kontainer untuk pengiriman Oktober. Waktu tempuh ke UE/AS: 25-30 hari", "priority": "high"},
            {"type": "doc", "title": "Batas Akhir Onboarding Dokumen", "desc": "Lengkapi semua dokumen ekspor sebelum pengiriman Q4", "priority": "high"},
        ]
    },
    {
        "month": "Oktober-November",
        "events": [
            {"type": "demand", "title": "Thanksgiving & Pre-Christmas", "desc": "Peak demand window! Harga komoditas di titik tertinggi", "priority": "high"},
            {"type": "demand", "title": "Singles Day (11.11) Tiongkok", "desc": "Permintaan e-commerce cross-border melonjak", "priority": "medium"},
        ]
    },
    {
        "month": "Desember",
        "events": [
            {"type": "demand", "title": "Christmas & New Year", "desc": "Permintaan kerajinan, rempah, dan kopi premium meningkat di Eropa & AS", "priority": "high"},
            {"type": "doc", "title": "SKA harus diajukan", "desc": "Maks. 7 hari setelah kapal berangkat", "priority": "medium"},
        ]
    },
]
