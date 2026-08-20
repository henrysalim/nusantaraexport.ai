"""
RAG Service — Retrieval-Augmented Generation Engine.
Uses ChromaDB native API for vector search (no LangChain dependency).
Integrates with CendolNLP for response generation.
"""
import logging
from app.services.vector_store import query_regulations
from app.services.cendol_service import CendolNLPService

logger = logging.getLogger(__name__)


def generate_rag_response(query: str) -> dict:
    """
    Full RAG pipeline: retrieve context → generate response.
    Returns dict with {answer, context_used, source}.
    """
    # 1. Retrieve relevant context from PostgreSQL Full-Text Search
    context = query_regulations(query)

    # 2. Generate response via CendolNLP (with auto-fallback)
    answer = CendolNLPService.generate_response(query, context)

    return {
        "answer": answer,
        "context_used": [context] if context else [],
        "source": "rag_pipeline"
    }


def format_rag_prompt(query: str, context: str) -> str:
    """Format a RAG prompt for the LLM."""
    return f"""Anda adalah asisten ahli ekspor NusantaraExport.AI. 
Gunakan konteks regulasi berikut untuk menjawab pertanyaan pengguna dengan akurat (tidak menebak).
Jika jawaban tidak ada di konteks, katakan bahwa Anda tidak tahu.

KONTEKS REGULASI:
{context}

PERTANYAAN:
{query}

JAWABAN:
"""
