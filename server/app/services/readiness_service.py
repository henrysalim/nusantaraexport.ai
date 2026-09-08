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


# ── PACKAGING CHECKLIST ──────────────────────────────────────────────────────

def get_packaging_checklist(commodity: str, destination: str, dest_code: str) -> tuple[list, int]:
    """
    Return commodity-specific packaging compliance checklist and a base score (0-100).
    Uses Gemini to generate accurate requirements; falls back to category-based static table.
    """
    prompt = f"""You are an Indonesian export packaging compliance expert.
List the packaging compliance requirements for exporting:
  - Commodity: "{commodity}"
  - Destination: {destination}

IMPORTANT:
- Requirements must be SPECIFIC to this commodity type, NOT generic food labels
- If the commodity is a handicraft/souvenir/keychain/accessory, list craft-specific requirements
  (e.g. brand label, material safety, country of origin mark, barcode)
- If the commodity is food/beverage, list food-specific requirements
  (e.g. nutrition facts, halal label, expiry date, allergen info)
- If the commodity is textile/garment, list textile-specific requirements
  (e.g. fiber content, care instructions, size label)
- Always include country-specific label language requirement for {destination}
- Maximum 6 items

Return a JSON array where each item has:
  - "requirement": string (name of requirement)
  - "status": "required" | "recommended" | "conditional"
  - "note": string (brief explanation, why it matters for {destination})

Example for craft/souvenir:
[
  {{"requirement": "Label Merek & Nama Produk", "status": "required", "note": "Wajib pada kemasan atau produk"}},
  {{"requirement": "Country of Origin (Made in Indonesia)", "status": "required", "note": "Wajib untuk bea cukai Jepang"}},
  {{"requirement": "Kode Barcode / QR Code", "status": "recommended", "note": "Memudahkan distribusi di retail Jepang"}},
  {{"requirement": "Material & Bahan Produk", "status": "conditional", "note": "Diperlukan jika menggunakan bahan berbahaya"}},
  {{"requirement": "Label Bahasa Jepang", "status": "required", "note": "Wajib untuk consumer goods di Jepang"}},
  {{"requirement": "Kemasan Ramah Lingkungan", "status": "recommended", "note": "Jepang sangat memperhatikan packaging sustainability"}}
]

Respond ONLY with a valid JSON array. No markdown, no explanation."""

    raw = _call_gemini(prompt, max_tokens=600)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            items_raw = json.loads(raw)
            if isinstance(items_raw, list) and len(items_raw) >= 2:
                # Map to internal format
                result = []
                required_count = 0
                for item in items_raw[:6]:
                    req   = str(item.get("requirement", item.get("doc", "")))
                    status_raw = str(item.get("status", "required")).lower()
                    note  = str(item.get("note", ""))
                    # Map to pass/warning/fail
                    if status_raw == "required":
                        status = "warning"  # not yet confirmed = warning by default
                        required_count += 1
                    elif status_raw == "recommended":
                        status = "warning"
                    else:
                        status = "warning"
                    result.append({"doc": req, "status": status, "note": note})
                # Score: start at 60, penalise for each unmet requirement
                base_score = max(40, 80 - (required_count * 8))
                return result, base_score
        except Exception as e:
            logger.warning(f"Failed to parse packaging checklist from Gemini: {e}")

    # Static fallback by category
    return _fallback_packaging(commodity, destination, dest_code)


