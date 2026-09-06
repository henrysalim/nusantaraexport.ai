"""
RAG Route — Regulation Query with ChromaDB vector search.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.middleware import get_current_user
from app.services.rag_service import generate_rag_response, query_regulations
from app.services.cendol_service import CendolNLPService
from app.config.redis_config import get_cache, set_cache
import hashlib
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    user_id: str = "anonymous"
    query: str


@router.post("/query")
def query_rag(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    """Query regulation database via RAG pipeline."""
    # 1. Check cache
    cache_key = f"rag:{hashlib.md5(request.query.encode()).hexdigest()}"
    cached_res = get_cache(cache_key)
    if cached_res:
        return {"answer": cached_res, "source": "cache"}

    # 2. Run RAG pipeline
    try:
        result = generate_rag_response(request.query)

        # 3. Cache the result
        set_cache(cache_key, result["answer"])

        return {
            "answer": result["answer"],
            "context_used": result["context_used"],
            "source": result["source"]
        }
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        # Fallback to CendolNLP without RAG context
        ai_res = CendolNLPService.generate_response(request.query)
        fallback_answer = ai_res.get("answer", "") if isinstance(ai_res, dict) else str(ai_res)
        return {
            "answer": fallback_answer,
            "context_used": [],
            "source": "fallback"
        }
