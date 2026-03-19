import requests
import os
from dotenv import load_dotenv

load_dotenv()

# UN COMTRADE API Base URL (Standard V2 API)
# Note: In production, use subscription keys. For MVP, we use the public limits.
UN_COMTRADE_BASE_URL = "https://comtradeapi.un.org/public/v1/getdata"

def get_market_data(reporter_code: str, partner_code: str, cmd_code: str, year: str = "2023"):
    """
    Fetch trade data from UN COMTRADE API.
    Ref: https://comtradewiki.un.org/
    
    reporter_code: M49 code for reporting country (e.g., '360' for Indonesia)
    partner_code: M49 code for partner country (e.g., '0' for World)
    cmd_code: HS Code (e.g., '0906' for Cinnamon)
    """
    params = {
        "reporterCode": reporter_code,
        "period": year,
        "partnerCode": partner_code,
        "cmdCode": cmd_code,
        "flowCode": "M,X", # Import (M) and Export (X)
        "format": "JSON"
    }
    
    try:
        response = requests.get(UN_COMTRADE_BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Parse and summarize data for the Gap Detector
        return data.get("data", [])
    except Exception as e:
        print(f"Error fetching UN COMTRADE data: {e}")
        return []

def calculate_market_gap(global_import_value: float, idn_export_value: float):
    """
    Simple logic to calculate market gap score (0-100).
    Higher gap means more opportunity for Indonesia to fill.
    """
    if global_import_value == 0:
        return 0
    
    gap_ratio = (global_import_value - idn_export_value) / global_import_value
    return min(max(gap_ratio * 100, 0), 100)
