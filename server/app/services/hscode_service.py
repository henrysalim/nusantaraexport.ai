"""
HS Code Service — Real-time AI classification & FTA tariff preferentials logic.
Uses gemini-3.0-flash-lite for WCO 6-digit classification and dynamic FTA rate generation.
"""
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

HS_CODE_DB_PATH = Path(__file__).parent / "hs_code_db.json"

_hs_code_db: Optional[dict] = None


def _load_hs_code_db() -> dict:
    global _hs_code_db
    if _hs_code_db is None:
        try:
            with open(HS_CODE_DB_PATH, "r", encoding="utf-8") as f:
                _hs_code_db = json.load(f)
            logger.info(f"Loaded HS Code Database: {len(_hs_code_db)} products mapped.")
        except Exception as e:
            logger.error(f"Failed to load hs_code_db.json: {e}")
            _hs_code_db = {}
    return _hs_code_db


def _call_gemini_json(prompt: str) -> Optional[dict]:
    """Call gemini-3.0-flash-lite expecting a JSON response."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not set — skipping Gemini call.")
        return None

    gemini_key = gemini_key.strip('"').strip("'")


    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            }
        }
        response = requests.post(url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        raw_text = re.sub(r"```(?:json)?\s*|\s*```", "", raw_text).strip()
        return json.loads(raw_text)
    except Exception as e:
        logger.error(f"Gemini API JSON call failed: {e}")
        return None


def classify_product_hs_code(product_name: str) -> dict:
    """
    Classify a free-text product name into a standard HS code and get FTA results.
    
    Workflow:
      1. Use gemini-3.0-flash-lite to predict WCO 6-digit HS Code based on product name.
      2. If WCO 6-digit HS Code matches our local database, return the precise, verified record.
      3. Otherwise, use gemini-3.0-flash-lite to dynamically build a realistic 8-digit code, MFN, and FTA rates.
    """
    db = _load_hs_code_db()
    
    # ── Step 1: Predict WCO 6-digit code via Gemini ──
    # Provide hints from our database to help Gemini map to mapped codes when applicable.
    db_hints = [f"'{key}' ({info['product']})" for key, info in db.items()]
    hints_str = ", ".join(db_hints)

    prompt = f"""You are an expert customs officer and trade analyst specializing in Indonesian export codes (HS Codes).
Analyze the Indonesian product description: "{product_name}".

Predict its WCO 6-digit Harmonized System (HS) code prefix.
Hints: We have highly detailed local database entries for these 6-digit prefixes: [{hints_str}]. If the product fits any of these, map it to that exact 6-digit code!

Return a JSON object containing:
  "hs_code_6_digit": "string of 6 digits (e.g., '090121' or '640351')"
  "suggested_name": "clean display name of the product in Indonesian/English"
  "reason": "brief reason for this classification in Indonesian"

Respond ONLY with valid JSON."""

    classification = _call_gemini_json(prompt)
    
    # Extract predicted WCO 6-digit code
    hscode_6 = ""
    if classification:
        hscode_6 = str(classification.get("hs_code_6_digit", "")).replace(".", "").strip()
        hscode_6 = re.sub(r"\D", "", hscode_6)[:6]

    # ── Step 2: Local Database Lookup ──
    if hscode_6 and hscode_6 in db:
        logger.info(f"HS Code Lookup: Hit database for 6-digit prefix: {hscode_6}")
        record = db[hscode_6]
        # Include AI generated elements
        return {
            "product": record["product"],
            "hs_code": record["hs_code"],
            "description": record["description"],
            "chapter": record["chapter"],
            "mfn_tariff": record["mfn_tariff"],
            "fta_results": record["fta_results"],
            "best_fta": record["best_fta"],
            "best_saving": record["best_saving"],
            "reason": classification.get("reason", "Klasifikasi terverifikasi sistem."),
            "data_source": "Indonesia Customs Database (Verifikasi Preferensial)"
        }

    # ── Step 3: Dynamic AI Fallback (Gemini-generated record) ──
    logger.info(f"HS Code Lookup: Missing in database. Querying Gemini to generate dynamic rates for: {product_name} (predicted: {hscode_6})")
    
    # If Gemini couldn't map, we let it generate a complete Indonesian-specific 8-digit record
    fallback_prompt = f"""You are a customs consultant for Indonesian MSEs (UMKM).