def _fallback_packaging(commodity: str, destination: str, dest_code: str) -> tuple[list, int]:
    """Category-based packaging checklist fallback."""
    comm = commodity.lower()
    dest_label_lang = {
        "jp": "Bahasa Jepang", "cn": "Bahasa Mandarin",
        "kr": "Bahasa Korea", "de": "Bahasa Jerman",
        "us": "Bahasa Inggris (US)", "au": "Bahasa Inggris (AU)",
    }.get(dest_code, "Bahasa Inggris")

    # ── Craft / Souvenir / Kerajinan ──
    if any(w in comm for w in ["gantungan", "kunci", "souvenir", "kerajinan", "craft",
                                "gelang", "kalung", "cincin", "hiasan", "dekorasi",
                                "boneka", "mainan", "miniatur", "aksesoris"]):
        items = [
            {"doc": "Label Merek & Nama Produk", "status": "warning",
             "note": "Wajib tertera pada kemasan atau produk"},
            {"doc": f"Country of Origin (Made in Indonesia)", "status": "warning",
             "note": f"Wajib untuk bea cukai {destination}"},
            {"doc": f"Label {dest_label_lang}", "status": "warning",
             "note": f"Wajib untuk consumer goods di {destination}"},
            {"doc": "Kode Barcode / SKU", "status": "warning",
             "note": "Diperlukan untuk distribusi ritel"},
            {"doc": "Spesifikasi Material & Bahan", "status": "warning",
             "note": "Terutama jika ada bahan logam, cat, atau plastik"},
        ]
        if dest_code == "jp":
            items.append({"doc": "Kemasan Ramah Lingkungan", "status": "warning",
                          "note": "Jepang mensyaratkan packaging eco-friendly"})
        return items, 55

    # ── Makanan / Minuman ──
    if any(w in comm for w in ["tempe", "tahu", "keripik", "kopi", "teh", "cokelat",
                                "snack", "camilan", "cookies", "rempah", "ikan", "udang",
                                "sayur", "buah", "makanan", "minuman"]):
        items = [
            {"doc": "Label Produk + Nama Dagang", "status": "warning",
             "note": "Wajib tertera dalam bahasa yang dimengerti konsumen"},
            {"doc": "Informasi Nilai Gizi (Nutrition Facts)", "status": "warning",
             "note": f"Wajib untuk produk pangan di {destination}"},
            {"doc": "Tanggal Produksi & Kadaluarsa", "status": "warning",
             "note": "Wajib pada semua produk pangan ekspor"},
            {"doc": f"Label {dest_label_lang}", "status": "warning",
             "note": f"Wajib untuk produk pangan di {destination}"},
            {"doc": "Daftar Bahan (Ingredients)", "status": "warning",
             "note": "Termasuk alergen dan bahan tambahan pangan"},
            {"doc": "Country of Origin", "status": "warning",
             "note": f"Wajib untuk bea cukai {destination}"},
        ]
        return items, 50

    # ── Tekstil / Garmen / Batik ──
    if any(w in comm for w in ["batik", "tekstil", "kain", "garmen", "baju", "pakaian"]):
        items = [
            {"doc": "Label Komposisi Serat (Fiber Content)", "status": "warning",
             "note": "Wajib pada garmen ekspor sesuai standar internasional"},
            {"doc": "Petunjuk Perawatan (Care Label)", "status": "warning",
             "note": f"Wajib di {destination}"},
            {"doc": f"Label Ukuran ({destination})", "status": "warning",
             "note": "Konversi ke sistem ukuran lokal tujuan"},
            {"doc": f"Label {dest_label_lang}", "status": "warning",
             "note": f"Wajib untuk consumer goods di {destination}"},
            {"doc": "Country of Origin", "status": "warning",
             "note": f"Wajib untuk bea cukai {destination}"},
        ]
        return items, 55

    # ── Furnitur / Kayu ──
    if any(w in comm for w in ["kayu", "furniture", "mebel", "rotan", "bambu"]):
        items = [
            {"doc": "SVLK / FLEGT License", "status": "warning",
             "note": "Wajib untuk ekspor produk kayu ke Eropa & beberapa pasar"},
            {"doc": "Label Bahan & Finishing", "status": "warning",
             "note": "Informasi jenis kayu, cat, dan pelapis"},
            {"doc": "Dimensi & Berat Produk", "status": "warning",
             "note": "Diperlukan untuk customs clearance"},
            {"doc": f"Label {dest_label_lang}", "status": "warning",
             "note": f"Untuk consumer-facing packaging di {destination}"},
            {"doc": "Country of Origin", "status": "warning",
             "note": f"Wajib untuk bea cukai {destination}"},
        ]
        return items, 55

    # ── Generic ──
    items = [
        {"doc": "Label Produk & Merek", "status": "warning",
         "note": "Identitas produk pada kemasan"},
        {"doc": "Country of Origin (Made in Indonesia)", "status": "warning",
         "note": f"Wajib untuk bea cukai {destination}"},
        {"doc": f"Label {dest_label_lang}", "status": "warning",
         "note": f"Label dalam bahasa lokal {destination}"},
        {"doc": "Informasi Kontak Eksportir", "status": "warning",
         "note": "Nama dan alamat produsen/eksportir"},
    ]
    return items, 50


