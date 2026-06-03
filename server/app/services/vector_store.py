"""
ChromaDB Vector Store with bootstrap regulation data.
Uses ChromaDB's built-in default embedding function (no external deps required).
"""
import chromadb
import os
import logging

logger = logging.getLogger(__name__)

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")

# Initialize ChromaDB Persistent Client
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)


def get_chroma_client():
    return chroma_client


def get_or_create_collection(name: str = "regulations"):
    return chroma_client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}
    )


def add_documents(collection, documents: list, metadatas: list, ids: list):
    """Add documents to a ChromaDB collection."""
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )


def query_documents(collection, query_texts: list, n_results: int = 3):
    """Query ChromaDB for relevant context."""
    return collection.query(
        query_texts=query_texts,
        n_results=n_results
    )


# ──────────────────────────────────────────────────────
# Bootstrap Regulations Data
# ──────────────────────────────────────────────────────

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
        "text": "FDA (Food and Drug Administration) Amerika Serikat menetapkan regulasi ketat terhadap impor makanan olahan dari Indonesia. Kemasan harus mencantumkan Nutrition Facts dengan format vertikal standar, daftar bahan alergen wajib dicetak tebal, dan mencantumkan kalimat 'Product of Indonesia'.",
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
        "text": "Regulasi BPOM untuk produk makanan olahan: Setiap produk yang diekspor harus memiliki Sertifikat Kesehatan (Health Certificate) jika dipersyaratkan oleh negara tujuan. Label harus mencantumkan nama produk, berat bersih, nama dan alamat produsen, serta negara asal (Made in Indonesia).",
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
        "text": "Perjanjian IJEPA (Indonesia-Japan Economic Partnership Agreement) memberikan tarif preferensial 0% untuk kopi arabika (HS Code 0901.21.10) yang diekspor dari Indonesia ke Jepang, dengan syarat menggunakan SKA Form IJEPA yang diterbitkan Dinas Perindag.",
        "source": "IJEPA Rules of Origin",
        "category": "FTA"
    },
    {
        "id": "reg_009",
        "text": "ACFTA (ASEAN-China Free Trade Agreement) memberikan tarif 0% untuk keripik singkong (HS Code 2005.99.90) dari Indonesia ke Tiongkok. Eksportir wajib menggunakan SKA Form E yang diterbitkan oleh Kemendag.",
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
        "text": "Ketentuan Ekspor Kerajinan Kayu ke Uni Eropa: Wajib memiliki dokumen V-Legal/SVLK (Sistem Verifikasi Legalitas Kayu), Fumigation Certificate sesuai ISPM-15, dan memenuhi EU Timber Regulation (EUTR). Tarif melalui GSP+ Indonesia adalah 0%.",
        "source": "EU Timber Regulation (EUTR)",
        "category": "Region"
    },
    {
        "id": "reg_012",
        "text": "Korea Selatan menurunkan batas maksimum residu pestisida Chlorpyrifos pada produk pertanian impor dari 0.05 ppm menjadi 0.01 ppm. Ini mempengaruhi ekspor kopi, teh, rempah-rempah, dan sayuran dari Indonesia. Eksportir wajib melakukan uji lab terbaru.",
        "source": "Korea Food Safety Act 2025",
        "category": "Health"
    },
    {
        "id": "reg_013",
        "text": "Letter of Credit (L/C) adalah cara pembayaran paling aman untuk ekspor. Bank pembeli menjamin pencairan dana jika dokumen pengiriman sesuai syarat. Dokumen yang biasanya disyaratkan: Bill of Lading, Commercial Invoice, Packing List, Certificate of Origin, dan Insurance Certificate.",
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
    Ingest bootstrap regulation documents into ChromaDB.
    Only runs if the collection is empty.
    """
    collection = get_or_create_collection("regulations")

    if collection.count() > 0:
        logger.info(f"ChromaDB already has {collection.count()} documents. Skipping bootstrap.")
        return

    logger.info("Bootstrapping ChromaDB with regulation data...")

    docs = [r["text"] for r in BOOTSTRAP_REGULATIONS]
    metadatas = [{"source": r["source"], "category": r["category"]} for r in BOOTSTRAP_REGULATIONS]
    ids = [r["id"] for r in BOOTSTRAP_REGULATIONS]

    add_documents(collection, docs, metadatas, ids)
    logger.info(f"✅ ChromaDB bootstrapped with {len(docs)} regulation documents.")
