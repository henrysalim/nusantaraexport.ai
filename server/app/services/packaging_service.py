"""
PackagingService — Real-time compliance engine for packaging audit.

Architecture:
  1. load_regulations()  — loads JSON rules for country × product_category
  2. analyze_with_gemini() — Vision analysis when image is uploaded
  3. merge_checklist()    — upgrades item statuses from Gemini detections
  4. calculate_score()   — deterministic score from merged statuses
"""
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

REGULATIONS_PATH = Path(__file__).parent / "packaging_regulations.json"

# ──────────────────────────────────────────────────────
# Regulations loader (lazy, cached in memory)
# ──────────────────────────────────────────────────────
_reg_db: Optional[dict] = None


def _load_regulations() -> dict:
    global _reg_db
    if _reg_db is None:
        try:
            with open(REGULATIONS_PATH, "r", encoding="utf-8") as f:
                _reg_db = json.load(f)
            logger.info(f"Loaded packaging regulations: {len([k for k in _reg_db if not k.startswith('_')])} countries/regions.")
        except Exception as e:
            logger.error(f"Failed to load packaging_regulations.json: {e}")
            _reg_db = {}
    return _reg_db


# ──────────────────────────────────────────────────────
# Product category classifier
# ──────────────────────────────────────────────────────
_CATEGORY_KEYWORDS = {
    "food": [
        "kopi", "coffee", "teh", "tea", "rempah", "spice", "kakao", "cocoa", "cokelat",
        "chocolate", "keripik", "chips", "singkong", "cassava", "jus", "juice", "buah",
        "fruit", "makanan", "food", "minuman", "beverage", "sambal", "saus", "sauce",
        "mie", "noodle", "beras", "rice", "gula", "sugar", "madu", "honey", "kacang",
        "peanut", "snack", "biskuit", "biscuit", "bumbu", "seasoning", "minyak", "oil",
        "kelapa", "coconut", "sawit", "palm", "ikan", "fish", "udang", "shrimp",
        "seafood", "hasil laut", "kue", "cake", "tempe", "tahu", "tofu", "dodol",
        "rendang", "ginger", "jahe", "kunyit", "turmeric", "lada", "pepper", "kayu manis",
        "cinnamon", "pala", "nutmeg", "cengkeh", "clove", "vanila", "vanilla",
    ],
    "cosmetic": [
        "kosmetik", "cosmetic", "kecantikan", "beauty", "skincare", "perawatan kulit",
        "sabun", "soap", "shampo", "shampoo", "lotion", "krim", "cream", "serum",
        "minyak esensial", "essential oil", "aromaterapi", "aromatherapy", "parfum",
        "perfume", "lipstik", "lipstick", "herbal", "jamu", "wellness",
    ],
    "textile": [
        "batik", "tekstil", "textile", "kain", "fabric", "tenun", "weaving", "sarung",
        "kebaya", "baju", "pakaian", "clothing", "apparel", "garment", "garmen",
        "songket", "ulos", "tenun ikat", "jumputan",
    ],
    "wood": [
        "kayu", "wood", "kerajinan kayu", "wood craft", "furniture", "furnitur",
        "ukiran", "carving", "rotan", "rattan", "bambu", "bamboo", "jati", "teak",
        "mahoni", "mahogany",
    ],
}


def classify_product_category(product_type: str) -> str:
    """Classify a free-text product type into a category key."""
    pt = product_type.lower()
    best_cat = "general"
    best_count = 0
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in pt)
        if count > best_count:
            best_count = count
            best_cat = cat
    return best_cat