# ── COST BREAKDOWN ──────────────────────────────────────────────────────────

# Freight rate per-kg fallback table (LCL, 2024-2025)
_FREIGHT_RATE_TABLE = {
    # dest_keywords → rate_per_kg_idr
    "asia_near": {
        "keywords": ["singapura", "singapore", "malaysia", "thailand", "vietnam", "filipina"],
        "rate": 4_000,
        "note": "LCL Tanjung Priok / Surabaya ke Asia Tenggara, ~USD 25-35/CBM",
    },
    "asia_mid": {
        "keywords": ["jepang", "japan", "tiongkok", "china", "korea"],
        "rate": 5_500,
        "note": "LCL ke Jepang/China/Korea, ~USD 35-50/CBM (Tanjung Priok 2024)",
    },
    "middle_east": {
        "keywords": ["arab", "dubai", "uae", "saudi", "qatar", "kuwait"],
        "rate": 8_000,
        "note": "LCL ke Timur Tengah, ~USD 50-70/CBM",
    },
    "europe": {
        "keywords": ["jerman", "germany", "belanda", "netherlands", "perancis", "france",
                     "inggris", "uk", "eropa", "europe", "italia", "spanyol"],
        "rate": 13_000,
        "note": "LCL ke Eropa, ~USD 80-110/CBM (Tanjung Priok 2024)",
    },
    "usa": {
        "keywords": ["amerika", "america", "usa", "us"],
        "rate": 14_000,
        "note": "LCL ke Amerika Serikat, ~USD 90-120/CBM",
    },
    "australia": {
        "keywords": ["australia"],
        "rate": 9_000,
        "note": "LCL ke Australia, ~USD 55-80/CBM",
    },
}
_DEFAULT_FREIGHT_RATE = 6_000  # fallback rate per kg

# Fixed logistics costs per shipment (PPJK/forwarder fee, Bea Cukai, dll)
_FIXED_DOCS_TABLE = {
    # Dokumen & sertifikasi: bervariasi sesuai komoditas
    "food":    {"docs": 4_500_000, "customs": 3_500_000},
    "wood":    {"docs": 8_000_000, "customs": 4_500_000},
    "textile": {"docs": 5_000_000, "customs": 3_500_000},
    "craft":   {"docs": 3_500_000, "customs": 2_500_000},
    "default": {"docs": 4_000_000, "customs": 3_000_000},
}


def _get_freight_rate(destination: str) -> tuple[int, str]:
    """Return (rate_per_kg_idr, source_note) for destination."""
    dest_lower = destination.lower()
    for _, zone in _FREIGHT_RATE_TABLE.items():
        if any(kw in dest_lower for kw in zone["keywords"]):
            return zone["rate"], zone["note"]
    return _DEFAULT_FREIGHT_RATE, "Estimasi LCL rate internasional 2024"


def _get_fixed_costs(commodity: str) -> dict:
    comm = commodity.lower()
    if any(w in comm for w in ["kopi", "tempe", "tahu", "keripik", "snack", "rempah", "teh",
                                "ikan", "udang", "cokelat", "kakao", "buah", "sayur"]):
        return _FIXED_DOCS_TABLE["food"]
    if any(w in comm for w in ["kayu", "furniture", "mebel", "rotan", "bambu"]):
        return _FIXED_DOCS_TABLE["wood"]
    if any(w in comm for w in ["batik", "tekstil", "kain", "garmen", "baju", "pakaian"]):
        return _FIXED_DOCS_TABLE["textile"]
    if any(w in comm for w in ["gantungan", "kunci", "souvenir", "kerajinan", "craft",
                                "gelang", "kalung", "hiasan", "dekorasi", "boneka"]):
        return _FIXED_DOCS_TABLE["craft"]
    return _FIXED_DOCS_TABLE["default"]


