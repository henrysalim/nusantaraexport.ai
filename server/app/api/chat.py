"""
Chatbot RAG Route — Main AI assistant endpoint.
Orchestrates dialog, intent detection, RAG retrieval, and CendolNLP response generation.
Supports all modules: Dry Run, Nego Coach, Smart Calendar, Post-Export Solver, and general QA.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
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


@router.post("/send", response_model=ChatResponse)
def process_chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Main chatbot endpoint. Processes user messages through:
    1. Intent classification
    2. RAG context retrieval from ChromaDB
    3. Response generation via CendolNLP (with fallback)
    """
    try:
        user_message = req.message

        # 1. Classify intent
        intent = CendolNLPService.classify_intent(user_message)

        # 2. Retrieve regulation context via RAG
        rag_context = query_regulations(user_message)

        # 3. Generate response using CendolNLP (with auto-fallback)
        reply = CendolNLPService.generate_response(user_message, rag_context)

        # 4. Format referenced sources
        sources = rag_context if rag_context else "Fallback AI Engine (Rule-based)"

        return ChatResponse(
            reply=reply,
            detected_intent=intent,
            referenced_sources=sources
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Even on error, return a useful response instead of crashing
        return ChatResponse(
            reply="Maaf, terjadi gangguan sementara. Silakan coba lagi atau reformulasi pertanyaan Anda.",
            detected_intent="error",
            referenced_sources="System fallback"
        )
