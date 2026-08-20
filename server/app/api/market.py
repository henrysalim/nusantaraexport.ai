"""
Market Routes — Market Gap Analysis powered by UN COMTRADE live data.

Flow:
  1. Resolve product input (name or HS code) → 4-digit HS prefix via comtrade_service.
  2. Attempt live UN COMTRADE API call (fetch_market_analysis).
  3. On COMTRADE failure → serve from market_fallback.json (fetch_fallback_analysis).
  4. AI summary always generated from actual data figures (never hardcoded text).
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.middleware import get_current_user
from app.services.comtrade_service import (
    resolve_hs_prefix,
    fetch_market_analysis,
    fetch_fallback_analysis,
)
from app.services.cendol_service import CendolNLPService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────────────

class GapRequest(BaseModel):
    hs_code: str = ""
    destination_country_code: str = "0"
    product_name: str = ""


class GapResponse(BaseModel):
    product: str
    hs_code: str
    top_destinations: list
    gap_score: float
    avg_price: str
    growth: str
    idn_export_usd: float
    global_demand_usd: float
    opportunity_level: str
    ai_summary: str
    data_source: str


# ──────────────────────────────────────────────────────
# Core endpoint
# ──────────────────────────────────────────────────────

@router.post("/analyze", response_model=GapResponse)
def analyze_gap(
    request: GapRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Analyze market gap for a given product.
    Tries live COMTRADE data first; falls back to structured JSON.
    """
    # Step 1: Resolve to a usable HS code
    product_input = request.hs_code or request.product_name
    hs_prefix = resolve_hs_prefix(product_input) if product_input else None
    # Use the raw hs_code for COMTRADE (longer codes are more precise)
    hs_for_api = request.hs_code.replace(".", "").strip() if request.hs_code else (hs_prefix or "")

    # Step 2: Try live COMTRADE data
    market_data = None
    if hs_for_api:
        market_data = fetch_market_analysis(hs_for_api, request.product_name)
        if market_data:
            logger.info(f"COMTRADE live data used for hs={hs_for_api}")
        else:
            logger.info(f"COMTRADE returned no data for hs={hs_for_api} — switching to fallback.")

    # Step 3: Fallback to JSON if COMTRADE unavailable
    if not market_data:
        market_data = fetch_fallback_analysis(hs_prefix, request.product_name)

    # Step 4: Generate AI summary from real figures
    ai_summary = _generate_ai_summary(
        product=market_data["product"],
        gap_score=market_data["gap_score"],
        idn_export=market_data["idn_export_usd"],
        global_demand=market_data["global_demand_usd"],
        growth=market_data["growth"],
        top_destinations=market_data["top_destinations"],
        data_source=market_data["data_source"],
    )

    return GapResponse(
        product=market_data["product"],
        hs_code=market_data.get("hs_code", hs_for_api or "N/A"),
        top_destinations=market_data["top_destinations"],
        gap_score=market_data["gap_score"],
        avg_price=market_data["avg_price"],
        growth=market_data["growth"],
        idn_export_usd=float(market_data["idn_export_usd"]),
        global_demand_usd=float(market_data["global_demand_usd"]),
        opportunity_level=market_data["opportunity_level"],
        ai_summary=ai_summary,
        data_source=market_data["data_source"],
    )


@router.post("/gap-analysis", response_model=GapResponse)
def gap_analysis(
    request: GapRequest,
    current_user: dict = Depends(get_current_user),
):
    """Alias endpoint for frontend compatibility."""
    return analyze_gap(request, current_user)


# ──────────────────────────────────────────────────────
# AI Summary Generator
# ──────────────────────────────────────────────────────

def _generate_ai_summary(
    product: str,
    gap_score: float,
    idn_export: float,
    global_demand: float,
    growth: str,
    top_destinations: list,
    data_source: str,
) -> str:
    """
    Build a dynamic AI summary from real figures using Gemini 3.1 Flash-Lite.
    """
    top_country = top_destinations[0]["country"] if top_destinations else "pasar global"
    idn_export_b = idn_export / 1_000_000_000
    global_demand_b = global_demand / 1_000_000_000
    idn_share_pct = round((idn_export / global_demand * 100), 1) if global_demand > 0 else 0

    prompt = (
        f"Anda adalah Analis Perdagangan Internasional NusantaraExport.AI.\n"
        f"Analisis peluang pasar & potensi ekspor produk '{product}' dari Indonesia dengan data akurat berikut:\n"
        f"- Nilai Ekspor Indonesia: USD {idn_export_b:.2f} Miliar\n"
        f"- Permintaan Impor Global: USD {global_demand_b:.2f} Miliar (Pangsa RI: {idn_share_pct}%)\n"
        f"- Pertumbuhan Impor Global: {growth}\n"
        f"- Market Gap Score: {gap_score}/100\n"
        f"- Pasar Utama Tujuan: {top_country}\n"
        f"- Sumber Data: {data_source}\n\n"
        f"Tuliskan analisis 3 paragraf rapi dan profesional dalam bahasa Indonesia yang berfokus pada:\n"
        f"1. **Peluang Pasar Utama**: Kenapa pasar {top_country} dan global sangat potensial untuk komoditas {product}.\n"
        f"2. **Pemanfaatan Perjanjian Dagang (FTA)**: Strategi memanfaatkan insentif bea tarif nol/rendah (misal RCEP, Form E, Form IJEPA).\n"
        f"3. **Langkah Konkret UMKM**: Rekomendasi 2 tindakan praktis untuk pengusaha UMKM."
    )

    ai_result = CendolNLPService.generate_response(prompt, context="")

    if ai_result:
        return ai_result

    # Structured fallback template (always deterministic, always informative)
    opportunity = "luar biasa" if gap_score > 80 else "besar" if gap_score > 60 else "cukup"
    return (
        f"Indonesia mengekspor {product} senilai USD {idn_export_b:.1f} miliar dari total permintaan "
        f"global USD {global_demand_b:.1f} miliar — menunjukkan market gap score {gap_score}/100 dengan "
        f"peluang {opportunity} untuk UMKM. "
        f"Pasar utama adalah {top_country} dengan pertumbuhan ekspor {growth}, "
        f"tingkat peluang dinilai '{market_data_opportunity(gap_score)}' berdasarkan {data_source}."
    )


def market_data_opportunity(gap_score: float) -> str:
    if gap_score > 80:
        return "Sangat Tinggi"
    elif gap_score > 60:
        return "Tinggi"
    elif gap_score > 40:
        return "Sedang"
    return "Rendah"
