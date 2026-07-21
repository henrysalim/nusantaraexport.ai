"""
Simulator Routes — Export Readiness Calculator & Post-Export Problem Solver.
Includes Dry Run Simulator, Smart Calendar, and Nego Coach endpoints.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.middleware import get_current_user
from app.services.mock_data import COUNTRY_NAMES
from app.services.nego_service import (
    get_commodity_benchmark,
    get_fallback_benchmark,
    calculate_counter_offer,
    generate_email_draft,
)
from app.services.calendar_service import generate_export_calendar
from app.services.readiness_service import (
    get_required_documents,
    get_cost_breakdown,
    get_certification_items,
    get_dry_run_checkpoints,
    get_shipping_timeline,
)
from app.services.post_export_service import solve_post_export
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────────────────────────────────
# Export Readiness Simulator
# ──────────────────────────────────────────────────────

class ReadinessRequest(BaseModel):
    commodity: str
    destination: str = ""
    documents: List[str] = []
    packaging_ready: bool = False


class ReadinessResponse(BaseModel):
    product: str
    destination: str
    overall_score: int
    status: str
    categories: list
    cost_breakdown: dict
    timeline: list
    total_timeline: str
    risks: list


@router.post("/readiness", response_model=ReadinessResponse)
def calculate_readiness(req: ReadinessRequest, current_user: dict = Depends(get_current_user)):
    """Real-time export readiness analysis using Gemini + commodity/destination-specific data."""
    commodity = req.commodity or "Produk Umum"
    dest_code = req.destination or "jp"
    dest_name = COUNTRY_NAMES.get(dest_code, dest_code)

    logger.info(f"Readiness: commodity='{commodity}' dest='{dest_code}'")

    # ── Document Score ──
    required_docs = get_required_documents(commodity, dest_name, dest_code)
    doc_items = []
    doc_score = 0
    for doc in required_docs:
        if doc in req.documents or doc.lower() in [d.lower() for d in req.documents]:
            doc_items.append({"doc": doc, "status": "pass"})
            doc_score += 1
        else:
            doc_items.append({"doc": doc, "status": "fail",
                              "note": f"Perlu diajukan — wajib untuk ekspor ke {dest_name}"})
    doc_pct = int((doc_score / max(len(required_docs), 1)) * 100)

    # ── Certification Score ──
    cert_items, cert_score = get_certification_items(commodity, dest_name, dest_code)

    # ── Packaging Score ──
    pack_items = [
        {"doc": "Label Bahasa Inggris", "status": "pass"},
        {"doc": "Nutrition Facts", "status": "pass"},
        {"doc": "Country of Origin", "status": "pass"},
    ]
    if dest_code == "jp":
        pack_items.append({"doc": "Label Bahasa Jepang", "status": "warning", "note": "Diperlukan untuk pasar Jepang"})
    elif dest_code == "cn":
        pack_items.append({"doc": "Label Bahasa Mandarin", "status": "warning", "note": "Diperlukan untuk pasar Tiongkok"})
    elif dest_code == "kr":
        pack_items.append({"doc": "Label Bahasa Korea", "status": "warning", "note": "Wajib untuk pasar Korea Selatan"})
    pack_score = 80 if req.packaging_ready else 50

    # ── Overall Score ──
    overall = int((doc_pct * 0.5) + (cert_score * 0.25) + (pack_score * 0.25))
    overall = min(max(overall, 0), 100)
    status = "Siap Ekspor" if overall >= 80 else "Hampir Siap" if overall >= 60 else "Perlu Persiapan"

    categories = [
        {"name": "Kelengkapan Dokumen", "score": doc_pct, "items": doc_items},
        {"name": "Kesiapan Sertifikasi", "score": cert_score, "items": cert_items},
        {"name": "Kepatuhan Kemasan", "score": pack_score, "items": pack_items},
    ]

    # ── Cost Breakdown ──
    cost_breakdown = get_cost_breakdown(commodity, dest_name)

    # ── Timeline ──
    timeline, total_timeline = get_shipping_timeline(dest_name, dest_code)

    # ── Risks ──
    risks = []
    missing = [i for i in doc_items if i["status"] == "fail"]
    if missing:
        risks.append({"level": "high",
                      "desc": f"{missing[0]['doc']} belum ada — pengiriman dapat ditolak tanpa dokumen ini"})
    if not req.packaging_ready:
        risks.append({"level": "medium",
                      "desc": f"Label bahasa lokal {dest_name} diperlukan — barang bisa ditahan karantina"})
    risks.append({"level": "low",
                  "desc": "Waktu transit bervariasi tergantung musim dan rute kapal aktual"})

    return ReadinessResponse(
        product=commodity,
        destination=dest_name,
        overall_score=overall,
        status=status,
        categories=categories,
        cost_breakdown=cost_breakdown,
        timeline=timeline,
        total_timeline=total_timeline,
        risks=risks
    )


# ──────────────────────────────────────────────────────
# Post-Export Problem Solver
# ──────────────────────────────────────────────────────

class PostExportRequest(BaseModel):
    problem_type: str  # "customs_hold", "transit_damage", "buyer_dispute", "logistics_delay"
    shipment_value: float = 10000.0
    description: str = ""


class PostExportResponse(BaseModel):
    problem_title: str
    resolution_steps: List[str]
    financial_impact: dict
    email_draft: str
    claim_form_template: str
    timeline: str


@router.post("/post-export-solve", response_model=PostExportResponse)
def solve_post_export_problem(req: PostExportRequest, current_user: dict = Depends(get_current_user)):
    """Dynamic AI post-export problem solver."""
    logger.info(f"Post Export Solver: type='{req.problem_type}' value={req.shipment_value} desc='{req.description}'")

    solution = solve_post_export(
        problem_type=req.problem_type,
        shipment_value=req.shipment_value,
        description=req.description,
    )

    return PostExportResponse(
        problem_title=solution["problem_title"],
        resolution_steps=solution["resolution_steps"],
        financial_impact=solution["financial_impact"],
        email_draft=solution["email_draft"],
        claim_form_template=solution["claim_form_template"],
        timeline=solution["timeline"]
    )


# ──────────────────────────────────────────────────────
# Dry Run Simulator
# ──────────────────────────────────────────────────────

class DryRunRequest(BaseModel):
    commodity: str = "Kopi Arabika"
    destination: str = "Jepang"
    documents: List[str] = []


class DryRunCheckpoint(BaseModel):
    checkpoint: str
    description: str
    documents: List[str]
    risk_level: str
    risk_detail: str
    doc_status: str  # "complete", "partial", "missing"


class DryRunResponse(BaseModel):
    product: str
    destination: str
    checkpoints: List[dict]
    overall_risk: str
    recommendation: str


@router.post("/dry-run", response_model=DryRunResponse)
def simulate_dry_run(req: DryRunRequest, current_user: dict = Depends(get_current_user)):
    """Real-time dry-run using Gemini to generate commodity + destination-specific checkpoints."""
    logger.info(f"Dry Run: commodity='{req.commodity}' dest='{req.destination}'")

    checkpoints_data = get_dry_run_checkpoints(req.commodity, req.destination)

    checkpoints = []
    risk_count = {"low": 0, "medium": 0, "high": 0, "very_high": 0}

    for cp in checkpoints_data:
        user_docs_lower = [d.lower() for d in req.documents]
        cp_docs = cp.get("documents", [])
        matched = sum(1 for d in cp_docs if any(ud in d.lower() for ud in user_docs_lower))

        if matched == len(cp_docs) and len(cp_docs) > 0:
            doc_status = "complete"
        elif matched > 0:
            doc_status = "partial"
        else:
            doc_status = "missing"

        risk_count[cp.get("risk_level", "medium")] = risk_count.get(cp.get("risk_level", "medium"), 0) + 1
        checkpoints.append({**cp, "doc_status": doc_status})

    if risk_count.get("very_high", 0) > 0 or risk_count.get("high", 0) >= 2:
        overall_risk = "TINGGI"
        recommendation = "⚠️ Ada checkpoint berisiko tinggi. Lengkapi semua dokumen sebelum pengiriman!"
    elif risk_count.get("medium", 0) >= 2:
        overall_risk = "SEDANG"
        recommendation = "📋 Persiapan cukup baik. Perhatikan checkpoint medium risk dengan seksama."
    else:
        overall_risk = "RENDAH"
        recommendation = "✅ Persiapan ekspor Anda sudah sangat baik. Lanjutkan booking kontainer!"

    return DryRunResponse(
        product=req.commodity,
        destination=req.destination,
        checkpoints=checkpoints,
        overall_risk=overall_risk,
        recommendation=recommendation
    )


# ──────────────────────────────────────────────────────
# Nego Coach
# ──────────────────────────────────────────────────────

class NegoRequest(BaseModel):
    commodity: str = "Kopi Arabika"
    buyer_offer_usd: float = 3.50
    quantity_kg: float = 2000
    destination: str = "Jepang"
    incoterm: str = "FOB"


class NegoResponse(BaseModel):
    buyer_offer: str
    market_benchmark: str
    margin_pct: float
    counter_offer: str
    profitability_analysis: dict
    email_draft: str
    recommendation: str
    negotiation_tips: list = []
    source_note: Optional[str] = None


@router.post("/nego-coach", response_model=NegoResponse)
def analyze_negotiation(req: NegoRequest, current_user: dict = Depends(get_current_user)):
    """
    Real-time negotiation analysis using Gemini 3.1 Flash Lite.
    Steps:
      1. Fetch live commodity price benchmark via Gemini (or fallback table)
      2. Calculate smart counter-offer & margin assessment via Gemini
      3. Generate professional English counter-offer email via Gemini
    """
    logger.info(f"Nego Coach: commodity='{req.commodity}' buyer_offer={req.buyer_offer_usd} dest='{req.destination}'")

    # ── Step 1: Price Benchmark ──
    benchmark = get_commodity_benchmark(req.commodity, req.destination, req.incoterm)
    if not benchmark or benchmark["price_avg"] <= 0:
        benchmark = get_fallback_benchmark(req.commodity)
        logger.info(f"Nego Coach: Using fallback benchmark for '{req.commodity}'.")
    else:
        logger.info(f"Nego Coach: Live benchmark fetched — avg USD {benchmark['price_avg']:.2f}/kg")

    # ── Step 2: Counter-Offer Strategy ──
    strategy = calculate_counter_offer(
        commodity=req.commodity,
        buyer_offer=req.buyer_offer_usd,
        quantity_kg=req.quantity_kg,
        destination=req.destination,
        incoterm=req.incoterm,
        benchmark=benchmark,
    )
    counter = strategy["counter_price"]

    # ── Step 3: Email Draft ──
    email = generate_email_draft(
        commodity=req.commodity,
        buyer_offer=req.buyer_offer_usd,
        counter_price=counter,
        quantity_kg=req.quantity_kg,
        destination=req.destination,
        incoterm=req.incoterm,
        benchmark=benchmark,
    )

    total_buyer = req.buyer_offer_usd * req.quantity_kg
    total_counter = counter * req.quantity_kg

    return NegoResponse(
        buyer_offer=f"USD {req.buyer_offer_usd:.2f}/kg ({req.incoterm} {req.destination})",
        market_benchmark=(
            f"USD {benchmark['price_min']:.2f} – {benchmark['price_max']:.2f}/kg "
            f"(Avg: USD {benchmark['price_avg']:.2f}/kg)"
        ),
        margin_pct=strategy["margin_pct"],
        counter_offer=f"USD {counter:.2f}/kg ({req.incoterm} {req.destination})",
        profitability_analysis={
            "buyer_total": f"USD {total_buyer:,.0f}",
            "counter_total": f"USD {total_counter:,.0f}",
            "selisih": f"USD {total_counter - total_buyer:,.0f}",
            "walk_away_price": f"USD {strategy['walk_away_price']:.2f}/kg",
            "market_position": (
                "Di bawah rata-rata pasar"
                if req.buyer_offer_usd < benchmark["price_avg"]
                else "Di atas rata-rata pasar"
            ),
            "counter_rationale": strategy.get("counter_rationale", ""),
        },
        email_draft=email,
        recommendation=strategy["recommendation"],
        negotiation_tips=strategy.get("negotiation_tips", []),
        source_note=benchmark.get("source_note"),
    )


# ──────────────────────────────────────────────────────
# Smart Export Calendar
# ──────────────────────────────────────────────────────

class CalendarRequest(BaseModel):
    commodity: str = "Kopi"
    destination: str = "Jepang"


class CalendarResponse(BaseModel):
    commodity: str
    destination: str
    calendar: list
    key_deadlines: list
    best_shipping_window: str


@router.post("/smart-calendar", response_model=CalendarResponse)
def get_smart_calendar(req: CalendarRequest, current_user: dict = Depends(get_current_user)):
    """Generate personalized export calendar based on commodity and destination in real-time."""
    dest = req.destination or "Jepang"
    logger.info(f"Smart Export Calendar: commodity='{req.commodity}' dest='{dest}'")
    
    calendar_data = generate_export_calendar(req.commodity, dest)
    
    return CalendarResponse(
        commodity=req.commodity,
        destination=dest,
        calendar=calendar_data["calendar"],
        key_deadlines=calendar_data["key_deadlines"],
        best_shipping_window=calendar_data["best_shipping_window"]
    )

