"""
Readiness Service — Real-time export readiness & dry-run analysis.
Uses Gemini 3.1 Flash Lite to generate commodity- and destination-specific:
  - Required document checklists
  - Cost estimations in IDR
  - Full dry-run checkpoint journeys with realistic risk details
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


def _call_gemini(prompt: str, max_tokens: int = 1000) -> Optional[str]:
    key = _get_gemini_key()
    if not key:
        return None
    try:
        import requests
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.15,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }
        resp = requests.post(url, json=payload, timeout=25)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini call failed in readiness_service: {e}")
        return None


# ── REQUIRED DOCUMENTS ─────────────────────────────────────────────────────

def get_required_documents(commodity: str, destination: str, dest_code: str) -> list[str]:
    """
    Return a list of required export documents for this commodity + destination.
    Tries Gemini first, falls back to static table.
    """
    prompt = f"""You are an Indonesian export compliance expert. List the required export documents for:
  - Commodity: "{commodity}"
  - Destination: {destination} (country code: {dest_code})

Return a JSON array of document names (strings). Include:
  - Indonesia-side export docs (NIB, PEB, SKA/Certificate of Origin with correct FTA form, etc.)
  - Commodity-specific certificates (Phytosanitary, Health Cert, BPOM, Halal, SVLK/FLEGT, etc.)
  - Destination import requirements

Return ONLY a JSON array of strings, e.g.: ["NIB", "SKA Form IJEPA", "Phytosanitary Certificate", ...]
Order from most critical to least. Maximum 10 items."""

    raw = _call_gemini(prompt, max_tokens=300)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            docs = json.loads(raw)
            if isinstance(docs, list) and len(docs) >= 3:
                return [str(d) for d in docs[:10]]
        except Exception as e:
            logger.warning(f"Failed to parse required docs: {e}")

    # Fallback lookup
    return _fallback_docs(dest_code)


def _fallback_docs(dest_code: str) -> list[str]:
    TABLE = {
        "jp": ["NIB", "SKA Form IJEPA", "Phytosanitary Certificate", "ICO Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "cn": ["NIB", "SKA Form E (ACFTA)", "Phytosanitary Certificate", "Health Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "us": ["NIB", "FDA Registration", "Phytosanitary Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "de": ["NIB", "EUR.1 Movement Certificate", "Phytosanitary Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "au": ["NIB", "SKA AIFTA", "Biosecurity Import Permit", "Phytosanitary Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "kr": ["NIB", "SKA Form AK (AKFTA)", "Phytosanitary Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
        "sg": ["NIB", "SKA ASEAN", "Phytosanitary Certificate",
               "Commercial Invoice", "Packing List", "Bill of Lading"],
    }
    return TABLE.get(dest_code, TABLE["sg"])


# ── COST BREAKDOWN ──────────────────────────────────────────────────────────

def get_cost_breakdown(commodity: str, destination: str) -> dict:
    """
    Generate AI-estimated export cost breakdown (in IDR) for the commodity.
    """
    prompt = f"""You are an Indonesian export logistics consultant.
Estimate realistic export costs in Indonesian Rupiah (IDR) for:
  - Commodity: "{commodity}"
  - Destination: {destination}
  - Shipment: 1 FCL 20ft container (~5 tons), FOB basis

Return a JSON object:
{{
  "production": {{"label": "Biaya Produksi ({commodity})", "amount": "Rp XX.XXX.XXX"}},
  "freight": {{"label": "Freight FCL 20ft → {destination}", "amount": "Rp XX.XXX.XXX"}},
  "insurance": {{"label": "Asuransi Kargo (0.35%)", "amount": "Rp X.XXX.XXX"}},
  "docs": {{"label": "Pengurusan Dokumen & Sertifikasi", "amount": "Rp X.XXX.XXX"}},
  "customs": {{"label": "Handling & Clearance", "amount": "Rp X.XXX.XXX"}},
  "total": "Rp XXX.XXX.XXX"
}}

