"""
Calendar Service — Real-time export planning calendar powered by Gemini 3.1 Flash Lite.
Generates customized seasonal harvest, demand, logistics, and document milestones
based on the commodity type and destination country.
"""
import json
import logging
import os
import re
from typing import Optional

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.1-flash-lite"


def _get_gemini_key() -> Optional[str]:
    key = os.getenv("GEMINI_API_KEY", "").strip('"').strip("'")
    return key if key else None


def _call_gemini(prompt: str, max_tokens: int = 1500) -> Optional[str]:
    key = _get_gemini_key()
    if not key:
        return None
    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            }
        }
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini call failed in calendar_service: {e}")
        return None


def generate_export_calendar(commodity: str, destination: str) -> dict:
    """
    Generate custom export calendar timeline and key deadlines via Gemini.
    """
    prompt = f"""You are a senior logistics consultant and agricultural trade analyst for Indonesian exports.
Generate a comprehensive annual export calendar for:
  - Commodity: "{commodity}"
  - Destination Country: "{destination}"

Consider the typical harvest seasons or production times in Indonesia for this item, shipping transit time to {destination}, trade compliance deadlines, and seasonal purchasing cycles/holidays in {destination} (e.g., peak demand seasons).

Your response must be a JSON object with this exact structure:
{{
  "best_shipping_window": "Summarize the optimal months/season to ship (e.g., 'August-September (Pre-Christmas window)') with a brief Indonesian explanation",
  "key_deadlines": [
    {{
      "deadline": "Name of document/milestone (e.g., 'Phytosanitary Certificate', 'Sertifikat Fumigasi', 'Booking Kontainer')",
      "rule": "Explanation of timeline rule (e.g., 'Diajukan maks. 7 hari sebelum kapal berangkat') in Indonesian",
      "priority": "high" or "medium" or "low"
    }}
  ],
  "calendar": [
    {{
      "month": "Month range or name (e.g., 'Januari' or 'Maret-April')",
      "events": [
        {{
          "type": "demand" or "harvest" or "logistics" or "doc",
          "title": "Title of the calendar event",
          "desc": "Detail of the event in Indonesian (e.g., 'Panen raya kopi gayo dimulai di Aceh')",
          "priority": "high" or "medium" or "low"
        }}
      ]
    }}
  ]
}}

Provide 4 to 6 monthly milestones in the "calendar" array covering the entire year, with 1-2 events each. Make sure the event types map correctly. Translate all titles and descriptions to clean, professional Indonesian.
Respond ONLY with valid JSON."""

    raw = _call_gemini(prompt)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            data = json.loads(raw)
            # Basic structural validation
            if "best_shipping_window" in data and "key_deadlines" in data and "calendar" in data:
                return data
        except Exception as e:
            logger.warning(f"Failed to parse calendar json: {e}")

    # Fallback to local default calendar logic if Gemini fails
    logger.info("Using local fallback calendar database.")
    return get_fallback_calendar(commodity, destination)


def get_fallback_calendar(commodity: str, destination: str) -> dict:
    """Offline calendar generator."""
    comm = commodity.lower()
    
    # Deadlines default
    key_deadlines = [
        {"deadline": "Surat Keterangan Asal (SKA)", "rule": "Diajukan maks. 3-7 hari setelah kapal berangkat untuk klaim tarif FTA", "priority": "high"},
        {"deadline": "Pemberitahuan Ekspor Barang (PEB)", "rule": "Diajukan paling lambat 7 hari sebelum kapal berangkat", "priority": "high"},
        {"deadline": "Booking Kontainer (FCL/LCL)", "rule": "Minimal 14 hari sebelum target pelayaran demi ketersediaan ruang", "priority": "medium"},
    ]
    
    if any(w in comm for w in ["kopi", "cokelat", "rempah", "makanan"]):
        key_deadlines.append({"deadline": "Phytosanitary Certificate", "rule": "Wajib diterbitkan Badan Karantina Pertanian sebelum keberangkatan", "priority": "high"})
    elif any(w in comm for w in ["kayu", "furniture", "rotan"]):
        key_deadlines.append({"deadline": "Dokumen V-Legal (FLEGT)", "rule": "Sertifikat legalitas kayu wajib ada sebelum custom clearance", "priority": "high"})
        key_deadlines.append({"deadline": "Sertifikat Fumigasi", "rule": "Fumigasi kontainer maks. 15 hari sebelum sailing", "priority": "medium"})

    # Best shipping window
    if "kopi" in comm:
        best_window = "September-Oktober (Selesai panen raya Gayo/Java, persediaan siap untuk pasar global)"
    elif "rempah" in comm:
        best_window = "Maret-April (Awal musim kemarau pengeringan optimal) & September-Oktober"
    elif "kayu" in comm or "furniture" in comm:
        best_window = "Juli-September (Aman dari kelembapan tinggi, produksi musim panas matang)"
    else:
        best_window = "Agustus-Oktober (Menjelang peak season Q4 akhir tahun)"

    # Annual steps
    calendar = [
        {
            "month": "Januari-Februari",
            "events": [
                {"type": "doc", "title": "Audit Dokumen Tahunan", "desc": "Pastikan NIB, NPWP, dan registrasi ekspor terupdate.", "priority": "medium"},
                {"type": "demand", "title": "Imlek & Awal Tahun", "desc": f"Permintaan untuk {commodity} stabil. Pengiriman awal tahun.", "priority": "medium"}
            ]
        },
        {
            "month": "Maret-April",
            "events": [
                {"type": "harvest", "title": "Awal Musim Panen / Produksi", "desc": f"Persiapan bahan baku {commodity} untuk musim ekspor utama.", "priority": "high"},
                {"type": "logistics", "title": "Booking Logistik Tengah Tahun", "desc": "Mulai membandingkan freight rate pelayaran internasional.", "priority": "low"}
            ]
        },
        {
            "month": "Mei-Juli",
            "events": [
                {"type": "harvest", "title": "Puncak Panen Raya / Produksi Maksimal", "desc": "Kualitas bahan baku terbaik didapatkan pada periode cuaca kering ini.", "priority": "high"}
            ]
        },
        {
            "month": "Agustus-Oktober",
            "events": [
                {"type": "logistics", "title": "Window Pengiriman Utama", "desc": f"Proses ekspor {commodity} ke {destination} untuk mengejar peak season akhir tahun.", "priority": "high"},
                {"type": "doc", "title": "Pengajuan Sertifikasi Khusus", "desc": f"Lengkapi Phytosanitary/SKA khusus negara tujuan {destination}.", "priority": "high"}
            ]
        },
        {
            "month": "November-Desember",
            "events": [
                {"type": "demand", "title": "Peak Season Natal & Tahun Baru", "desc": f"Puncak konsumsi {commodity} di {destination}. Harga jual biasanya di titik tertinggi.", "priority": "high"}
            ]
        }
    ]

    return {
        "best_shipping_window": best_window,
        "key_deadlines": key_deadlines,
        "calendar": calendar
    }
