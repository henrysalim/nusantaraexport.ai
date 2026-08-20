"""
Webhook Fonnte — Terima pesan WhatsApp masuk dari Fonnte Gateway.
Endpoint: POST /api/webhook/fonnte

Session & deduplication menggunakan Upstash Redis (HTTP-based, kompatibel Vercel serverless).

Alur filter:
1. Abaikan pesan outgoing (dari bot sendiri)
2. Deduplication — cegah Fonnte retry dikirim 2x
3. Filter sistem message Fonnte
4. Trigger WAJIB mengandung "nusantaraexport.ai" untuk memulai sesi baru
5. Setelah sesi aktif, pesan ekspor lanjutan tetap dibalas selama 5 menit
6. Distributed lock via Redis — 1 pertanyaan = 1 jawaban
"""
import logging
import os
import json
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from typing import Set

from app.services.fonnte_service import send_whatsapp_message
from app.services.cendol_service import CendolNLPService

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Upstash Redis (HTTP-based, works on Vercel serverless) ───────────────────
def _get_redis():
    """Lazy-load Upstash Redis client."""
    from upstash_redis import Redis
    return Redis(
        url=os.getenv("UPSTASH_REDIS_REST_URL", "").strip().strip('"'),
        token=os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip().strip('"'),
    )

SESSION_TTL_SECONDS   = 300   # 5 menit tidak ada obrolan → sesi berakhir
DEDUP_TTL_SECONDS     = 60    # abaikan pesan identik selama 60 detik
LOCK_TTL_SECONDS      = 30    # max waktu proses satu pesan

# ── Nomor device bot (in-memory ok, hanya untuk filter outgoing) ─────────────
_BOT_DEVICE_NUMBERS: Set[str] = set()

# ── Keyword TRIGGER — WAJIB sebut "nusantaraexport.ai" untuk buka sesi ───────
TRIGGER_KEYWORD = "nusantaraexport.ai"

# ── Keyword ekspor untuk sesi lanjutan ───────────────────────────────────────
EXPORT_CONTINUATION_KEYWORDS = [
    "ekspor", "export", "regulasi", "dokumen", "syarat", "hs code", "kode hs",
    "bea", "cukai", "karantina", "peb", "ska", "phytosanitary", "eudr", "rcep",
    "kopi", "kakao", "rotan", "batik", "furniture", "atsiri", "buyer", "harga",
    "kontainer", "lcl", "fcl", "incoterm", "fob", "cif", "nusantaraexport",
    "dagang", "pasar", "tarif", "sertifikat", "izin", "legalitas", "perizinan",
    "jepang", "china", "eropa", "amerika", "korea", "timur tengah", "asean"
]

STOP_COMMANDS = {"stop", "selesai", "exit", "batal", "stop bot"}