Use realistic 2024-2025 market rates. Respond ONLY with valid JSON."""

    raw = _call_gemini(prompt, max_tokens=400)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            data = json.loads(raw)
            required = ["production", "freight", "insurance", "docs", "customs", "total"]
            if all(k in data for k in required):
                return data
        except Exception as e:
            logger.warning(f"Failed to parse cost breakdown: {e}")

    # Deterministic fallback
    return _fallback_cost(commodity, destination)


def _fallback_cost(commodity: str, destination: str) -> dict:
    comm = commodity.lower()
    is_agri = any(w in comm for w in ["kopi", "cokelat", "kakao", "rempah", "teh", "singkong", "keripik", "kacang"])
    prod = "Rp 150.000.000" if is_agri else "Rp 85.000.000"
    total = "Rp 200.000.000" if is_agri else "Rp 130.000.000"
    return {
        "production": {"label": f"Biaya Produksi ({commodity})", "amount": prod},
        "freight": {"label": f"Freight FCL 20ft → {destination}", "amount": "Rp 35.000.000"},
        "insurance": {"label": "Asuransi Kargo (0.35%)", "amount": "Rp 3.500.000"},
        "docs": {"label": "Pengurusan Dokumen & Sertifikasi", "amount": "Rp 8.500.000"},
        "customs": {"label": "Handling & Clearance", "amount": "Rp 6.000.000"},
        "total": total,
    }


# ── CERTIFICATIONS ──────────────────────────────────────────────────────────

def get_certification_items(commodity: str, destination: str, dest_code: str) -> tuple[list, int]:
    """
    Return commodity+destination-specific certification checklist and a base score.
    Uses Gemini to generate items; falls back to static logic.
    """
    prompt = f"""You are an Indonesian export certification expert.
List the relevant certifications/quality standards to check for:
  - Commodity: "{commodity}"
  - Destination: {destination}

Return a JSON array of objects:
[
  {{"doc": "Certification name", "status": "pass" or "warning" or "fail", "note": "Short Indonesian explanation"}}
]

Include 3-5 relevant certifications. Common ones: BPOM, Halal MUI, Phytosanitary, SVLK/FLEGT, SNI, ICO, USDA Organic, EU Organic, destination-specific import standards.
Mark "pass" for universally required and easy ones, "warning" for ones that need attention or are commodity-specific.
Respond ONLY with valid JSON array."""

    raw = _call_gemini(prompt, max_tokens=400)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            items = json.loads(raw)
            if isinstance(items, list) and len(items) >= 2:
                score = sum(15 if i.get("status") == "pass" else 5 for i in items)
                score = min(score, 95)
                return items, score
        except Exception as e:
            logger.warning(f"Failed to parse cert items: {e}")

    # Fallback
    items = [
        {"doc": "BPOM / Food Safety", "status": "pass", "note": "Terdaftar di BPOM untuk ekspor pangan"},
        {"doc": "Sertifikat Halal MUI", "status": "pass", "note": "MUI Halal certificate valid"},
        {"doc": "Uji Lab Residu Pestisida", "status": "warning", "note": "Perlu dilakukan uji lab sebelum setiap pengiriman"},
    ]
    if dest_code == "jp":
        items.append({"doc": "Japan Food Sanitation Act", "status": "warning", "note": "Label Jepang perlu ditambahkan"})
    elif dest_code == "us":
        items.append({"doc": "FDA Registration (FSVP)", "status": "warning", "note": "Importir AS harus terdaftar FDA"})
    elif dest_code in ["de", "nl", "gb"]:
        items.append({"doc": "EU Food Safety Compliance", "status": "warning", "note": "Wajib sesuai regulasi EC 178/2002"})
    return items, 80


# ── DRY RUN CHECKPOINTS ─────────────────────────────────────────────────────

def get_dry_run_checkpoints(commodity: str, destination: str) -> list[dict]:
    """
    Generate commodity+destination-specific dry-run export journey checkpoints.
    """
    prompt = f"""You are an Indonesian export logistics and customs expert.
Generate the full export journey checkpoint list for:
  - Commodity: "{commodity}" (Indonesian export product)
  - Destination: {destination}

Return a JSON array with exactly 6 checkpoint objects:
[
  {{
    "checkpoint": "Location/stage name in Indonesian (e.g., 'Gudang UMKM (Origin)')",
    "description": "What happens at this checkpoint",
    "documents": ["Required doc 1", "Required doc 2"],
    "risk_level": "low" or "medium" or "high" or "very_high",
    "risk_detail": "Specific risk explanation for this commodity in Indonesian"
  }}
]

The 6 checkpoints must follow this order:
1. Gudang / pabrik UMKM (asal)
2. Pabean Keberangkatan (Bea Cukai RI)
3. Terminal Peti Kemas / Pelabuhan
4. Transit Pelayaran
5. Pabean Tujuan ({destination})
6. Gudang Buyer ({destination})