def _get_fallback_production_cost(commodity: str) -> int:
    """Fallback Indonesian SME production/wholesale cost per kg (HPP) in IDR."""
    comm = commodity.lower()
    if any(w in comm for w in ["vanili", "vanilla", "safron"]):
        return 450_000
    if any(w in comm for w in ["kopi", "coffee"]):
        return 95_000
    if any(w in comm for w in ["cengkeh", "kayu manis", "pala", "lada", "rempah", "spices"]):
        return 85_000
    if any(w in comm for w in ["ikan", "udang", "tuna", "seafood"]):
        return 65_000
    if any(w in comm for w in ["tempe", "keripik", "snack", "makanan", "biskuit", "kue", "abon", "sambal", "bumbu"]):
        return 45_000
    if any(w in comm for w in ["gantungan", "kunci", "kerajinan", "craft", "souvenir", "rotan", "kayu", "batik"]):
        return 50_000
    if any(w in comm for w in ["briket", "arang", "charcoal"]):
        return 16_000
    return 45_000


def _call_gemini_logistics(commodity: str, destination: str, quantity_kg: float) -> Optional[dict]:
    """
    Ask Gemini for verified logistics costs and production cost estimate with strict guardrails.
    Returns dict with freight_per_kg_idr, docs_idr, customs_idr, production_cost_per_kg_idr, source_note, or None on failure.
    """
    prompt = f"""You are a certified Indonesian export logistics & trade cost expert (PPJK/freight forwarder).
Provide VERIFIED, FACTUAL 2024-2025 market rates and production cost benchmarks for this export shipment:
  - Commodity: "{commodity}"
  - Destination: {destination}
  - Quantity: {quantity_kg:.0f} kg
  - Shipping mode: LCL (Less than Container Load) if < 5,000 kg, FCL 20ft if >= 5,000 kg
  - Port of origin: Tanjung Priok (Jakarta) or Tanjung Perak (Surabaya)

GUARDRAILS (strict, you MUST follow these):
1. Base ALL numbers on REAL, verifiable 2024-2025 Indonesian export and domestic market data.
2. Estimated Production / Wholesale Cost per kg (HPP UMKM Indonesia):
   - Provide realistic domestic Indonesian wholesale/production cost per kg for "{commodity}".
   - Examples: Keripik Tempe Rp 35.000 - 65.000/kg; Kopi Arabika Green Bean Rp 90.000 - 150.000/kg; Briket Arang Rp 12.000 - 20.000/kg; Gantungan Kunci / Souvenir Rp 30.000 - 90.000/kg; Sambal/Bumbu Rp 35.000 - 70.000/kg; Vanili Rp 350.000 - 600.000/kg.
   - Must be realistic Indonesian SME wholesale/production cost per kg (integer in IDR).
3. LCL freight to Asia (Japan/China/Korea): USD 35-60 per CBM. 1 CBM ≈ 300-500 kg for most goods.
4. LCL freight to Europe: USD 80-120 per CBM
5. LCL freight to USA: USD 90-130 per CBM
6. Origin charges (PPJK, THC, B/L): Rp 2.000.000-4.500.000 per shipment
7. Document processing (SKA, Phytosanitary, etc): Rp 2.000.000-6.000.000 depending on commodity
8. Import customs clearance (destination): Rp 1.500.000-3.500.000
9. If you are not confident in the exact number, use the MIDDLE of the realistic range
10. Do NOT make up numbers — if uncertain, say so in source_note

Return ONLY valid JSON (no markdown, no explanation):
{{
  "production_cost_per_kg_idr": <integer, realistic Indonesian SME production/wholesale cost per kg in IDR>,
  "freight_per_kg_idr": <integer, freight cost per kg in IDR>,
  "freight_type": "<LCL or FCL>",
  "docs_idr": <integer, total doc processing cost in IDR>,
  "customs_idr": <integer, customs clearance cost in IDR>,
  "source_note": "<brief citation of data source, e.g. 'LCL Tanjung Priok-Yokohama 2024, USD 45/CBM'>",
  "confidence": "<high|medium|low>"
}}"""

    raw = _call_gemini(prompt, max_tokens=400)
    if not raw:
        return None
    try:
        raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
        data = json.loads(raw)
        required = ["freight_per_kg_idr", "docs_idr", "customs_idr"]
        if all(k in data for k in required):
            # Guardrail: validate ranges
            frate = int(data["freight_per_kg_idr"])
            docs  = int(data["docs_idr"])
            cust  = int(data["customs_idr"])
            prod_est = int(data.get("production_cost_per_kg_idr", 0))

            if frate < 1_000 or frate > 25_000:
                logger.warning(f"Gemini freight rate out of range: {frate}/kg. Using fallback.")
                return None
            if docs < 500_000 or docs > 15_000_000:
                logger.warning(f"Gemini docs cost out of range: {docs}. Using fallback.")
                return None
            if cust < 500_000 or cust > 8_000_000:
                logger.warning(f"Gemini customs cost out of range: {cust}. Using fallback.")
                return None

            # Validate prod_est range (3.000 - 10.000.000/kg)
            if prod_est < 3_000 or prod_est > 10_000_000:
                prod_est = None

            return {
                "production_cost_per_kg_idr": prod_est,
                "freight_per_kg_idr": frate,
                "freight_type": data.get("freight_type", "LCL"),
                "docs_idr": docs,
                "customs_idr": cust,
                "source_note": data.get("source_note", ""),
                "confidence": data.get("confidence", "medium"),
            }
    except Exception as e:
        logger.warning(f"Failed to parse Gemini logistics costs: {e}")
    return None