SYSTEM_MESSAGE_PATTERNS = [
    "non-button message", "button message", "woaka message",
    "reaction message", "revoked", "deleted", "ephemeral",
    "sent via fonnte.com", "sent via fonnte",
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _clean_phone(phone: str) -> str:
    return "".join(filter(str.isdigit, str(phone)))


def _is_active_session(phone: str) -> bool:
    try:
        r = _get_redis()
        return r.exists(f"wa:session:{phone}") == 1
    except Exception as e:
        logger.warning(f"Redis session check error: {e}")
        return False


def _update_session(phone: str):
    try:
        r = _get_redis()
        r.set(f"wa:session:{phone}", "1", ex=SESSION_TTL_SECONDS)
    except Exception as e:
        logger.warning(f"Redis session update error: {e}")


def _end_session(phone: str):
    try:
        r = _get_redis()
        r.delete(f"wa:session:{phone}")
    except Exception as e:
        logger.warning(f"Redis session delete error: {e}")


def _is_duplicate(dedup_key: str) -> bool:
    """Return True jika pesan sudah diproses (duplikat Fonnte retry)."""
    try:
        r = _get_redis()
        # SET NX = hanya set jika belum ada. None = sudah ada = duplikat
        result = r.set(f"wa:dedup:{dedup_key}", "1", ex=DEDUP_TTL_SECONDS, nx=True)
        return result is None
    except Exception as e:
        logger.warning(f"Redis dedup error: {e}")
        return False


def _acquire_lock(phone: str) -> bool:
    """Return True jika berhasil dapat lock (tidak sedang diproses)."""
    try:
        r = _get_redis()
        result = r.set(f"wa:lock:{phone}", "1", ex=LOCK_TTL_SECONDS, nx=True)
        return result is not None
    except Exception as e:
        logger.warning(f"Redis lock acquire error: {e}")
        return True  # fallback: anggap tidak ada lock


def _release_lock(phone: str):
    try:
        r = _get_redis()
        r.delete(f"wa:lock:{phone}")
    except Exception as e:
        logger.warning(f"Redis lock release error: {e}")


# ── Webhook Handler ───────────────────────────────────────────────────────────

@router.post("/fonnte")
async def receive_fonnte_message(request: Request):
    """
    Terima webhook dari Fonnte.
    Mendukung JSON payload & Form data sesuai Fonnte Webhook Specification.
    """
    # ── Parse payload ────────────────────────────────────────────────────────
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
        logger.error(f"Webhook parse error: {e}")
        return JSONResponse({"status": "error", "message": "Failed to parse payload"}, status_code=400)

    sender    = data.get("sender", "")
    message   = data.get("message", "")
    name      = data.get("name", "User")
    msg_type  = data.get("type", "text")
    device    = data.get("device", "")
    timestamp = data.get("timestamp", "")

    # ── Guard: sender & message wajib ada ────────────────────────────────────
    if not sender or not message:
        return JSONResponse({"status": "ignored", "reason": "missing_sender_or_message"})

    clean_sender = _clean_phone(sender)
    clean_device = _clean_phone(device) if device else ""

    # ── Catat nomor device bot ────────────────────────────────────────────────
    if clean_device:
        _BOT_DEVICE_NUMBERS.add(clean_device)

    # ── Filter 1: Pesan OUTGOING (dari bot sendiri) ───────────────────────────
    if clean_device and clean_sender == clean_device:
        logger.debug(f"🔕 Outgoing diabaikan ({clean_sender})")
        return JSONResponse({"status": "ignored", "reason": "outgoing_message"})
    if clean_sender in _BOT_DEVICE_NUMBERS:
        logger.debug(f"🔕 Outgoing dari device cache ({clean_sender})")
        return JSONResponse({"status": "ignored", "reason": "outgoing_message"})

    # ── Filter 2: Deduplication (cegah Fonnte retry) ─────────────────────────
    dedup_key = f"{clean_sender}:{timestamp}:{str(message)[:80]}"
    if _is_duplicate(dedup_key):
        logger.info(f"⏭️  Duplikat diabaikan dari {clean_sender}")
        return JSONResponse({"status": "ignored", "reason": "duplicate_message"})

    msg_lower = str(message).strip().lower()

    # ── Filter 3: Sistem message Fonnte ──────────────────────────────────────
    if any(pat in msg_lower for pat in SYSTEM_MESSAGE_PATTERNS):
        logger.debug(f"🤖 Sistem message diabaikan: {message!r}")
        return JSONResponse({"status": "ignored", "reason": "system_message"})

    # ── Filter 4: Pesan terlalu pendek ───────────────────────────────────────
    if len(msg_lower.strip()) < 3:
        return JSONResponse({"status": "ignored", "reason": "too_short"})

    logger.info(f"📥 Diterima dari {name} ({clean_sender}): {message!r}")

    is_active = _is_active_session(clean_sender)

    # ── Perintah stop sesi ────────────────────────────────────────────────────
    if msg_lower in STOP_COMMANDS:
        if is_active:
            _end_session(clean_sender)
            goodbye = (
                "✅ Session konsultasi AI NusantaraExport.AI telah diakhiri.\n\n"
                "Terima kasih! Jika ada pertanyaan ekspor lagi, silakan sebut "
                "*nusantaraexport.ai* kapan saja. 🙏"
            )
            try:
                await send_whatsapp_message(sender, goodbye)
            except Exception as e:
                logger.error(f"Gagal kirim goodbye ke {clean_sender}: {e}")
        return JSONResponse({"status": "session_ended" if is_active else "ignored"})

    # ── Filter 5: Trigger & kelanjutan sesi ──────────────────────────────────
    has_trigger   = TRIGGER_KEYWORD in msg_lower
    has_export_kw = any(kw in msg_lower for kw in EXPORT_CONTINUATION_KEYWORDS)

    if not is_active:
        # Belum ada sesi → WAJIB ada "nusantaraexport.ai"
        if not has_trigger:
            logger.info(f"🙈 Diabaikan ({clean_sender}) — tidak ada trigger 'nusantaraexport.ai'")
            return JSONResponse({"status": "ignored", "reason": "no_trigger_keyword"})
    else:
        # Sesi aktif → tetap harus ada keyword ekspor ATAU menyebut nusantaraexport.ai
        if not has_trigger and not has_export_kw:
            logger.info(f"🙈 Sesi aktif tapi pesan pribadi dari {clean_sender}, diabaikan")
            return JSONResponse({"status": "ignored", "reason": "personal_chat_in_session"})

    # ── Distributed lock: 1 pertanyaan = 1 jawaban ───────────────────────────
    if not _acquire_lock(clean_sender):
        logger.info(f"⏳ Masih proses pesan sebelumnya untuk {clean_sender}")
        return JSONResponse({"status": "ignored", "reason": "already_processing"})

    try:
        _update_session(clean_sender)

        # ── Generate balasan AI ───────────────────────────────────────────────
        if msg_type in ("voice", "audio", "document", "image"):
            ai_reply = (
                "Halo! Saya asisten AI NusantaraExport.AI.\n\n"
                "Saat ini saya hanya dapat memproses pesan teks. "
                "Silakan tulis pertanyaan Anda tentang ekspor dalam bentuk teks ya 🙏"
            )
        else:
            try:
                logger.info(f"🤖 Memproses Gemini untuk {clean_sender}...")
                ai_reply = CendolNLPService.generate_response(message, context="")
                if "selesai" not in ai_reply.lower():
                    ai_reply += "\n\n💡 _(Ketik `selesai` untuk mengakhiri sesi bot)_"
            except Exception as e:
                logger.error(f"Error AI untuk {clean_sender}: {e}")
                ai_reply = (
                    "Maaf, terjadi gangguan sementara pada sistem AI. "
                    "Silakan coba beberapa saat lagi."
                )

        # ── Kirim balasan ─────────────────────────────────────────────────────
        try:
            await send_whatsapp_message(sender, ai_reply)
            logger.info(f"✅ Terkirim ke {clean_sender}")
        except Exception as e:
            logger.error(f"❌ Gagal kirim ke {clean_sender}: {e}")
            return JSONResponse({"status": "reply_failed", "error": str(e)})

    finally:
        _release_lock(clean_sender)

    return JSONResponse({"status": "ok", "replied_to": clean_sender})
