from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag_service import get_rag_chain, format_rag_prompt
from app.services.cendol_service import cendol_manager
from app.config.redis_config import get_cache, set_cache
import hashlib

router = APIRouter()

class QueryRequest(BaseModel):
    user_id: str
    query: str

@router.post("/query")
async def query_rag(request: QueryRequest):
    # 1. Check Redis Cache
    cache_key = f"rag:{hashlib.md5(request.query.encode()).hexdigest()}"
    cached_res = get_cache(cache_key)
    if cached_res:
        return {"answer": cached_res, "source": "cache"}

    # 2. Retrieve context from ChromaDB
    retriever = get_rag_chain()
    docs = retriever.invoke(request.query)
    context = "\n".join([doc.page_content for doc in docs])
    
    if not context:
        return {"answer": "Maaf, saya tidak menemukan regulasi yang relevan di pangkalan data kami."}

    # 3. Format prompt and generate response via Cendol NLP
    prompt = format_rag_prompt(request.query, context)
    answer = cendol_manager.generate_response(prompt)

    # 4. Save to Cache (1 hour)
    set_cache(cache_key, answer)

    return {
        "answer": answer,
        "context_used": [doc.metadata.get("source") for doc in docs],
        "source": "cendol_nlp"
    }