# ──────────────────────────────────────────────────────
# Checklist builder
# ──────────────────────────────────────────────────────
def build_checklist(country_code: str, product_type: str) -> list:
    """
    Build a compliance checklist for a country × product type.

    Priority order:
      1. Universal items (all countries, all categories)
      2. Universal category-specific items (food/cosmetic/textile/wood/general)
      3. Country-specific category items
      4. Country-specific universal food/all items (if country has them in non-category key)

    Returns list of item dicts with: id, label, required, status, note, regulation_ref
    """
    db = _load_regulations()
    category = classify_product_category(product_type)

    items_by_id: dict = {}

    def _add_items(items: list):
        for item in items:
            iid = item.get("id", item["label"])
            if iid not in items_by_id:
                items_by_id[iid] = {
                    "id": iid,
                    "label": item["label"],
                    "required": item.get("required", False),
                    "status": item.get("default_status", "warning"),
                    "note": item.get("note", ""),
                    "regulation_ref": item.get("regulation_ref", ""),
                }

    # 1. Universal items
    _add_items(db.get("_universal", {}).get("items", []))

    # 2. Universal category-specific items
    _add_items(db.get(f"_category_{category}", {}).get("items", []))

    # 3. If food — also add general nutrition base items if food category isn't already covered
    if category == "beverage":
        _add_items(db.get("_category_food", {}).get("items", []))

    # 4. Country-specific items for this category
    country_key = country_code.lower()
    country_rules = db.get(country_key, db.get("default", {}))

    country_category_items = country_rules.get(category, [])
    _add_items(country_category_items)

    # If no country-specific category items, also add default country items
    if not country_category_items:
        _add_items(db.get("default", {}).get(category, []))

    return list(items_by_id.values())


# ──────────────────────────────────────────────────────
# Gemini Vision analyzer
# ──────────────────────────────────────────────────────
def analyze_packaging_image(
    images: list,
    country_code: str,
    product_type: str,
    checklist_items: list,
) -> Optional[dict]:
    """
    Use Gemini Vision to analyze one or more packaging images against the checklist.
    All images are sent in a single Gemini request as multiple inlineData parts,
    giving the model a 360° view of the packaging (front, back, side, label, etc.).

    images: list of {"base64": str, "mime_type": str}
    Returns a dict of {item_id: detected_status, "vision_summary": str} or None on failure.
    """
    if not images:
        return None

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not set — skipping image analysis.")
        return None

    gemini_key = gemini_key.strip('"').strip("'")
    # Build structured prompt
    checklist_prompt_lines = "\n".join([
        f'  - id="{item["id"]}" | Check: {item["label"]} — {item["note"]}'
        for item in checklist_items
    ])
    n_images = len(images)
    image_context = (
        f"You are given {n_images} image(s) of the same product packaging from different angles "
        f"(e.g., front, back, side, label close-up). Use ALL images together for the most "
        f"complete and accurate assessment."
        if n_images > 1 else
        "You are given 1 image of a product packaging."
    )

    prompt = f"""You are an expert packaging compliance auditor for Indonesian exports.
{image_context}

Product type: "{product_type}"
Destination country: {country_code.upper()}

For each item in the checklist below, evaluate whether it is VISIBLE and COMPLIANT across the provided images:
{checklist_prompt_lines}

Return your analysis as a JSON object where each key is the item "id" and the value is one of:
  "pass"    — clearly visible and compliant in at least one image
  "warning" — partially present, unclear, or cannot fully verify even across all images
  "fail"    — clearly missing or non-compliant in ALL images

Also include a key "vision_summary" with 2-3 sentences describing what you could and could not verify across the {n_images} image(s).

Respond ONLY with valid JSON. No markdown, no explanation outside JSON."""

    try:
        import requests as _req
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"


        # Build parts: all images first, then the text prompt
        parts = []
        for img in images:
            b64 = img.get("base64", "")
            mime = img.get("mime_type", "image/jpeg")
            if b64:
                parts.append({"inlineData": {"mimeType": mime, "data": b64}})
        parts.append({"text": prompt})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            }
        }
        response = _req.post(url, json=payload, timeout=45)
        response.raise_for_status()
        data = response.json()

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        raw_text = re.sub(r"```(?:json)?\s*|\s*```", "", raw_text).strip()
        detections = json.loads(raw_text)
        logger.info(f"Gemini Vision: analysed {n_images} image(s), detected {len(detections) - 1} items.")
        return detections

    except Exception as e:
        logger.warning(f"Gemini Vision analysis failed: {e}")
        return None


