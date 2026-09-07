"""
NusantaraExport.AI — FastAPI Backend Engine
Compliance Autopilot for Indonesian UMKM Export
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import rag, market, umkm, docs, chat, simulator, compliance, auth, community
from app.api import marketplace, webhook_fonnte, ai_transparency
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
    version="2.3.0"
)

# Attach limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

HARDCODED_ORIGINS = [
    "https://nusantaraexportai.id",
    "https://www.nusantaraexportai.id",
    "https://nusantaraexport-ai.vercel.app",
    "https://nusantaraexport-ai-server.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_env_origins = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]
_origins = list(set(HARDCODED_ORIGINS + _env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"^https?://(.*\.)?(nusantaraexportai\.id|vercel\.app|localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Set-Cookie"],
)


@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Fallback handler for CORS preflight OPTIONS requests."""
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=200,
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-Requested-With, X-CSRF-Token, Origin",
            "Access-Control-Max-Age": "86400",
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler ensuring all 500 errors include proper CORS headers
    so the browser never misinterprets internal server errors as CORS violations.
    """
    logger.error(f"Global unhandled error at {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": "Terjadi kesalahan internal server.", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.on_event("startup")
async def startup_event():
    """Bootstrap ChromaDB, document tables, and verify auth database on startup."""
    logger.info("Starting NusantaraExport.AI Backend...")

    # Bootstrap ChromaDB
    try:
        bootstrap_regulations()
        logger.info("✅ ChromaDB regulation data ready.")
    except Exception as e:
        logger.warning(f"ChromaDB bootstrap warning: {e}")

    # Bootstrap Document Generator table
    try:
        docs.bootstrap_export_documents_table()
    except Exception as e:
        logger.warning(f"Export documents bootstrap warning: {e}")

    # Verify auth database connection
    try:
        from app.config.db_config import get_auth_db_connection
        conn = get_auth_db_connection()
        if conn:
            conn.close()
            logger.info("✅ Auth database (PostgreSQL port 5432) connected.")
    except Exception as e:
        logger.warning(f"⚠️ Auth database not available: {e}")

    logger.info("✅ NusantaraExport.AI Backend v2.3 is ready!")


@app.get("/")
async def root():
    return {
        "message": "Welcome to NusantaraExport.AI API (FastAPI)",
        "status": "Online",
        "version": "2.3.0",
        "rag_vector_db": "ChromaDB Ready",
        "nlp_engine": "Cendol NLP + Fallback Active",
        "auth": "JWT Authentication Active"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.3.0",
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
            "B2B Community Forum",
            "Marketplace UMKM (Real DB)",
            "WhatsApp Bot (Fonnte)"
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
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(webhook_fonnte.router, prefix="/api/webhook", tags=["WhatsApp Webhook"])
app.include_router(ai_transparency.router, prefix="/api/ai/transparency", tags=["AI Transparency"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8081, reload=True, log_level="info")
