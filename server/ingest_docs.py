from app.services.vector_store import get_or_create_collection, add_documents
import uuid

def ingest_sample_regulations():
    """Ingest mock regulatory data for testing RAG"""
    collection = get_or_create_collection("regulations")
    
    docs = [
        "Permendag No. 19 Tahun 2021 tentang Kebijakan dan Pengaturan Ekspor: Eksportir harus memiliki NIB yang berlaku sebagai API-P atau API-U.",
        "Regulasi BPOM untuk Produk Makanan Olahan: Setiap produk yang diekspor harus memiliki Sertifikat Kesehatan (Health Certificate) jika dipersyaratkan oleh negara tujuan.",
        "Ketentuan Direktorat Jenderal Bea dan Cukai: Barang ekspor wajib diberitahukan ke Kantor Pabean dengan menggunakan dokumen pemberitahuan ekspor barang (PEB).",
        "Syarat Ekspor Kopi ke Uni Eropa: Harus bebas dari kontaminasi pestisida tertentu dan memiliki sertifikat fitosanitari dari Balai Karantina Pertanian.",
        "Ketentuan Labeling Ekspor: Label harus mencantumkan nama produk, berat bersih, nama dan alamat produsen, serta negara asal (Made in Indonesia)."
    ]
    
    metadatas = [
        {"source": "Permendag No 19/2021", "category": "Legal"},
        {"source": "BPOM Regulation", "category": "Health"},
        {"source": "Bea Cukai PEB", "category": "Customs"},
        {"source": "EU Export Guide", "category": "Region"},
        {"source": "Standard Labeling", "category": "Packaging"}
    ]
    
    ids = [str(uuid.uuid4()) for _ in range(len(docs))]
    
    add_documents(collection, docs, metadatas, ids)
    print(f"Ingested {len(docs)} mock regulatory documents into ChromaDB.")

if __name__ == "__main__":
    ingest_sample_regulations()