# ──────────────────────────────────────────────────────
# Merge Gemini detections into checklist
# ──────────────────────────────────────────────────────
def merge_checklist_with_vision(
    checklist: list,
    gemini_detections: Optional[dict],
) -> tuple[list, str]:
    """
    Override checklist item statuses with Gemini Vision detections.
    Returns (updated_checklist, vision_summary).
    """
    if not gemini_detections:
        return checklist, ""

    vision_summary = gemini_detections.pop("vision_summary", "")

    valid_statuses = {"pass", "warning", "fail"}
    for item in checklist:
        detected = gemini_detections.get(item["id"])
        if detected and detected in valid_statuses:
            item["status"] = detected

    return checklist, vision_summary


# ──────────────────────────────────────────────────────
# Score calculator
# ──────────────────────────────────────────────────────
def calculate_compliance_score(items: list) -> int:
    """
    Calculate compliance score from actual item statuses.

    Scoring weights:
      pass    = full points
      warning = half points
      fail    = zero points

    Required items contribute 3× weight, non-required 1×.
    """
    if not items:
        return 0

    total_weight = 0
    earned_weight = 0

    for item in items:
        weight = 3 if item.get("required") else 1
        total_weight += weight
        status = item.get("status", "warning")
        if status == "pass":
            earned_weight += weight
        elif status == "warning":
            earned_weight += weight * 0.5

    if total_weight == 0:
        return 0

    return round((earned_weight / total_weight) * 100)


# ──────────────────────────────────────────────────────
# AI recommendation generator
# ──────────────────────────────────────────────────────
def generate_recommendation(
    product_type: str,
    country_code: str,
    score: int,
    items: list,
    vision_summary: str = "",
) -> str:
    """
    Generate a concise AI recommendation using Gemini.
    Falls back to a structured template if Gemini is unavailable.
    """
    failed_items = [i["label"] for i in items if i["status"] == "fail"]
    warning_items = [i["label"] for i in items if i["status"] == "warning"]

    # Try Gemini text generation for recommendation
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import requests
            gemini_key = gemini_key.strip('"').strip("'")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
            failed_str = ", ".join(failed_items[:3]) if failed_items else "tidak ada"
            warning_str = ", ".join(warning_items[:3]) if warning_items else "tidak ada"
            vision_ctx = f"Analisis visual kemasan: {vision_summary}" if vision_summary else ""

            prompt = f"""Berikan rekomendasi singkat (maksimal 3 kalimat) dalam bahasa Indonesia untuk UMKM yang ingin mengekspor '{product_type}' ke {country_code.upper()}.

Skor kepatuhan kemasan: {score}/100.
Item gagal: {failed_str}.
Item perlu perhatian: {warning_str}.
{vision_ctx}

Fokus pada: langkah paling penting yang harus diperbaiki, dan dampak konkret jika tidak diperbaiki (misalnya barang ditolak di bea cukai)."""

            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
            }
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            logger.warning(f"Gemini recommendation failed: {e}")

    # Structured fallback
    if score >= 80:
        base = f"Kemasan {product_type} Anda sudah sangat baik dengan skor {score}/100."
    elif score >= 60:
        base = f"Kemasan {product_type} Anda cukup siap ekspor (skor {score}/100), namun perlu beberapa penyesuaian."
    else:
        base = f"Kemasan {product_type} Anda memerlukan perbaikan signifikan (skor {score}/100) sebelum layak ekspor ke {country_code.upper()}."

    if failed_items:
        base += f" Prioritaskan perbaikan pada: {', '.join(failed_items[:3])} karena item ini dapat menyebabkan penolakan di bea cukai tujuan."
    if warning_items and not failed_items:
        base += f" Perlu klarifikasi atau penambahan: {', '.join(warning_items[:3])}."

    return base
