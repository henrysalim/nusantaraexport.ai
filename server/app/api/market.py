"""
Market Routes — Market Gap Analysis with UN COMTRADE integration + mock fallback.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.middleware import get_current_user
from app.services.comtrade_service import get_market_data, calculate_market_gap
from app.services.mock_data import MARKET_DATA
from app.services.cendol_service import CendolNLPService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GapRequest(BaseModel):
    hs_code: str = ""
    destination_country_code: str = "0"
    product_name: str = ""


class GapResponse(BaseModel):
    product: str
    top_destinations: list
    gap_score: float
    avg_price: str
    growth: str
    idn_export_usd: float
    global_demand_usd: float
    opportunity_level: str
    ai_summary: str = ""


@router.post("/analyze")
def analyze_gap(request: GapRequest, current_user: dict = Depends(get_current_user)):
    """Analyze market gap with COMTRADE data + mock fallback."""
    # Try real COMTRADE API first
    try:
        if request.hs_code:
            idn_data = get_market_data("360", request.destination_country_code, request.hs_code)
            if idn_data:
                idn_export = sum(item.get('primaryValue', 0) for item in idn_data if item.get('flowCode') == 'X')
                global_import = sum(item.get('primaryValue', 0) for item in idn_data if item.get('flowCode') == 'M')
                gap_score = calculate_market_gap(global_import, idn_export)

                prompt = f"Berikan 2 kalimat ringkasan profesional terkait potensi ekspor produk dengan HS Code {request.hs_code} dari Indonesia berdasarkan analisis pasar global."
                dynamic_summary = CendolNLPService._call_backup_llm(prompt, "") or "Potensi pasar global cukup menjanjikan berdasarkan rasio ekspor-impor."

                return {
                    "product": request.product_name or request.hs_code,
                    "top_destinations": ["Global"],
                    "avg_price": "N/A",
                    "growth": "N/A",
                    "idn_export_usd": idn_export,
                    "global_demand_usd": global_import,
                    "gap_score": round(gap_score, 2),
                    "opportunity_level": "High" if gap_score > 70 else "Medium" if gap_score > 40 else "Low",
                    "ai_summary": dynamic_summary
                }
    except Exception as e:
        logger.warning(f"COMTRADE API failed, using mock data: {e}")

    # Fallback to mock data
    product_key = _match_product(request.product_name or request.hs_code)
    data = MARKET_DATA.get(product_key, MARKET_DATA.get("kopi"))

    prompt = f"Berikan 2 kalimat ringkasan profesional terkait tren ekspor produk '{product_key}' dari Indonesia ke pasar global."
    dynamic_summary = CendolNLPService._call_backup_llm(prompt, "") or "Potensi ekspor komoditas ini terus berkembang di pasar global."

    return GapResponse(
        product=request.product_name or product_key,
        top_destinations=data["top_destinations"],
        gap_score=data["gap_score"],
        avg_price=data["avg_price"],
        growth=data["growth"],
        idn_export_usd=data["idn_export_usd"],
        global_demand_usd=data["global_demand_usd"],
        opportunity_level="High" if data["gap_score"] > 70 else "Medium" if data["gap_score"] > 40 else "Low",
        ai_summary=dynamic_summary
    )


@router.post("/gap-analysis")
def gap_analysis(request: GapRequest, current_user: dict = Depends(get_current_user)):
    """Alias endpoint for frontend compatibility."""
    return analyze_gap(request, current_user)


def _match_product(name: str) -> str:
    """Match product name to mock data key."""
    n = name.lower()
    if any(w in n for w in ["kopi", "coffee", "arabika", "robusta"]):
        return "kopi"
    if any(w in n for w in ["singkong", "keripik", "cassava"]):
        return "singkong"
    if any(w in n for w in ["kayu", "wood", "kerajinan", "furniture"]):
        return "kayu"
    return "kopi"  # Default
