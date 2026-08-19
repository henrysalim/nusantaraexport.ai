"""
Fonnte WhatsApp Service — Kirim pesan WhatsApp via Fonnte API Gateway.
Docs: https://fonnte.com/docs
"""
import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

FONNTE_API_URL = "https://api.fonnte.com/send"
FONNTE_TOKEN = os.getenv("FONNTE_TOKEN", "")


async def send_whatsapp_message(target: str, message: str) -> dict:
    """
    Kirim pesan WhatsApp via Fonnte API.

    Args:
        target: Nomor HP tujuan (contoh: "628123456789")
        message: Teks pesan yang akan dikirim

    Returns:
        dict respons dari Fonnte API

    Raises:
        RuntimeError: Jika FONNTE_TOKEN tidak dikonfigurasi atau request gagal
    """
    if not FONNTE_TOKEN:
        logger.error("FONNTE_TOKEN tidak dikonfigurasi di .env")
        raise RuntimeError("FONNTE_TOKEN belum dikonfigurasi. Set di file .env server.")

    # Pastikan format nomor: hilangkan karakter non-angka
    clean_target = "".join(filter(str.isdigit, target))
    if not clean_target:
        raise ValueError(f"Nomor target tidak valid: {target}")

    payload = {
        "target": clean_target,
        "message": message,
        "countryCode": "62",  # Indonesia default
    }

    headers = {
        "Authorization": FONNTE_TOKEN,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(FONNTE_API_URL, data=payload, headers=headers)

        resp_data = resp.json()
        if resp.status_code != 200 or not resp_data.get("status"):
            reason = resp_data.get("reason", resp.text)
            logger.error(f"Fonnte API error: {reason} (HTTP {resp.status_code})")
            raise RuntimeError(f"Fonnte API gagal: {reason}")

        logger.info(f"✅ WhatsApp terkirim ke {clean_target}: {message[:50]}...")
        return resp_data

    except httpx.TimeoutException:
        logger.error("Fonnte API timeout setelah 15 detik")
        raise RuntimeError("Fonnte API timeout. Coba lagi beberapa saat.")
    except httpx.RequestError as exc:
        logger.error(f"Fonnte network error: {exc}")
        raise RuntimeError(f"Koneksi ke Fonnte gagal: {exc}")


def send_whatsapp_message_sync(target: str, message: str) -> dict:
    """
    Sinkron wrapper untuk send_whatsapp_message (gunakan di non-async context).
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Jika sudah dalam event loop (FastAPI), gunakan httpx sync
            return _send_sync(target, message)
        return loop.run_until_complete(send_whatsapp_message(target, message))
    except RuntimeError:
        return _send_sync(target, message)


def _send_sync(target: str, message: str) -> dict:
    """httpx sinkron fallback."""
    if not FONNTE_TOKEN:
        raise RuntimeError("FONNTE_TOKEN belum dikonfigurasi.")

    clean_target = "".join(filter(str.isdigit, target))
    payload = {"target": clean_target, "message": message, "countryCode": "62"}
    headers = {"Authorization": FONNTE_TOKEN}

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(FONNTE_API_URL, data=payload, headers=headers)

    resp_data = resp.json()
    if resp.status_code != 200 or not resp_data.get("status"):
        reason = resp_data.get("reason", resp.text)
        raise RuntimeError(f"Fonnte API gagal: {reason}")

    return resp_data
