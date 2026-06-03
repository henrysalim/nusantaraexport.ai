"""
NusantaraExport.AI — FastAPI Backend Engine
Compliance Autopilot for Indonesian UMKM Export
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import rag, market, umkm, docs, chat, simulator, compliance
from app.services.vector_store import bootstrap_regulations
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NusantaraExport.AI API",
    description="Compliance Autopilot berbasis Cendol NLP & ChromaDB untuk UMKM Indonesia",
    version="2.1.0"
)

# CORS Configuration
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Bootstrap ChromaDB with regulation data on first run."""
    logger.info("Starting NusantaraExport.AI Backend...")
    try:
        bootstrap_regulations()
        logger.info("✅ ChromaDB regulation data ready.")
    except Exception as e:
        logger.warning(f"ChromaDB bootstrap warning: {e}")
    logger.info("✅ NusantaraExport.AI Backend is ready!")


@app.get("/")
async def root():
    return {
        "message": "Welcome to NusantaraExport.AI API (FastAPI)",
        "status": "Online",
        "version": "2.1.0",
        "rag_vector_db": "ChromaDB Ready",
        "nlp_engine": "Cendol NLP + Fallback Active"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.1.0",
        "features": [
            "RAG (ChromaDB)",
            "AI Chatbot (Cendol NLP + Fallback)",
            "Export Readiness Simulator",
            "Dry Run Checkpoint Simulator",
            "Nego Coach",
            "Smart Export Calendar",
            "Post-Export Problem Solver",
            "Market Gap Analysis",
            "Packaging Compliance Checker",
            "HS Code & FTA Optimizer",
            "PDF Document Generator"
        ]
    }


# Include all routers
app.include_router(chat.router, prefix="/api/chatbot", tags=["AI Chatbot"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(umkm.router, prefix="/api/umkm", tags=["UMKM"])
app.include_router(docs.router, prefix="/api/docs", tags=["Documents"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8081, reload=True)
