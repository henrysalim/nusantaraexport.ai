"""
RAG Service — Retrieval-Augmented Generation Engine.
Uses ChromaDB native API for vector search (no LangChain dependency).
Integrates with CendolNLP for response generation.
"""
import logging
from app.services.vector_store import get_or_create_collection, query_documents
from app.services.cendol_service import CendolNLPService

logger = logging.getLogger(__name__)


def query_regulations(query_text: str, n_results: int = 3) -> str:
    """
    Search regulation documents in ChromaDB and return formatted context.
    Uses ChromaDB's built-in embedding function for similarity search.
    """
    try:
        collection = get_or_create_collection("regulations")
        results = query_documents(collection, query_texts=[query_text], n_results=n_results)

        contexts = []
        if results and results.get("documents"):
            for i in range(len(results["documents"][0])):
                doc_text = results["documents"][0][i]
                source = results["metadatas"][0][i].get("source", "Unknown")
                contexts.append(f'[{source}] "{doc_text}"')

        return "\n\n".join(contexts) if contexts else ""
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return ""


def generate_rag_response(query: str) -> dict:
    """
    Full RAG pipeline: retrieve context → generate response.
    Returns dict with {answer, context_used, source}.
    """
    # 1. Retrieve relevant context from ChromaDB
    context = query_regulations(query)

    # 2. Generate response via CendolNLP (with auto-fallback)
    answer = CendolNLPService.generate_response(query, context)

    # 3. Extract source names
    sources = []
    try:
        collection = get_or_create_collection("regulations")
        results = query_documents(collection, query_texts=[query], n_results=3)
        if results and results.get("metadatas"):
            sources = [m.get("source", "Unknown") for m in results["metadatas"][0]]
    except Exception:
        pass

    return {
        "answer": answer,
        "context_used": sources,
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