def get_cost_breakdown(
    commodity: str,
    destination: str,
    production_price_per_kg: Optional[float] = None,
    quantity_kg: Optional[float] = None,
) -> dict:
    """
    Calculate export cost breakdown.

    - Production: user-supplied (price_per_kg × quantity_kg) if provided.
      If not provided, estimated by Gemini AI / Indonesian market benchmark.
    - Freight, Docs, Customs: from Gemini with strict guardrails → fallback to verified table.
    - Insurance: 0.35% of (production + freight), calculated precisely.
    - Returns per-unit breakdown for transparent display.
    """
    qty = quantity_kg or 500.0           # default 500 kg jika tidak diisi

    def _fmt(n: int) -> str:
        return "Rp " + "{:,.0f}".format(n).replace(",", ".")

    def _fmt_rate(n: int) -> str:
        return "Rp " + "{:,.0f}".format(n).replace(",", ".")

    # ── 1. Logistics & Production from Gemini (guardrailed) or fallback table ────────────
    gemini_logistics = _call_gemini_logistics(commodity, destination, qty)
    if gemini_logistics:
        freight_rate = gemini_logistics["freight_per_kg_idr"]
        freight_type = gemini_logistics["freight_type"]
        docs_idr     = gemini_logistics["docs_idr"]
        customs_idr  = gemini_logistics["customs_idr"]
        source_note  = gemini_logistics["source_note"]
        confidence   = gemini_logistics["confidence"]
        ai_prod_est  = gemini_logistics.get("production_cost_per_kg_idr")
    else:
        freight_rate, source_note = _get_freight_rate(destination)
        freight_type = "FCL 20ft" if qty >= 5_000 else "LCL"
        fixed        = _get_fixed_costs(commodity)
        docs_idr     = fixed["docs"]
        customs_idr  = fixed["customs"]
        confidence   = "medium"
        ai_prod_est  = None

    # ── 2. Determine Production Price per kg ────────────────────────────────
    is_user_price = bool(production_price_per_kg and production_price_per_kg > 0)
    if is_user_price:
        price = float(production_price_per_kg)
    else:
        # User didn't fill: use Gemini's benchmark estimate or realistic SME fallback table
        price = float(ai_prod_est or _get_fallback_production_cost(commodity))

    prod_idr     = int(price * qty)
    freight_idr  = int(freight_rate * qty)
    insurance_idr = int((prod_idr + freight_idr) * 0.0035)
    total_idr    = prod_idr + freight_idr + insurance_idr + docs_idr + customs_idr

    return {
        "production": {
            "label":      f"Biaya Produksi ({commodity})",
            "amount":     _fmt(prod_idr),
            "unit_price": _fmt_rate(int(price)) + "/kg",
            "quantity":   f"{qty:,.0f} kg".replace(",", "."),
            "calculation": f"{_fmt_rate(int(price))}/kg × {qty:,.0f} kg".replace(",", "."),
            "user_input": is_user_price,
            "is_estimated": not is_user_price,
        },
        "freight": {
            "label":      f"Freight {freight_type} → {destination}",
            "amount":     _fmt(freight_idr),
            "unit_price": _fmt_rate(freight_rate) + "/kg",
            "quantity":   f"{qty:,.0f} kg".replace(",", "."),
            "calculation": f"{_fmt_rate(freight_rate)}/kg × {qty:,.0f} kg".replace(",", "."),
            "freight_type": freight_type,
        },
        "insurance": {
            "label":  "Asuransi Kargo (0.35%)",
            "amount": _fmt(insurance_idr),
            "note":   "0.35% × (produksi + freight)",
        },
        "docs": {
            "label":  "Pengurusan Dokumen & Sertifikasi",
            "amount": _fmt(docs_idr),
            "note":   "PPJK, SKA, Phytosanitary, dll",
        },
        "customs": {
            "label":  "Handling & Clearance",
            "amount": _fmt(customs_idr),
            "note":   "THC, B/L, origin charges",
        },
        "total":       _fmt(total_idr),
        "quantity_kg": qty,
        "price_per_kg_idr": int(price),
        "source_note": source_note,
        "confidence":  confidence,
        "user_provided_price": is_user_price,
    }




