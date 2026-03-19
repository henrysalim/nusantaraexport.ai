from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import rag, market, umkm, docs
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NusantaraExport.AI API", version="2.0.0")

# CORS Configuration
# Set ALLOWED_ORIGINS env var as comma-separated list in production, e.g.:
# "https://nusantaraexport-ai.vercel.app,https://*.vercel.app"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to NusantaraExport.AI API (FastAPI)"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "features": ["RAG", "Market Gap", "PDF Generation"]
    }

# Include routers
app.include_router(umkm.router, prefix="/api/umkm", tags=["UMKM"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(docs.router, prefix="/api/docs", tags=["Documents"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8081, reload=True)
