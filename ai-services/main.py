"""
NusantaraExport.AI — AI Services (FastAPI)
==========================================
Entry point untuk semua layanan AI: ASR, TTS, HS Code, Market Gap, LLM.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv(dotenv_path="../.env")

app = FastAPI(
    title="NusantaraExport.AI — AI Services",
    description="Layanan AI: Whisper ASR, TTS, HS Code Classifier, Market Gap Scorer, LLM RAG",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "NusantaraExport.AI AI Services", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# --- Import & register routers (akan diaktifkan saat modul dikembangkan) ---
# from asr.router import router as asr_router
# from tts.router import router as tts_router
# from hs_code.router import router as hs_code_router
# from market_gap.router import router as market_gap_router
# from llm.router import router as llm_router
#
# app.include_router(asr_router, prefix="/asr", tags=["ASR"])
# app.include_router(tts_router, prefix="/tts", tags=["TTS"])
# app.include_router(hs_code_router, prefix="/hs-code", tags=["HS Code"])
# app.include_router(market_gap_router, prefix="/market-gap", tags=["Market Gap"])
# app.include_router(llm_router, prefix="/llm", tags=["LLM"])
