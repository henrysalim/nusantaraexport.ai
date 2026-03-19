"""
HS Code Classifier — Pencocokan Otomatis Kode HS
=================================================
Modul ini akan menangani:
- Embedding deskripsi produk UMKM
- Pencarian semantik terdekat ke tabel hs_code_embeddings (pgvector)
- Return top-K HS Code yang paling cocok
"""


class HSCodeClassifier:
    """Klasifikasi produk ke HS Code menggunakan semantic matching."""

    def __init__(self):
        self.embedding_model = None

    def load_model(self):
        """Load sentence-transformer model untuk embedding."""
        # from sentence_transformers import SentenceTransformer
        # self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        pass

    def classify(self, product_description: str, top_k: int = 5) -> list:
        """
        Cocokkan deskripsi produk ke HS Code.

        Args:
            product_description: Deskripsi produk UMKM
            top_k: Jumlah kandidat HS Code teratas

        Returns:
            List of dict: [{hs_code, description, similarity_score}]
        """
        # Placeholder — implementasi di Step 4
        return []
