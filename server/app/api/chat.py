"""
Chatbot RAG Route — Main AI assistant endpoint.
Orchestrates dialog, intent detection, RAG retrieval, and CendolNLP response generation.
Supports all modules: Dry Run, Nego Coach, Smart Calendar, Post-Export Solver, and general QA.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.middleware import get_current_user
from app.services.rag_service import query_regulations, generate_rag_response
from app.services.cendol_service import CendolNLPService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context_data: dict = {}


class ChatResponse(BaseModel):
    reply: str
    detected_intent: str
    referenced_sources: str
    # AI Transparency metadata
    ai_metadata: Dict[str, Any] = {}
    inference_id: str = ""


@router.post("/send", response_model=ChatResponse)
def process_chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Main chatbot endpoint. Processes user messages through:
    1. Intent classification
    2. RAG context retrieval from ChromaDB
    3. Response generation via CendolNLP (with fallback)
    4. Returns AI transparency metadata alongside the answer
    """
    try:
        user_message = req.message

        # 1. Classify intent
        intent = CendolNLPService.classify_intent(user_message)

        # 2. Generate response — now returns dict with ai_metadata
        result = CendolNLPService.generate_response(
            user_message, context="", module="chat"
        )

        # Extract answer and metadata from result dict
        reply = result.get("answer", "")
        ai_metadata = {k: v for k, v in result.items() if k != "answer"}
        inference_id = result.get("inference_id", "")

        # 3. Dynamic official clickable source links
        sources = _get_official_sources(intent, user_message)

        return ChatResponse(
            reply=reply,
            detected_intent=intent,
            referenced_sources=sources,
            ai_metadata=ai_metadata,
            inference_id=inference_id,
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            reply="Maaf, terjadi gangguan sementara. Silakan coba lagi atau reformulasi pertanyaan Anda.",
            detected_intent="error",
            referenced_sources="[Portal INSW](https://insw.go.id) | [Kemendag RI](https://kemendag.go.id)",
            ai_metadata={"ai_tier": "error", "confidence": 0.0},
            inference_id="",
        )


def _get_official_sources(intent: str, text: str) -> str:
    """Return clickable Markdown links to official Indonesian trade portals."""
    t = text.lower()
    if any(k in t for k in ["hs code", "tarif", "bea", "cukai", "peb", "pabean"]):
        return "[Portal INSW](https://insw.go.id) | [Bea Cukai RI](https://customs.go.id) | [Kemenkeu BTKI](https://bctemas.beacukai.go.id)"
    elif any(k in t for k in ["pasar", "market", "peluang", "comtrade", "gap", "impor"]):
        return "[UN COMTRADE Database](https://comtradeplus.un.org) | [InaExport Kemendag](https://inaexport.id) | [Kementerian Perdagangan](https://kemendag.go.id)"
    elif any(k in t for k in ["bpom", "makanan", "halal", "karantina", "phytosanitary", "kesehatan"]):
        return "[BPOM RI](https://pom.go.id) | [Karantina Pertanian](https://karantina.pertanian.go.id) | [BPJPH Halal](https://halal.go.id)"
    elif any(k in t for k in ["rcep", "ijepa", "acfta", "fta", "ska", "form e", "form d"]):
        return "[Portal SKA Kemendag](https://e-ska.kemendag.go.id) | [Perjanjian Dagang RI](https://ditjenppi.kemendag.go.id) | [INSW Portal](https://insw.go.id)"
    else:
        return "[Portal INSW](https://insw.go.id) | [Kementerian Perdagangan RI](https://kemendag.go.id) | [InaExport](https://inaexport.id) | [Bea Cukai RI](https://customs.go.id)"