Make the risk_detail specific to "{commodity}" — mention actual commodity-specific risks (e.g., moisture for coffee, SVLK for wood, MRL for produce, cold chain for seafood, etc.)
Respond ONLY with valid JSON array."""

    raw = _call_gemini(prompt, max_tokens=900)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            checkpoints = json.loads(raw)
            if isinstance(checkpoints, list) and len(checkpoints) >= 4:
                return checkpoints
        except Exception as e:
            logger.warning(f"Failed to parse dry-run checkpoints: {e}")

    return _fallback_checkpoints(commodity, destination)


def _fallback_checkpoints(commodity: str, destination: str) -> list[dict]:
    comm = commodity.lower()
    is_wood = any(w in comm for w in ["kayu", "furniture", "rotan", "bambu"])
    is_food = any(w in comm for w in ["kopi", "cokelat", "rempah", "kacang", "teh", "buah", "ikan", "udang"])

    doc3 = ["Phytosanitary Certificate", "Sertifikat Fumigasi"] if is_wood else \
           ["Phytosanitary Certificate", "Health Certificate"] if is_food else \
           ["SNI Certificate", "Product Safety Test Report"]

    risk3 = "Sertifikasi V-Legal (SVLK/FLEGT) wajib ada atau kontainer tidak bisa berangkat ke UE/AS." if is_wood else \
            "Kadar air, kontaminasi mikotoksin, atau residu pestisida menyebabkan penolakan total." if is_food else \
            "Produk harus lulus SNI/standar lokal tujuan sebelum izin ekspor diterbitkan."

    return [
        {"checkpoint": "Gudang UMKM (Origin)", "description": "Persiapan QC & dokumen dasar ekspor",
         "documents": ["Certificate of Analysis (CoA)", "Surat Keterangan Asal (SKA)"],
         "risk_level": "low", "risk_detail": f"Pastikan kualitas {commodity} konsisten dan label kemasan sesuai regulasi {destination}."},
        {"checkpoint": "Pabean Keberangkatan (Bea Cukai RI)", "description": "Upload PEB & NPE ke sistem INSW",
         "documents": ["Pemberitahuan Ekspor Barang (PEB)", "Nota Pelayanan Ekspor (NPE)"],
         "risk_level": "medium", "risk_detail": f"Kesalahan HS Code 8-digit untuk {commodity} sering menyebabkan penolakan PEB."},
        {"checkpoint": "Terminal Peti Kemas (Pelabuhan)", "description": "Pemeriksaan fisik & karantina",
         "documents": doc3,
         "risk_level": "high", "risk_detail": risk3},
        {"checkpoint": "Transit Pelayaran", "description": "Penerbitan B/L & monitoring kontainer",
         "documents": ["Bill of Lading (B/L)", "Marine Insurance Certificate"],
         "risk_level": "medium", "risk_detail": "Keterlambatan jadwal pelayaran dapat mempengaruhi L/C expiry date."},
        {"checkpoint": f"Pabean Tujuan ({destination})", "description": "Import clearance & SPS inspection",
         "documents": ["Import Declaration", "SPS Certificate", "Label Compliance"],
         "risk_level": "very_high", "risk_detail": f"Kemasan tanpa negara asal atau label lokal {destination} akan langsung ditahan di customs."},
        {"checkpoint": f"Gudang Buyer ({destination})", "description": "Serah terima fisik & pencairan L/C",
         "documents": ["Delivery Order", "Certificate of Acceptance"],
         "risk_level": "low", "risk_detail": "Pencairan sisa 70% invoice via L/C at Sight setelah tanda terima buyer."},
    ]


# ── TIMELINE ────────────────────────────────────────────────────────────────

def get_shipping_timeline(destination: str, dest_code: str) -> tuple[list[dict], str]:
    """Return realistic shipping timeline phases and total duration."""
    asia_near = dest_code in ["sg", "my", "th", "vn", "ph"]
    asia_far = dest_code in ["jp", "cn", "kr"]
    transit_days = "4-7 hari" if asia_near else "7-12 hari" if asia_far else "25-35 hari"
    total = "18-28 hari" if asia_near else "22-32 hari" if asia_far else "38-55 hari"

    return [
        {"phase": "Persiapan Dokumen & QC", "duration": "5-10 hari kerja"},
        {"phase": "Pengemasan & Stuffing Kontainer", "duration": "2-4 hari kerja"},
        {"phase": "Customs Clearance Asal (RI)", "duration": "1-3 hari kerja"},
        {"phase": f"Transit Laut → {destination}", "duration": transit_days},
        {"phase": f"Customs Clearance Tujuan ({destination})", "duration": "3-7 hari kerja"},
    ], total
