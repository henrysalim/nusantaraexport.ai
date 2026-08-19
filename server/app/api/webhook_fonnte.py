"""
Webhook Fonnte — Terima pesan WhatsApp masuk dari Fonnte Gateway.
Endpoint: POST /api/webhook/fonnte

Alur filter:
1. Abaikan pesan outgoing (dari bot sendiri)
2. Deduplication — cegah Fonnte retry dikirim 2x
3. Filter sistem message Fonnte
4. Trigger WAJIB mengandung "nusantaraexport.ai" untuk memulai sesi baru
5. Setelah sesi aktif, semua pesan dari nomor itu dibalas selama 2 jam
6. Per-sender lock — 1 pertanyaan = 1 jawaban, tidak bisa proses concurrent
"""
import logging
import time
import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from typing import Dict, Set

from app.services.fonnte_service import send_whatsapp_message
from app.services.cendol_service import CendolNLPService

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Session store (phone → last_active_timestamp) ──────────────────────────
ACTIVE_SESSIONS: Dict[str, float] = {}
SESSION_TTL_SECONDS = 300  # 5 menit tidak ada obrolan → sesi otomatis berakhir

# ── Deduplication cache (cegah Fonnte retry spam) ──────────────────────────
PROCESSED_MESSAGES: Dict[str, float] = {}
DEDUP_TTL_SECONDS = 60  # abaikan pesan identik selama 60 detik

# ── Per-sender lock (1 pesan diproses sekaligus per nomor) ─────────────────
SENDER_LOCKS: Dict[str, asyncio.Lock] = {}

# ── Nomor device bot (diisi otomatis dari payload Fonnte) ───────────────────
_BOT_DEVICE_NUMBERS: Set[str] = set()

# ── Keyword TRIGGER untuk memulai sesi baru ─────────────────────────────────
# Seseorang HARUS menyebut "nusantaraexport.ai" (persis) untuk mengaktifkan bot.
TRIGGER_KEYWORD = "nusantaraexport.ai"

# ── Keyword ekspor untuk sesi lanjutan ───────────────────────────────────────
# Setelah sesi aktif, pesan lanjutan MASIH harus mengandung salah satu kata ini.
# Pesan pribadi murni ("halo", "sore", dll) tetap diabaikan meski sesi aktif.
EXPORT_CONTINUATION_KEYWORDS = [
    "ekspor", "export", "regulasi", "dokumen", "syarat", "hs code", "kode hs",
    "bea", "cukai", "karantina", "peb", "ska", "phytosanitary", "eudr", "rcep",
    "kopi", "kakao", "rotan", "batik", "furniture", "atsiri", "buyer", "harga",
    "kontainer", "lcl", "fcl", "incoterm", "fob", "cif", "nusantaraexport",
    "dagang", "pasar", "tarif", "sertifikat", "izin", "legalitas", "perizinan",
    "jepang", "china", "eropa", "amerika", "korea", "timur tengah", "asean"
]

# Perintah untuk menutup sesi
STOP_COMMANDS = {"stop", "selesai", "exit", "batal", "stop bot"}

# Pattern pesan sistem Fonnte yang harus diabaikan
SYSTEM_MESSAGE_PATTERNS = [
    "non-button message", "button message", "woaka message",
    "reaction message", "revoked", "deleted", "ephemeral",
    "sent via fonnte.com", "sent via fonnte",
]


# ── Helpers ─────────────────────────────────────────────────────────────────

def _clean_phone(phone: str) -> str:
    return "".join(filter(str.isdigit, str(phone)))


def _is_active_session(phone: str) -> bool:
    if phone not in ACTIVE_SESSIONS:
        return False
    if time.time() - ACTIVE_SESSIONS[phone] > SESSION_TTL_SECONDS:
        del ACTIVE_SESSIONS[phone]
        return False
    return True


def _update_session(phone: str):
    ACTIVE_SESSIONS[phone] = time.time()


def _end_session(phone: str):
    ACTIVE_SESSIONS.pop(phone, None)


def _get_sender_lock(phone: str) -> asyncio.Lock:
    if phone not in SENDER_LOCKS:
        SENDER_LOCKS[phone] = asyncio.Lock()
    return SENDER_LOCKS[phone]


def _is_duplicate(dedup_key: str) -> bool:
    now = time.time()
    # Bersihkan cache lama
    for k in [k for k, t in PROCESSED_MESSAGES.items() if now - t > DEDUP_TTL_SECONDS]:
        del PROCESSED_MESSAGES[k]
    if dedup_key in PROCESSED_MESSAGES:
        return True
    PROCESSED_MESSAGES[dedup_key] = now
    return False


