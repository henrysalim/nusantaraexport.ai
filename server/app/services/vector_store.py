"""
Vector Store — Supabase PostgreSQL Full-Text Search.
Gunakan pg tsvector untuk cari regulasi ekspor.
Tidak butuh model embedding, cocok untuk Vercel serverless.
"""
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

# ── Regulation data (sama persis dengan sebelumnya) ──────────────────────────
BOOTSTRAP_REGULATIONS = [
    {
        "id": "reg_001",
        "text": "Peraturan Menteri Perdagangan Nomor 22 Tahun 2024 tentang Kebijakan Ekspor Produk UMKM Pertanian menetapkan bahwa eksportir kopi wajib memiliki Certificate of Origin (SKA Form D/E) untuk dibebaskan bea tarif 0% masuk ke wilayah ASEAN dan China.",
        "source": "Permendag No. 22/2024",
        "category": "Legal"
    },
    {
        "id": "reg_002",
        "text": "Undang-Undang Bea Cukai Nomor 17 Tahun 2006 mewajibkan setiap eksportir menyerahkan Pemberitahuan Ekspor Barang (PEB) secara elektronik melalui sistem INSW paling lambat 7 hari sebelum kedatangan kapal pengangkut di pelabuhan muat.",
        "source": "UU Bea Cukai No. 17/2006",
        "category": "Customs"
    },
    {
        "id": "reg_003",
        "text": "FDA Amerika Serikat menetapkan regulasi ketat terhadap impor makanan olahan dari Indonesia. Kemasan harus mencantumkan Nutrition Facts dengan format vertikal standar, daftar bahan alergen wajib dicetak tebal, dan mencantumkan kalimat 'Product of Indonesia'.",
        "source": "FDA Food Labeling Guide",
        "category": "Packaging"
    },
    {
        "id": "reg_004",
        "text": "Peraturan Bea Cukai Jepang (Japan JAS Standard) mewajibkan seluruh produk komoditas kayu, makanan segar, dan sayuran impor memiliki sertifikat Phytosanitary bebas hama dari Balai Karantina Pertanian Indonesia sebelum diizinkan dibongkar di Pelabuhan Tokyo.",
        "source": "Japan Customs & Tariff Bureau 2025",
        "category": "Region"
    },
    {
        "id": "reg_005",
        "text": "Permendag No. 19 Tahun 2021 tentang Kebijakan dan Pengaturan Ekspor menyatakan eksportir harus memiliki NIB yang berlaku sebagai API-P atau API-U sebagai dokumen dasar untuk melakukan kegiatan ekspor dari wilayah Indonesia.",
        "source": "Permendag No. 19/2021",
        "category": "Legal"
    },
    {
        "id": "reg_006",
        "text": "Regulasi BPOM untuk produk makanan olahan: Setiap produk yang diekspor harus memiliki Sertifikat Kesehatan (Health Certificate) jika dipersyaratkan oleh negara tujuan. Label harus mencantumkan nama produk, berat bersih, nama dan alamat produsen, serta negara asal.",
        "source": "BPOM Regulation",
        "category": "Health"
    },
    {
        "id": "reg_007",
        "text": "Syarat Ekspor Kopi ke Uni Eropa: Harus bebas dari kontaminasi pestisida tertentu dan memiliki sertifikat fitosanitari dari Balai Karantina Pertanian. EU Deforestation Regulation (EUDR) mulai 30 Desember 2024 mewajibkan bukti bahwa produk tidak berasal dari lahan deforestasi.",
        "source": "EU Export Guide / EUDR",
        "category": "Region"
    },
    {
        "id": "reg_008",
        "text": "Perjanjian IJEPA memberikan tarif preferensial 0% untuk kopi arabika (HS Code 0901.21.10) yang diekspor dari Indonesia ke Jepang, dengan syarat menggunakan SKA Form IJEPA yang diterbitkan Dinas Perindag.",
        "source": "IJEPA Rules of Origin",
        "category": "FTA"
    },
    {
        "id": "reg_009",
        "text": "ACFTA memberikan tarif 0% untuk keripik singkong (HS Code 2005.99.90) dari Indonesia ke Tiongkok. Eksportir wajib menggunakan SKA Form E yang diterbitkan oleh Kemendag.",
        "source": "ACFTA Tariff Schedule",
        "category": "FTA"
    },
    {
        "id": "reg_010",
        "text": "RCEP (Regional Comprehensive Economic Partnership) berlaku sejak 2022 untuk 15 negara Asia-Pasifik. Tarif preferensial berkisar 0-5% tergantung komoditas dan negara tujuan. Eksportir harus mendapatkan SKA Form RCEP.",
        "source": "RCEP Agreement",
        "category": "FTA"
    },
    {
        "id": "reg_011",
        "text": "Ketentuan Ekspor Kerajinan Kayu ke Uni Eropa: Wajib memiliki dokumen V-Legal/SVLK, Fumigation Certificate sesuai ISPM-15, dan memenuhi EU Timber Regulation (EUTR). Tarif melalui GSP+ Indonesia adalah 0%.",
        "source": "EU Timber Regulation (EUTR)",
        "category": "Region"
    },
    {
        "id": "reg_012",
        "text": "Korea Selatan menurunkan batas maksimum residu pestisida pada produk pertanian impor dari Indonesia. Eksportir kopi, teh, rempah-rempah, dan sayuran wajib melakukan uji lab terbaru.",
        "source": "Korea Food Safety Act 2025",
        "category": "Health"
    },
    {
        "id": "reg_013",
        "text": "Letter of Credit (L/C) adalah cara pembayaran paling aman untuk ekspor. Bank pembeli menjamin pencairan dana jika dokumen pengiriman sesuai syarat. Dokumen: Bill of Lading, Commercial Invoice, Packing List, Certificate of Origin, dan Insurance Certificate.",
        "source": "UCP 600 - ICC Rules",
        "category": "Finance"
    },
    {
        "id": "reg_014",
        "text": "Asuransi Kargo Ekspor (Marine Cargo Insurance) melindungi barang dari risiko kerusakan selama transit. Polis All Risks (Clause A) mencakup semua risiko kecuali yang dikecualikan secara spesifik. Premi berkisar 0.3-0.5% dari nilai CIF barang.",
        "source": "Institute Cargo Clauses 2009",
        "category": "Finance"
    },
    {
        "id": "reg_015",
        "text": "Indonesia National Single Window (INSW) versi 2.0 menyederhanakan proses pengajuan dokumen ekspor secara elektronik. Semua dokumen PEB, SKA, dan Phytosanitary Certificate bisa diajukan melalui satu portal terintegrasi di insw.go.id.",
        "source": "Peraturan Presiden No. 10/2024 tentang INSW",
        "category": "Digital"
    },
]

