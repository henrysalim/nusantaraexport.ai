"""
Nego Coach Service — Real-time commodity price intelligence & negotiation strategy.
Uses gemini-3.1-flash-lite to fetch live commodity price benchmarks and generate
professional counter-offer emails for Indonesian MSE exporters.
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


def _call_gemini(prompt: str, max_tokens: int = 600, json_mode: bool = False) -> Optional[str]:
    """Low-level Gemini REST call. Returns raw text or None on failure."""
    key = _get_gemini_key()
    if not key:
        logger.warning("GEMINI_API_KEY not set — skipping Gemini call.")
        return None
    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={key}"
        gen_config = {"temperature": 0.15, "maxOutputTokens": max_tokens}
        if json_mode:
            gen_config["responseMimeType"] = "application/json"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": gen_config,
        }
        resp = requests.post(url, json=payload, timeout=25)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini call failed: {e}")
        return None


def get_commodity_benchmark(commodity: str, destination: str, incoterm: str) -> dict:
    """
    Ask Gemini to estimate current international commodity price benchmarks
    for an Indonesian-origin product exported to a specific destination.

    Returns:
        {
          "price_min": float,   # USD/kg
          "price_avg": float,
          "price_max": float,
          "unit": "USD/kg",
          "source_note": str,   # e.g. "Based on ICO Monthly Bulletin..."
          "destination_note": str  # e.g. freight/tariff context
        }
    """
    prompt = f"""You are a senior commodity price analyst specializing in Indonesian agricultural and handicraft exports.

Provide realistic current international market price benchmarks for:
  - Product: "{commodity}"
  - Origin: Indonesia
  - Destination: {destination}
  - Trade term: {incoterm}

Base your answer on the most recent publicly available data from sources like:
  ICO (coffee), FAO FPMA (food), World Bank Commodity Markets, ITC Trade Map, or industry associations.

Return a JSON object:
{{
  "price_min": <float, USD per kg, realistic low end>,
  "price_avg": <float, USD per kg, realistic average>,
  "price_max": <float, USD per kg, realistic high end>,
  "unit": "USD/kg",
  "source_note": "<one sentence citing the reference you used>",
  "destination_note": "<one sentence about freight/tariff implications for {destination}>"
}}

Be precise and realistic. If price data is uncertain, widen the range rather than inventing a number.
Respond ONLY with valid JSON."""

    raw = _call_gemini(prompt, max_tokens=400, json_mode=True)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            data = json.loads(raw)
            return {
                "price_min": float(data.get("price_min", 0)),
                "price_avg": float(data.get("price_avg", 0)),
                "price_max": float(data.get("price_max", 0)),
                "unit": "USD/kg",
                "source_note": data.get("source_note", "Estimasi pasar internasional."),
                "destination_note": data.get("destination_note", ""),
            }
        except Exception as e:
            logger.warning(f"Failed to parse benchmark response: {e}")
    return None


def calculate_counter_offer(
    commodity: str,
    buyer_offer: float,
    quantity_kg: float,
    destination: str,
    incoterm: str,
    benchmark: dict,
) -> dict:
    """
    Ask Gemini to recommend a smart counter-offer strategy given the buyer's offer
    and the real market benchmark.

    Returns:
        {
          "counter_price": float,
          "counter_rationale": str,
          "walk_away_price": float,
          "margin_pct": float,
          "recommendation": str
        }
    """
    prompt = f"""You are an export negotiation strategist for Indonesian MSE (UMKM) exporters.

Situation:
  - Product: "{commodity}" (Indonesia origin)
  - Buyer's offer: USD {buyer_offer:.2f}/kg ({incoterm} {destination})
  - Quantity: {quantity_kg:,.0f} kg
  - Market benchmark: USD {benchmark['price_min']:.2f} – {benchmark['price_max']:.2f}/kg (avg: USD {benchmark['price_avg']:.2f}/kg)
  - {benchmark.get('destination_note', '')}

Task: Recommend a negotiation strategy.

Return a JSON object:
{{
  "counter_price": <float, recommended counter-offer in USD/kg, realistic and defensible>,
  "counter_rationale": "<one sentence in Indonesian explaining why this counter is fair>",
  "walk_away_price": <float, minimum acceptable price per kg>,
  "margin_pct": <float, percentage margin of buyer offer vs market average, negative = below market>,
  "recommendation": "<one emoji + concise Indonesian verdict, e.g. '⚠️ Tawaran buyer TERLALU RENDAH. Wajib counter-offer!'>",
  "negotiation_tips": ["<tip 1 in Indonesian>", "<tip 2>", "<tip 3>"]
}}

