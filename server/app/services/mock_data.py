"""
Fallback Data Service — Static backup data for modules that cannot use external APIs.
NOTE: Market gap data has been migrated to market_fallback.json + comtrade_service.py.
"""



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





