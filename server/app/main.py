"""
NusantaraExport.AI — FastAPI Backend Engine
Compliance Autopilot for Indonesian UMKM Export
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import rag, market, umkm, docs, chat, simulator, compliance, auth, community
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

# Rate limiter (per IP)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="NusantaraExport.AI API",
    description="Compliance Autopilot berbasis Cendol NLP & ChromaDB untuk UMKM Indonesia",
    version="2.2.0"
)

# Attach limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://nusantaraexport-ai.vercel.app,https://nusantaraexport-ai.vercel.app/")
_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Bootstrap ChromaDB and verify auth database on startup."""
    logger.info("Starting NusantaraExport.AI Backend...")

    # Bootstrap ChromaDB
    try:
        bootstrap_regulations()
        logger.info("✅ ChromaDB regulation data ready.")
    except Exception as e:
        logger.warning(f"ChromaDB bootstrap warning: {e}")

    # Verify auth database connection
    try:
        from app.config.db_config import get_auth_db_connection
        conn = get_auth_db_connection()
        conn.close()
        logger.info("✅ Auth database (PostgreSQL port 5432) connected.")
    except Exception as e:
        logger.warning(f"⚠️ Auth database not available: {e}")

    logger.info("✅ NusantaraExport.AI Backend is ready!")


@app.get("/")
async def root():
    return {
        "message": "Welcome to NusantaraExport.AI API (FastAPI)",
        "status": "Online",
        "version": "2.2.0",
        "rag_vector_db": "ChromaDB Ready",
        "nlp_engine": "Cendol NLP + Fallback Active",
        "auth": "JWT Authentication Active"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.2.0",
        "features": [
            "JWT Authentication",
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
            "PDF Document Generator",
            "B2B Community Forum"
        ]
    }


# Include all routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chatbot", tags=["AI Chatbot"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(umkm.router, prefix="/api/umkm", tags=["UMKM"])
app.include_router(docs.router, prefix="/api/docs", tags=["Documents"])
app.include_router(community.router, prefix="/api/community", tags=["Community Forum"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8081, reload=True)

