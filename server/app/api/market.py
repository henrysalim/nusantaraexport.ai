from fastapi import APIRouter
from pydantic import BaseModel
from app.services.comtrade_service import get_market_data, calculate_market_gap

router = APIRouter()

class GapRequest(BaseModel):
    hs_code: str # e.g. '0906'
    destination_country_code: str = '0' # '0' for World

@router.post("/analyze")
async def analyze_gap(request: GapRequest):
    # Indonesian exporter code is 360
    idn_data = get_market_data("360", request.destination_country_code, request.hs_code)
    
    # Simple aggregation for ROI/Gap scoring
    # In a real app, we would sum the 'primaryValue' for the current year
    idn_export = 0
    global_import = 0
    
    for item in idn_data:
        if item.get('flowCode') == 'X': # Export
            idn_export += item.get('primaryValue', 0)
        if item.get('flowCode') == 'M': # Import
            global_import += item.get('primaryValue', 0)

    gap_score = calculate_market_gap(global_import, idn_export)
    
    return {
        "hs_code": request.hs_code,
        "idn_export_usd": idn_export,
        "global_demand_usd": global_import,
        "gap_score": round(gap_score, 2),
        "opportunity_level": "High" if gap_score > 70 else "Medium" if gap_score > 40 else "Low"
    }