def _parse_idr(amount_str: str) -> int:
    """Parse 'Rp 125.000.000' or 'Rp125000000' into integer."""
    try:
        digits = re.sub(r"[^0-9]", "", str(amount_str))
        return int(digits) if digits else 0
    except Exception:
        return 0


def _get_max_production_idr(commodity: str) -> int:
    """Return the maximum acceptable production cost (IDR) for Gemini validation."""
    comm = commodity.lower()
    # Craft / souvenir / kerajinan — very low production cost per FCL for UMKM
    if any(w in comm for w in [
        "gantungan", "kunci", "souvenir", "sovenir", "kerajinan", "craft", "aksesoris",
        "gelang", "kalung", "cincin", "tas rajut", "anyam", "hiasan", "dekorasi",
        "boneka", "mainan", "miniatur",
    ]):
        return 20_000_000
    # Fresh / fermented foods (tempe, tahu, kerupuk, dll) — very low production cost
    if any(w in comm for w in ["tempe", "tahu", "kerupuk", "krupuk", "ferment"]):
        return 40_000_000
    # Light processed snacks
    if any(w in comm for w in ["keripik", "kripik", "snack", "camilan", "cookies", "biskuit"]):
        return 60_000_000
    # Coffee / cocoa
    if any(w in comm for w in ["kopi", "cokelat", "kakao", "cacao", "coffee"]):
        return 180_000_000
    # Spices / herbal
    if any(w in comm for w in ["rempah", "jahe", "kunyit", "lada", "cengkeh", "pala", "kayu manis", "spice"]):
        return 120_000_000
    # Tea
    if any(w in comm for w in ["teh", "tea"]):
        return 100_000_000
    # Seafood
    if any(w in comm for w in ["ikan", "udang", "tuna", "cakalang", "cumi", "seafood", "fish", "shrimp"]):
        return 160_000_000
    # Wood / furniture / rattan / bamboo
    if any(w in comm for w in ["kayu", "furniture", "rotan", "bambu", "mebel"]):
        return 200_000_000
    # Textile / garment
    if any(w in comm for w in ["batik", "tekstil", "kain", "garmen", "baju", "pakaian"]):
        return 150_000_000
    # General agri / horticulture
    if any(w in comm for w in ["singkong", "kacang", "buah", "sayur", "fruit", "vegetable"]):
        return 60_000_000
    # Default cap for unknown UMKM products — turunkan agar Gemini tidak inflate
    return 80_000_000


