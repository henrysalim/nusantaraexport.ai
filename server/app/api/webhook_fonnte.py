"""
Webhook Fonnte — Terima pesan WhatsApp masuk dari Fonnte Gateway.
Endpoint: POST /api/webhook/fonnte
"""
import logging
import os
import time
import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict

from app.services.fonnte_service import send_whatsapp_message
from app.services.rag_service import query_regulations
from app.services.cendol_service import CendolNLPService

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory session store (phone_number -> last_active_timestamp)
ACTIVE_SESSIONS: Dict[str, float] = {}
SESSION_TTL_SECONDS = 7200

# Kata kunci luas seputar ekspor & perdagangan internasional
EXPORT_KEYWORDS = [
    "ekspor", "export", "regulasi", "dokumen", "syarat", "hs code", "kode hs",
    "bea", "cukai", "karantina", "peb", "ska", "phytosanitary", "eudr", "rcep",
    "kopi", "kakao", "rotan", "batik", "furniture", "atsiri", "buyer", "harga",
    "kontainer", "lcl", "fcl", "incoterm", "fob", "cif", "nusantara", "#ekspor",
    "kirim", "dagang", "pasar", "jepang", "china", "eropa", "amerika", "korea"
]


def _clean_phone(phone: str) -> str:
    """Format nomor HP jadi digit saja."""
    return "".join(filter(str.isdigit, str(phone)))


def _is_active_session(phone: str) -> bool:
    """Cek apakah nomor ini memiliki session bot aktif yang belum expired."""
    clean_p = _clean_phone(phone)
    if clean_p not in ACTIVE_SESSIONS:
        return False
    last_active = ACTIVE_SESSIONS[clean_p]
    if time.time() - last_active > SESSION_TTL_SECONDS:
        del ACTIVE_SESSIONS[clean_p]
        return False
    return True


def _update_session(phone: str):
    """Perbarui timestamp session aktif."""
    clean_p = _clean_phone(phone)
    ACTIVE_SESSIONS[clean_p] = time.time()


def _end_session(phone: str):
    """Hapus session aktif."""
    clean_p = _clean_phone(phone)
    if clean_p in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[clean_p]


@router.post("/fonnte")
async def receive_fonnte_message(request: Request):
    """
    Terima webhook dari Fonnte.
    Mendukung JSON payload & Form data sesuai Fonnte Webhook Specification.
    """
    data = {}
    try:
        raw_body = await request.body()
        if raw_body:
            try:
                data = json.loads(raw_body.decode("utf-8"))
            except Exception:
                form = await request.form()
                data = dict(form)
    except Exception as e:
        logger.error(f"Webhook Fonnte parse error: {e}")
        return JSONResponse({"status": "error", "message": "Failed to parse payload"}, status_code=400)

    sender   = data.get("sender", "")
    message  = data.get("message", "")
    name     = data.get("name", "User")
    msg_type = data.get("type", "text")

    if not sender or not message:
        logger.warning(f"⚠️ Webhook Fonnte diabaikan: missing sender ({sender!r}) or message ({message!r})")
        return JSONResponse({"status": "ignored", "reason": "missing_sender_or_message"})

    msg_lower = str(message).strip().lower()
    clean_sender = _clean_phone(sender)

    logger.info(f"📥 Webhook Fonnte DITERIMA dari {name} ({clean_sender}): {message!r}")

    # 1. Cek perintah stop session
    if msg_lower in ("stop", "selesai", "exit", "batal", "stop bot"):
        if _is_active_session(clean_sender):
            _end_session(clean_sender)
            goodbye = (
                "✅ Session konsultasi AI NusantaraExport.AI telah diakhiri.\n\n"
                "Terima kasih! Jika ada pertanyaan ekspor lagi, Anda bisa menghubungi kami "
                "kembali via website https://nusantaraexport.ai. 🙏"
            )
            try:
                await send_whatsapp_message(sender, goodbye)
            except Exception as e:
                logger.error(f"Gagal kirim pesan goodbye: {e}")
            return JSONResponse({"status": "session_ended"})
        return JSONResponse({"status": "ignored", "reason": "not_active"})

    # 2. Cek apakah pesan mengandung kata kunci ekspor
    is_trigger = any(kw in msg_lower for kw in EXPORT_KEYWORDS)
    is_active  = _is_active_session(clean_sender)

    # Jika pesan adalah sapaan awal umum (misal "halo", "selamat siang"), anggap sebagai pembuka ekspor
    if any(greet in msg_lower for greet in ["halo", "hi", "pagi", "siang", "sore", "malam", "assalamu"]):
        is_trigger = True

    # Filter Chat Pribadi murni (seperti "lagi dimana", "kuliah jam berapa")
    if not is_trigger and not is_active:
        logger.info(f"🙈 Chat pribadi murni dari {clean_sender} diabaikan (bukan tentang ekspor)")
        return JSONResponse({"status": "ignored", "reason": "personal_chat_ignored"})

    # Lolos filter → Update session aktif
    _update_session(clean_sender)

    # 3. Proses balasan AI (Gemini Flash RAG Engine)
    if msg_type in ("voice", "audio", "document", "image"):
        ai_reply = (
            "Halo! Saya asisten AI NusantaraExport.AI.\n\n"
            "Saat ini saya hanya dapat memproses pesan teks. "
            "Silakan tulis pertanyaan Anda tentang ekspor dalam bentuk teks ya 🙏"
        )
    else:
        try:
            logger.info(f"🤖 Memproses AI Gemini Flash-Lite (Fast Mode) untuk {clean_sender}...")
            ai_reply = CendolNLPService.generate_response(message, context="")

            if "selesai" not in ai_reply.lower():
                ai_reply += "\n\n💡 _(Ketik `selesai` kapan saja untuk mengakhiri session bot)_"

        except Exception as e:
            logger.error(f"Error AI RAG untuk WA {sender}: {e}")
            ai_reply = (
                "Maaf, terjadi gangguan sementara pada sistem AI. "
                "Silakan coba beberapa saat lagi."
            )

    # 4. Kirim balasan balik ke WhatsApp sender via Fonnte API Gateway
    try:
        resp = await send_whatsapp_message(sender, ai_reply)
        logger.info(f"✅ Balasan WA AI terkirim ke {clean_sender}: {resp}")
    except Exception as e:
        logger.error(f"❌ Gagal kirim balasan WA ke {clean_sender}: {e}")
        return JSONResponse({"status": "reply_failed", "error": str(e)})

    return JSONResponse({"status": "ok", "replied_to": clean_sender})