# ── Webhook handler ─────────────────────────────────────────────────────────

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
        logger.error(f"Webhook Fonnte parse error: {e}")
        return JSONResponse({"status": "error", "message": "Failed to parse payload"}, status_code=400)

    sender    = data.get("sender", "")
    message   = data.get("message", "")
    name      = data.get("name", "User")
    msg_type  = data.get("type", "text")
    device    = data.get("device", "")
    timestamp = data.get("timestamp", "")

    # ── Guard: sender & message wajib ada ───────────────────────────────────
    if not sender or not message:
        return JSONResponse({"status": "ignored", "reason": "missing_sender_or_message"})

    clean_sender = _clean_phone(sender)
    clean_device = _clean_phone(device) if device else ""

    # ── Catat nomor device bot ───────────────────────────────────────────────
    if clean_device:
        _BOT_DEVICE_NUMBERS.add(clean_device)

    # ── Filter 1: Pesan OUTGOING (dari bot itu sendiri) ─────────────────────
    if clean_device and clean_sender == clean_device:
        logger.debug(f"🔕 Outgoing diabaikan ({clean_sender})")
        return JSONResponse({"status": "ignored", "reason": "outgoing_message"})
    if clean_sender in _BOT_DEVICE_NUMBERS:
        logger.debug(f"🔕 Outgoing dari cache device ({clean_sender})")
        return JSONResponse({"status": "ignored", "reason": "outgoing_message"})

    # ── Filter 2: Deduplication (cegah Fonnte retry) ─────────────────────────
    dedup_key = f"{clean_sender}:{timestamp}:{str(message)[:80]}"
    if _is_duplicate(dedup_key):
        logger.info(f"⏭️  Duplikat diabaikan dari {clean_sender}")
        return JSONResponse({"status": "ignored", "reason": "duplicate_message"})

    msg_lower = str(message).strip().lower()

    # ── Filter 3: Sistem message Fonnte ─────────────────────────────────────
    if any(pat in msg_lower for pat in SYSTEM_MESSAGE_PATTERNS):
        logger.debug(f"🤖 Sistem message diabaikan: {message!r}")
        return JSONResponse({"status": "ignored", "reason": "system_message"})

    # ── Filter 4: Pesan terlalu pendek ──────────────────────────────────────
    if len(msg_lower.strip()) < 3:
        return JSONResponse({"status": "ignored", "reason": "too_short"})

    logger.info(f"📥 Diterima dari {name} ({clean_sender}): {message!r}")

    is_active = _is_active_session(clean_sender)

    # ── Perintah stop sesi ───────────────────────────────────────────────────
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

    # ── Filter 5: Cek trigger & kelanjutan sesi ─────────────────────────────
    has_trigger  = TRIGGER_KEYWORD in msg_lower  # harus sebut "nusantaraexport.ai"
    has_export_kw = any(kw in msg_lower for kw in EXPORT_CONTINUATION_KEYWORDS)

    if not is_active:
        # Belum ada sesi → WAJIB ada trigger keyword
        if not has_trigger:
            logger.info(f"🙈 Diabaikan ({clean_sender}) — tidak ada trigger 'nusantaraexport.ai'")
            return JSONResponse({"status": "ignored", "reason": "no_trigger_keyword"})
    else:
        # Sesi aktif → tetap harus ada kata kunci ekspor ATAU menyebut nusantaraexport.ai
        if not has_trigger and not has_export_kw:
            logger.info(f"🙈 Sesi aktif tapi pesan pribadi dari {clean_sender}, diabaikan")
            return JSONResponse({"status": "ignored", "reason": "personal_chat_in_session"})

    # ── Per-sender lock: 1 pertanyaan = 1 jawaban ────────────────────────────
    lock = _get_sender_lock(clean_sender)
    if lock.locked():
        logger.info(f"⏳ Masih memproses pesan sebelumnya untuk {clean_sender}, diabaikan")
        return JSONResponse({"status": "ignored", "reason": "already_processing"})

    async with lock:
        _update_session(clean_sender)

        # ── Susun balasan AI ─────────────────────────────────────────────────
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

        # ── Kirim balasan ────────────────────────────────────────────────────
        try:
            resp = await send_whatsapp_message(sender, ai_reply)
            logger.info(f"✅ Terkirim ke {clean_sender}")
        except Exception as e:
            logger.error(f"❌ Gagal kirim ke {clean_sender}: {e}")
            return JSONResponse({"status": "reply_failed", "error": str(e)})

    return JSONResponse({"status": "ok", "replied_to": clean_sender})