Respond ONLY with valid JSON."""

    raw = _call_gemini(prompt, max_tokens=500, json_mode=True)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            data = json.loads(raw)
            return {
                "counter_price": float(data.get("counter_price", benchmark["price_avg"] * 0.97)),
                "counter_rationale": data.get("counter_rationale", ""),
                "walk_away_price": float(data.get("walk_away_price", benchmark["price_min"])),
                "margin_pct": float(data.get("margin_pct", 0)),
                "recommendation": data.get("recommendation", "📊 Analisis pasar diperlukan."),
                "negotiation_tips": data.get("negotiation_tips", []),
            }
        except Exception as e:
            logger.warning(f"Failed to parse counter-offer response: {e}")
    # Deterministic fallback
    avg = benchmark["price_avg"]
    margin = ((buyer_offer - avg) / avg) * 100
    counter = round(avg * 0.97, 2)
    rec = (
        "⚠️ Tawaran buyer TERLALU RENDAH. Wajib counter-offer!" if margin < 10
        else "📊 Tawaran di bawah rata-rata. Negosiasi disarankan." if margin < 25
        else "✅ Tawaran cukup baik. Pertimbangkan untuk menerima."
    )
    return {
        "counter_price": counter,
        "counter_rationale": f"Counter-offer {counter:.2f} USD/kg berdasarkan rata-rata pasar internasional.",
        "walk_away_price": round(benchmark["price_min"] * 0.95, 2),
        "margin_pct": round(margin, 1),
        "recommendation": rec,
        "negotiation_tips": [],
    }


def generate_email_draft(
    commodity: str,
    buyer_offer: float,
    counter_price: float,
    quantity_kg: float,
    destination: str,
    incoterm: str,
    benchmark: dict,
) -> str:
    """
    Generate a professional bilingual (English) negotiation counter-offer email
    for Indonesian exporters using Gemini 3.1 Flash Lite.
    """
    prompt = f"""Write a professional, polite, and confident negotiation counter-offer email in English on behalf of an Indonesian MSE (UMKM) exporter.

Situation:
  - Product: {commodity} (premium Indonesian origin)
  - Buyer's offer: USD {buyer_offer:.2f}/kg ({incoterm} {destination})
  - Our counter-offer: USD {counter_price:.2f}/kg ({incoterm} {destination})
  - Quantity: {quantity_kg:,.0f} kg
  - Market reference: avg USD {benchmark['price_avg']:.2f}/kg ({benchmark.get('source_note', 'international market data')})

Email requirements:
  1. Thank the buyer for their offer
  2. Politely decline their price, citing market benchmarks
  3. Clearly state our counter-offer price and total order value
  4. Emphasize quality, certifications, and reliability of Indonesian origin
  5. Suggest next steps (e.g., video call, sample shipment, payment terms)
  6. Keep it under 200 words
  7. Professional signature placeholder

Output ONLY the email body (no subject line, no labels). Start with "Dear [Buyer Name],"."""

    draft = _call_gemini(prompt, max_tokens=500)
    if draft:
        return draft

    # Structured English fallback
    total = buyer_offer * quantity_kg
    counter_total = counter_price * quantity_kg
    return (
        f"Dear [Buyer Name],\n\n"
        f"Thank you for your interest in our premium {commodity} from Indonesia.\n\n"
        f"We have carefully reviewed your offer of USD {buyer_offer:.2f}/kg. "
        f"Based on current international market benchmarks (avg: USD {benchmark['price_avg']:.2f}/kg — {benchmark.get('source_note', 'market data')}), "
        f"we would like to respectfully propose a counter-offer of USD {counter_price:.2f}/kg "
        f"({incoterm} {destination}) for the full quantity of {quantity_kg:,.0f} kg "
        f"(total value: USD {counter_total:,.0f}).\n\n"
        f"Our products are certified and traceable to origin, ensuring compliance with your import regulations. "
        f"We can arrange shipment within 21 days of advance payment (30% T/T, 70% L/C at sight).\n\n"
        f"We look forward to your response and hope to build a long-term business partnership.\n\n"
        f"Warm regards,\n[Your Company Name]\n[Contact Information]"
    )


# ── Static fallback benchmark table (used if Gemini is offline) ──
FALLBACK_BENCHMARKS = {
    "kopi":     {"price_min": 3.80, "price_avg": 4.50, "price_max": 5.80, "unit": "USD/kg",
                 "source_note": "ICO Composite Price Index (fallback estimate).",
                 "destination_note": "Harga bervariasi tergantung grade dan sertifikasi (Organic, Fair Trade)."},
    "kakao":    {"price_min": 2.80, "price_avg": 3.50, "price_max": 4.20, "unit": "USD/kg",
                 "source_note": "ICCO Daily Price (fallback estimate).",
                 "destination_note": "Tarif MFN UE 6.1%, dapat 0% dengan GSP+."},
    "rempah":   {"price_min": 4.50, "price_avg": 7.00, "price_max": 11.0, "unit": "USD/kg",
                 "source_note": "ITC Trade Map spice prices (fallback estimate).",
                 "destination_note": "Jahe dan kunyit premium ke Jepang/EU meningkat 15% YoY."},
    "kayu":     {"price_min": 12.0, "price_avg": 25.0, "price_max": 55.0, "unit": "USD/kg",
                 "source_note": "Timber Trade Federation price guide (fallback estimate).",
                 "destination_note": "Wajib sertifikasi SVLK/FLEGT untuk ekspor ke UE."},
    "tekstil":  {"price_min": 8.00, "price_avg": 18.0, "price_max": 35.0, "unit": "USD/kg",
                 "source_note": "Tekstil & kerajinan batik (fallback estimate).",
                 "destination_note": "Pasar premium Jepang dan Korea menerima harga lebih tinggi untuk keaslian."},
    "default":  {"price_min": 2.00, "price_avg": 5.00, "price_max": 10.0, "unit": "USD/kg",
                 "source_note": "Estimasi umum produk ekspor Indonesia.",
                 "destination_note": "Harga bergantung pada grade produk dan sertifikasi."},
}


def get_fallback_benchmark(commodity: str) -> dict:
    """Return the best matching static benchmark for offline use."""
    comm_lower = commodity.lower()
    for key in FALLBACK_BENCHMARKS:
        if key != "default" and key in comm_lower:
            return FALLBACK_BENCHMARKS[key].copy()
    return FALLBACK_BENCHMARKS["default"].copy()