# ── Per-commodity UMKM fallback cost table (2024-2025 market rates) ──────────
# Basis: pengiriman awal UMKM (bisa LCL atau FCL kecil), FOB.
# Biaya produksi = nilai barang yang dikirim, bukan kapasitas pabrik.
_COMMODITY_COST_TABLE = [
    # (keywords, prod_idr, freight_asia_idr, freight_west_idr, docs_idr, customs_idr)
    # ── Kerajinan / Souvenir / Craft ────────────────────────────────────────
    (["gantungan", "kunci", "souvenir", "sovenir", "kerajinan", "craft",
      "gelang", "kalung", "cincin", "hiasan", "dekorasi", "boneka", "mainan",
      "miniatur", "aksesoris", "tas rajut", "anyam"],
     10_000_000, 18_000_000, 35_000_000, 3_500_000, 2_500_000),
    # ── Makanan fermentasi / segar ───────────────────────────────────────────
    (["tempe", "tahu"],
     18_000_000, 22_500_000, 45_000_000, 4_500_000, 3_500_000),
    # ── Camilan / snack ──────────────────────────────────────────────────────
    (["kerupuk", "krupuk", "keripik", "kripik", "snack", "camilan", "cookies", "biskuit"],
     32_000_000, 22_500_000, 42_000_000, 5_000_000, 3_500_000),
    # ── Kopi ─────────────────────────────────────────────────────────────────
    (["kopi", "coffee", "arabika", "robusta"],
     95_000_000, 22_500_000, 45_000_000, 8_500_000, 4_000_000),
    # ── Cokelat / Kakao ───────────────────────────────────────────────────────
    (["cokelat", "kakao", "cacao", "chocolate"],
     80_000_000, 22_500_000, 45_000_000, 7_500_000, 4_000_000),
    # ── Rempah / Herbal ──────────────────────────────────────────────────────
    (["rempah", "jahe", "kunyit", "lada", "cengkeh", "pala", "kayu manis", "spice"],
     50_000_000, 22_500_000, 42_000_000, 6_000_000, 3_500_000),
    # ── Teh ─────────────────────────────────────────────────────────────────
    (["teh", "tea"],
     40_000_000, 22_500_000, 42_000_000, 5_500_000, 3_500_000),
    # ── Seafood ──────────────────────────────────────────────────────────────
    (["ikan", "udang", "tuna", "cakalang", "cumi", "seafood", "fish", "shrimp"],
     110_000_000, 25_000_000, 50_000_000, 9_000_000, 5_000_000),
    # ── Furnitur / Kayu / Rotan ──────────────────────────────────────────────
    (["kayu", "furniture", "mebel", "rotan", "bambu"],
     100_000_000, 28_000_000, 52_000_000, 12_000_000, 5_500_000),
    # ── Tekstil / Batik / Garmen ─────────────────────────────────────────────
    (["batik", "tekstil", "kain", "garmen", "baju", "pakaian"],
     65_000_000, 22_500_000, 42_000_000, 7_000_000, 4_000_000),
    # ── Agrikultur / Hortikultura ────────────────────────────────────────────
    (["singkong", "kacang", "buah", "sayur", "fruit", "vegetable"],
     22_000_000, 22_500_000, 42_000_000, 5_000_000, 3_500_000),
]


def _fallback_cost(commodity: str, destination: str) -> dict:
    """Return realistic UMKM-scale export cost breakdown."""
    comm = commodity.lower()
    dest_lower = destination.lower()

    # Determine freight zone
    asia_near = any(w in dest_lower for w in ["singapura", "singapore", "malaysia", "thailand", "vietnam", "filipina"])
    asia_mid  = any(w in dest_lower for w in ["jepang", "japan", "tiongkok", "china", "korea"])
    west      = any(w in dest_lower for w in ["amerika", "america", "jerman", "germany", "eropa", "europe",
                                               "belanda", "perancis", "inggris", "uk", "australia"])

    # Find matching commodity row
    prod_idr    = 12_000_000   # default UMKM kecil, bukan FCL penuh
    freight_idr = 22_500_000
    docs_idr    = 5_000_000
    customs_idr = 3_500_000

    for (keywords, prod, freight_asia, freight_west, docs, customs) in _COMMODITY_COST_TABLE:
        if any(kw in comm for kw in keywords):
            prod_idr = prod
            freight_idr = freight_west if west else (freight_asia + 2_000_000 if not asia_near else freight_asia)
            docs_idr = docs
            customs_idr = customs
            break
    else:
        # Generic UMKM product defaults
        freight_idr = 45_000_000 if west else (24_000_000 if asia_mid else 22_500_000)

    insurance_idr = int(prod_idr * 0.0035)
    total_idr = prod_idr + freight_idr + insurance_idr + docs_idr + customs_idr

    def _fmt(n: int) -> str:
        return "Rp " + "{:,.0f}".format(n).replace(",", ".")

    return {
        "production": {"label": f"Biaya Produksi ({commodity})", "amount": _fmt(prod_idr)},
        "freight":    {"label": f"Freight FCL 20ft → {destination}", "amount": _fmt(freight_idr)},
        "insurance":  {"label": "Asuransi Kargo (0.35%)", "amount": _fmt(insurance_idr)},
        "docs":       {"label": "Pengurusan Dokumen & Sertifikasi", "amount": _fmt(docs_idr)},
        "customs":    {"label": "Handling & Clearance", "amount": _fmt(customs_idr)},
        "total":      _fmt(total_idr),
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