def bootstrap_regulations():
    """
    Ingest dokumen regulasi ke Supabase dengan full-text search index.
    Hanya jalan jika tabel masih kosong.
    """
    from app.config.db_config import get_db_connection
    conn = get_db_connection()
    if not conn:
        logger.warning("⚠️ DB tidak tersedia, skip bootstrap regulations.")
        return

    cur = None
    try:
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Buat tabel dengan full-text search (tidak perlu pgvector)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS regulations (
                id VARCHAR(50) PRIMARY KEY,
                text TEXT NOT NULL,
                source VARCHAR(255),
                category VARCHAR(100),
                search_vector tsvector GENERATED ALWAYS AS
                    (to_tsvector('indonesian', coalesce(text,'') || ' ' || coalesce(source,''))) STORED,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)

        # Index untuk full-text search
        cur.execute("""
            CREATE INDEX IF NOT EXISTS regulations_search_idx
            ON regulations USING GIN(search_vector)
        """)
        conn.commit()

        cur.execute("SELECT COUNT(*) as count FROM regulations")
        count = cur.fetchone()["count"]

        if count > 0:
            logger.info(f"Supabase sudah ada {count} dokumen regulasi. Skip bootstrap.")
            return

        logger.info("Bootstrapping regulations ke Supabase...")
        for reg in BOOTSTRAP_REGULATIONS:
            cur.execute(
                """
                INSERT INTO regulations (id, text, source, category)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (reg["id"], reg["text"], reg["source"], reg["category"])
            )

        conn.commit()
        logger.info(f"✅ Bootstrap selesai: {len(BOOTSTRAP_REGULATIONS)} dokumen regulasi.")

    except Exception as e:
        logger.error(f"Bootstrap error: {e}")
        if conn:
            conn.rollback()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def query_regulations(query_text: str, n_results: int = 3) -> str:
    """
    Cari regulasi relevan via PostgreSQL full-text search.
    Return: string konteks untuk system prompt Gemini.
    """
    from app.config.db_config import get_db_connection
    conn = get_db_connection()
    if not conn:
        return ""

    cur = None
    try:
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Ekstrak kata kunci dari query untuk full-text search
        # Bersihkan dan buat tsquery
        keywords = " | ".join(
            w for w in query_text.replace(",", " ").replace("?", " ").split()
            if len(w) > 2
        )

        if not keywords:
            return ""

        # Coba indonesian config dulu, fallback ke simple
        for lang_config in ["indonesian", "simple"]:
            try:
                cur.execute(
                    """
                    SELECT text, source, category,
                           ts_rank(search_vector, to_tsquery(%s, %s)) AS rank
                    FROM regulations
                    WHERE search_vector @@ to_tsquery(%s, %s)
                    ORDER BY rank DESC
                    LIMIT %s
                    """,
                    (lang_config, keywords, lang_config, keywords, n_results)
                )
                results = cur.fetchall()
                if results:
                    break
            except Exception:
                continue

        # Fallback: ILIKE jika full-text tidak ada hasil
        if not results:
            search_term = f"%{query_text[:50]}%"
            cur.execute(
                """
                SELECT text, source, category, 0.5 as rank
                FROM regulations
                WHERE text ILIKE %s OR source ILIKE %s
                LIMIT %s
                """,
                (search_term, search_term, n_results)
            )
            results = cur.fetchall()

        if not results:
            return ""

        context_parts = [f"[{r['source']}] {r['text']}" for r in results]
        return "\n\n".join(context_parts)

    except Exception as e:
        logger.error(f"query_regulations error: {e}")
        return ""
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
