"""
COMTRADE Service — Live UN COMTRADE API integration with caching and fallback.

API: https://comtradeapi.un.org/data/v1/get/C/A/HS
Auth: Ocp-Apim-Subscription-Key header (set via COMTRADE_API_KEY env var)
Limits: 500 calls/day on free tier — protected by 1-hour in-memory TTL cache.
"""
import os
import json
import time
import logging
import requests
from pathlib import Path
from functools import wraps
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────
COMTRADE_BASE_URL = "https://comtradeapi.un.org/data/v1/get/C/A/HS"
COMTRADE_API_KEY = os.getenv("COMTRADE_API_KEY", "")
INDONESIA_CODE = "360"   # UN M49 code for Indonesia
CACHE_TTL_SECONDS = 3600  # 1 hour — respects the 500 calls/day free tier limit

FALLBACK_JSON_PATH = Path(__file__).parent / "market_fallback.json"

# ──────────────────────────────────────────────────────
# Simple TTL Cache (no Redis required)
# ──────────────────────────────────────────────────────
_cache: dict = {}  # {cache_key: {"data": ..., "ts": float}}


def _cached(fn):
    """Decorator: caches the return value keyed by function args for CACHE_TTL_SECONDS."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        key = f"{fn.__name__}:{args}:{kwargs}"
        entry = _cache.get(key)
        if entry and (time.time() - entry["ts"]) < CACHE_TTL_SECONDS:
            logger.debug(f"Cache HIT: {key}")
            return entry["data"]
        result = fn(*args, **kwargs)
        if result is not None:
            _cache[key] = {"data": result, "ts": time.time()}
        return result
    return wrapper


# ──────────────────────────────────────────────────────
# Fallback JSON loader
# ──────────────────────────────────────────────────────
_fallback_db: Optional[dict] = None


def _load_fallback() -> dict:
    """Load market_fallback.json (lazy, cached in memory)."""
    global _fallback_db
    if _fallback_db is None:
        try:
            with open(FALLBACK_JSON_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
            # Strip the _meta key
            _fallback_db = {k: v for k, v in raw.items() if not k.startswith("_")}
            logger.info(f"Loaded market fallback DB: {len(_fallback_db)} commodities.")
        except Exception as e:
            logger.error(f"Failed to load market_fallback.json: {e}")
            _fallback_db = {}
    return _fallback_db


# ──────────────────────────────────────────────────────
# HS Code Resolver
# ──────────────────────────────────────────────────────
def resolve_hs_prefix(product_input: str) -> Optional[str]:
    """
    Resolve a free-text product name OR raw HS code to a 4-digit HS prefix
    that exists in the fallback DB.

    Priority:
    1. If input is numeric, strip to 4 digits and match against fallback DB.
    2. If input is text, scan keyword arrays in the fallback DB.
    3. Return None if no match found.
    """
    db = _load_fallback()
    if not db:
        return None

    inp = product_input.strip()

    # Rule 1: Numeric HS code input
    if inp.replace(".", "").replace(" ", "").isdigit():
        digits = inp.replace(".", "").replace(" ", "")
        prefix_4 = digits[:4]
        if prefix_4 in db:
            return prefix_4
        # Try 2-digit chapter fallback
        prefix_2 = digits[:2]
        for key in db:
            if key.startswith(prefix_2):
                return key
        return None

    # Rule 2: Text keyword matching (case-insensitive)
    inp_lower = inp.lower()
    best_match_key = None
    best_match_count = 0

    for hs_prefix, entry in db.items():
        keywords = entry.get("keywords", [])
        matched = sum(1 for kw in keywords if kw in inp_lower)
        if matched > best_match_count:
            best_match_count = matched
            best_match_key = hs_prefix

    return best_match_key if best_match_count > 0 else None


# ──────────────────────────────────────────────────────
# UN COMTRADE API calls
# ──────────────────────────────────────────────────────
@_cached
def get_comtrade_data(
    reporter_code: str,
    partner_code: str,
    cmd_code: str,
    period: str = "2023",
    flow_code: str = "X",
) -> list:
    """
    Fetch raw trade records from UN COMTRADE v1 API.

    reporter_code: M49 code of the reporting country (e.g., '360' for Indonesia)
    partner_code:  M49 code of trading partner ('0' for World aggregate, '' for per-partner breakdown)
    cmd_code:      HS commodity code (e.g., '090121' or '0901')
    period:        Reference year (e.g., '2023')
    flow_code:     'X' for exports, 'M' for imports (default 'X')
    """
    if not COMTRADE_API_KEY:
        logger.warning("COMTRADE_API_KEY not set — skipping live API call.")
        return []

    params = {
        "reporterCode": reporter_code,
        "period": period,
        "cmdCode": cmd_code,
        "flowCode": flow_code,
        "maxRecords": 500,
        "format": "JSON",
        "includeDesc": True,
    }
    # Only add partnerCode if explicitly provided (omitting it gives per-partner breakdown)
    if partner_code:
        params["partnerCode"] = partner_code

    headers = {"Ocp-Apim-Subscription-Key": COMTRADE_API_KEY}

    try:
        response = requests.get(COMTRADE_BASE_URL, params=params, headers=headers, timeout=20)
        response.raise_for_status()
        data = response.json()
        records = data.get("data", [])
        logger.info(f"COMTRADE returned {len(records)} records for cmd={cmd_code}, reporter={reporter_code}, flow={flow_code}.")
        return records
    except requests.exceptions.HTTPError as e:
        logger.warning(f"COMTRADE HTTP error (cmd={cmd_code}): {e} — response: {getattr(e.response, 'text', '')[:200]}")
    except Exception as e:
        logger.warning(f"COMTRADE call failed (cmd={cmd_code}): {e}")
    return []


@_cached
def get_export_by_partner(cmd_code: str, period: str = "2023") -> list:
    """
    Fetch Indonesia's exports of a commodity broken down by destination country.
    Query: reporter=Indonesia, no partnerCode filter → COMTRADE returns one record per partner.
    Returns list of {country, country_code, export_usd} sorted by export value desc.
    """
    if not COMTRADE_API_KEY:
        return []

    # reporter=Indonesia, flow=X, no partnerCode → per-partner export breakdown
    records = get_comtrade_data(INDONESIA_CODE, "", cmd_code, period, flow_code="X")

    # Aggregate by country_code — COMTRADE may return multiple sub-rows per partner
    agg: dict = {}
    for r in records:
        partner_code = str(r.get("partnerCode", ""))
        # Exclude 'World' aggregate (code 0) and unspecified (code 999)
        if partner_code in ("", "0", "999"):
            continue
        value = r.get("primaryValue", 0)
        if value > 0:
            if partner_code not in agg:
                agg[partner_code] = {
                    "country": r.get("partnerDesc", "Unknown"),
                    "country_code": partner_code,
                    "export_usd": 0,
                }
            agg[partner_code]["export_usd"] += value

    destinations = sorted(agg.values(), key=lambda x: x["export_usd"], reverse=True)
    return destinations[:5]


# ──────────────────────────────────────────────────────
# Market Gap Calculator
# ──────────────────────────────────────────────────────
def calculate_market_gap(
    global_import_usd: float,
    idn_export_usd: float,
    prev_idn_export_usd: Optional[float] = None,
) -> dict:
    """
    Calculate market gap score and YoY growth.

    gap_score (0-100): How much of global demand Indonesia is NOT yet filling.
    Higher = bigger opportunity.

    growth_pct: YoY change in Indonesia's exports (requires prev year data).
    """
    if global_import_usd <= 0:
        return {"gap_score": 0.0, "growth_pct": None}

    gap_ratio = (global_import_usd - idn_export_usd) / global_import_usd
    gap_score = round(min(max(gap_ratio * 100, 0), 100), 2)

    growth_pct = None
    if prev_idn_export_usd and prev_idn_export_usd > 0:
        growth_pct = round(((idn_export_usd - prev_idn_export_usd) / prev_idn_export_usd) * 100, 1)

    return {"gap_score": gap_score, "growth_pct": growth_pct}


# ──────────────────────────────────────────────────────
# High-level convenience: full market analysis
# ──────────────────────────────────────────────────────
def fetch_market_analysis(hs_code: str, product_name: str = "") -> Optional[dict]:
    """
    Full live COMTRADE market analysis for a given HS code.

    Data strategy:
    - idn_export: live from COMTRADE (reporter=IDN, partner=World, flow=X)
    - global_demand: from fallback JSON (pre-researched COMTRADE baseline — avoids
      the 'IDN imports from world' mistake when using M flow on IDN as reporter)
    - top_destinations: live per-partner export breakdown from COMTRADE;
      falls back to fallback JSON destinations if COMTRADE returns none
    - growth: live YoY comparison (2022 vs 2023 IDN exports)
    - avg_price: from fallback JSON (COMTRADE does not expose unit prices in v1)
    """
    if not COMTRADE_API_KEY:
        return None

    try:
        # ── Step 1: IDN export totals (flow=X only, partner=World aggregate) ──
        records_2023 = get_comtrade_data(INDONESIA_CODE, "0", hs_code, "2023", flow_code="X")
        records_2022 = get_comtrade_data(INDONESIA_CODE, "0", hs_code, "2022", flow_code="X")

        if not records_2023:
            logger.info(f"COMTRADE: no 2023 export records for hs={hs_code}, falling back.")
            return None

        idn_export_2023 = sum(r.get("primaryValue", 0) for r in records_2023)
        idn_export_2022 = sum(r.get("primaryValue", 0) for r in records_2022)

        if idn_export_2023 == 0:
            return None

        # ── Step 2: Global demand — use fallback JSON baseline ──
        # Rationale: COMTRADE v1 does not support reporter=World (code 0).
        # Using IDN's M-flow would give Indonesia's own imports, not global demand.
        hs_prefix = resolve_hs_prefix(hs_code)
        fb = fetch_fallback_analysis(hs_prefix, product_name)
        global_demand = fb.get("global_demand_usd", 0)
        avg_price = fb.get("avg_price", "N/A")

        # ── Step 3: Gap score and growth ──
        gap_result = calculate_market_gap(global_demand, idn_export_2023, idn_export_2022)

        growth_pct = gap_result.get("growth_pct")
        growth_str = (
            f"+{growth_pct}%" if growth_pct is not None and growth_pct >= 0
            else f"{growth_pct}%" if growth_pct is not None
            else fb.get("growth", "N/A")  # use fallback growth if no 2022 data
        )

        # ── Step 4: Top destinations — live per-partner breakdown ──
        partners_raw = get_export_by_partner(hs_code, "2023")
        top_destinations = []
        if partners_raw:
            max_export = max(d["export_usd"] for d in partners_raw)
            for d in partners_raw:
                score = round((d["export_usd"] / max_export) * 100) if max_export > 0 else 50
                top_destinations.append({
                    "country": d["country"],
                    "country_code": d["country_code"],
                    "flag": _flag_from_code(d["country_code"]),
                    "score": score,
                    "demand_usd": d["export_usd"],
                })
        else:
            # Fall back to JSON destinations (annotated with live export data)
            top_destinations = fb.get("top_destinations", [])

        gap_score = gap_result["gap_score"]
        return {
            "product": product_name or fb.get("product", hs_code),
            "hs_code": hs_code,
            "top_destinations": top_destinations,
            "gap_score": gap_score,
            "avg_price": avg_price,
            "growth": growth_str,
            "idn_export_usd": idn_export_2023,
            "global_demand_usd": global_demand,
            "opportunity_level": (
                "Sangat Tinggi" if gap_score > 80
                else "Tinggi" if gap_score > 60
                else "Sedang" if gap_score > 40
                else "Rendah"
            ),
            "data_source": "UN COMTRADE Live 2023 + Fallback Baseline",
        }

    except Exception as e:
        logger.error(f"fetch_market_analysis error (hs={hs_code}): {e}")
        return None


# Country code → flag emoji map (ISO 3166-1 numeric → alpha-2 → flag)
_FLAG_MAP = {
    "392": "🇯🇵", "842": "🇺🇸", "276": "🇩🇪", "410": "🇰🇷", "156": "🇨🇳",
    "528": "🇳🇱", "826": "🇬🇧", "036": "🇦🇺", "702": "🇸🇬", "356": "🇮🇳",
    "458": "🇲🇾", "764": "🇹🇭", "608": "🇵🇭", "704": "🇻🇳", "380": "🇮🇹",
    "504": "🇲🇦", "784": "🇦🇪", "682": "🇸🇦", "586": "🇵🇰", "050": "🇧🇩",
    "643": "🇷🇺", "124": "🇨🇦", "484": "🇲🇽", "818": "🇪🇬", "144": "🇱🇰",
    "36": "🇦🇺", "50": "🇧🇩",
}


def _flag_from_code(country_code: str) -> str:
    return _FLAG_MAP.get(str(country_code).zfill(3), _FLAG_MAP.get(str(country_code), ""))


# ──────────────────────────────────────────────────────
# Fallback: serve from market_fallback.json
# ──────────────────────────────────────────────────────
def fetch_fallback_analysis(hs_prefix: Optional[str], product_name: str = "") -> dict:
    """
    Load market data from market_fallback.json.
    hs_prefix: 4-digit key, or None to use default (kopi/0901).
    Always returns a valid dict — never raises.
    """
    db = _load_fallback()
    default_key = "0901"  # Kopi as ultimate default

    entry = None
    if hs_prefix and hs_prefix in db:
        entry = db[hs_prefix]
    elif db:
        entry = db.get(default_key, next(iter(db.values()), None))

    if not entry:
        return {
            "product": product_name or "Produk Ekspor",
            "hs_code": hs_prefix or "N/A",
            "top_destinations": [],
            "gap_score": 0.0,
            "avg_price": "N/A",
            "growth": "N/A",
            "idn_export_usd": 0,
            "global_demand_usd": 0,
            "opportunity_level": "Tidak Diketahui",
            "data_source": "Fallback (Data tidak tersedia)",
        }

    gap_score = entry.get("gap_score", 0)
    growth_pct = entry.get("growth_pct", 0)

    return {
        "product": product_name or entry.get("name_id", hs_prefix),
        "hs_code": hs_prefix or "N/A",
        "top_destinations": entry.get("top_destinations", []),
        "gap_score": gap_score,
        "avg_price": f"${entry.get('avg_price_usd_ton', 'N/A'):,}/ton",
        "growth": f"+{growth_pct}%" if growth_pct >= 0 else f"{growth_pct}%",
        "idn_export_usd": entry.get("idn_export_usd", 0),
        "global_demand_usd": entry.get("global_demand_usd", 0),
        "opportunity_level": (
            "Sangat Tinggi" if gap_score > 80
            else "Tinggi" if gap_score > 60
            else "Sedang" if gap_score > 40
            else "Rendah"
        ),
        "data_source": entry.get("data_source", "Fallback JSON"),
    }
