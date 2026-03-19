"""
RAG Service — Retrieval-Augmented Generation dengan LLM Cendol
==============================================================
Modul ini akan menangani:
- Retrieve dokumen relevan dari rag_documents (pgvector similarity search)
- Augment prompt dengan context dokumen
- Generate market brief menggunakan LLM Cendol
"""


class RAGService:
    """Retrieval-Augmented Generation service."""

    def __init__(self):
        self.llm = None
        self.embedding_model = None

    def load_models(self):
        """Load LLM dan embedding model."""
        # Placeholder — implementasi di Step 4
        pass

    def retrieve_context(self, query: str, top_k: int = 5) -> list:
        """
        Ambil dokumen konteks dari pgvector.

        Args:
            query: Pertanyaan pengguna
            top_k: Jumlah dokumen teratas

        Returns:
            List of relevant document chunks
        """
        # Placeholder — implementasi di Step 4
        return []

    def generate_brief(self, query: str, commodity: str, target_country: str) -> dict:
        """
        Generate market brief menggunakan RAG.

        Args:
            query: Pertanyaan/instruksi pengguna
            commodity: Nama komoditas
            target_country: Negara tujuan ekspor

        Returns:
            dict: {brief, sources, hs_code_suggestion}
        """
        # Placeholder — implementasi di Step 4
        return {
            "brief": "",
            "sources": [],
            "hs_code_suggestion": "",
        }