Generate a realistic Indonesian 8-digit HS Code classification and custom tariff preference rates for the product: "{product_name}".
Predicted 6-digit prefix is: "{hscode_6 or 'Unknown'}".

Provide:
1. A valid 8-digit HS code format (e.g. '1234.56.78').
2. Official product description in Indonesian (professional customs style).
3. The correct Harmonized System Chapter (e.g., 'Chapter 64 — Alas Kaki').
4. Estimated MFN (Most Favored Nation) tariff range (e.g., '10% - 15%').
5. A list of 2-4 applicable Free Trade Agreements (FTAs) that Indonesia participates in (e.g., ACFTA, IJEPA, AKFTA, IA-CEPA, RCEP, AANZFTA, AIFTA). For each, estimate the preferential tariff rate (often 0% or reduced) and calculated saving (e.g., in local currency per container/shipment).
6. The best FTA option and its potential saving description in Indonesian.

Return your response as a JSON object matching this schema:
{{
  "product": "clean product name in Indonesian",
  "hs_code": "8-digit HS code (e.g., '6403.91.90')",
  "description": "official-sounding Indonesian customs description",
  "chapter": "Chapter XX — [Chapter Name]",
  "mfn_tariff": "tariff range (e.g., '15%')",
  "fta_results": [
    {{
      "agreement": "Agreement Name (e.g., 'ACFTA (Tiongkok)')",
      "tariff": "percentage (e.g., '0%')",
      "saving": "saving description in Indonesian",
      "status": "status (e.g., 'Berlaku (Form E)')"
    }}
  ],
  "best_fta": "best FTA agreement name",
  "best_saving": "saving summary in Indonesian (e.g., 'Tarif preferensi 0% dengan Form E')"
}}

Respond ONLY with valid JSON."""

    dynamic_record = _call_gemini_json(fallback_prompt)
    if dynamic_record:
        # Validate critical fields are present
        required_keys = ["product", "hs_code", "description", "chapter", "mfn_tariff", "fta_results", "best_fta", "best_saving"]
        if all(k in dynamic_record for k in required_keys):
            dynamic_record["reason"] = classification.get("reason", "Hasil klasifikasi dinamis AI.") if classification else "Klasifikasi otomatis AI."
            dynamic_record["data_source"] = "NusantaraExport.AI Real-Time Tariff Estimator"
            return dynamic_record

    # ── Step 4: True Hardcoded Fallback (in case API is completely offline/fails) ──
    logger.warning("Dynamic AI classification failed completely. Returning hardcoded placeholder.")
    return {
        "product": product_name,
        "hs_code": "0000.00.00",
        "description": "Klasifikasi sistem gagal. Silakan masukkan deskripsi produk yang lebih spesifik.",
        "chapter": "Klasifikasi memerlukan data lebih detail",
        "mfn_tariff": "5-30%",
        "fta_results": [
            {"agreement": "ACFTA (Tiongkok)", "tariff": "0-5%", "saving": "Bervariasi", "status": "Perlu Verifikasi"},
            {"agreement": "IJEPA (Jepang)", "tariff": "0-8%", "saving": "Bervariasi", "status": "Perlu Verifikasi"}
        ],
        "best_fta": "ACFTA atau IJEPA",
        "best_saving": "Tarif preferensial bervariasi tergantung kesepakatan FTA",
        "reason": "Gagal terhubung dengan mesin klasifikasi AI.",
        "data_source": "System Offline Fallback"
    }
