"""
Simulator Routes — Export Readiness Calculator & Post-Export Problem Solver.
Includes Dry Run Simulator, Smart Calendar, and Nego Coach endpoints.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.middleware import get_current_user
from app.services.mock_data import (
    COUNTRY_NAMES, REQUIRED_DOCS_BY_COUNTRY,
    DRY_RUN_CHECKPOINTS, CALENDAR_EVENTS
)
from app.services.cendol_service import CendolNLPService
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
    """Rule engine for calculating UMKM export readiness score."""
    commodity = req.commodity or "Produk Umum"
    dest_code = req.destination or "jp"
    dest_name = COUNTRY_NAMES.get(dest_code, dest_code)
    required_docs = REQUIRED_DOCS_BY_COUNTRY.get(dest_code, REQUIRED_DOCS_BY_COUNTRY["default"])

    # Calculate document score
    doc_items = []
    doc_score = 0
    for doc in required_docs:
        if doc in req.documents or doc.lower() in [d.lower() for d in req.documents]:
            doc_items.append({"doc": doc, "status": "pass"})
            doc_score += 1
        else:
            note = f"Perlu diajukan — wajib untuk ekspor ke {dest_name}"
            doc_items.append({"doc": doc, "status": "fail", "note": note})

    doc_pct = int((doc_score / max(len(required_docs), 1)) * 100)

    # Certification score
    cert_items = [
        {"doc": "BPOM / Food Safety", "status": "pass"},
        {"doc": "Sertifikat Halal MUI", "status": "pass"},
    ]
    if dest_code == "jp":
        cert_items.append({"doc": "Japan Food Sanitation Act", "status": "warning", "note": "Label Jepang perlu ditambahkan"})
    elif dest_code == "us":
        cert_items.append({"doc": "FDA Registration", "status": "warning", "note": "Registrasi FDA diperlukan"})
    cert_items.append({"doc": "Uji Lab Residu Pestisida", "status": "pass"})
    cert_score = 85

    # Packaging score
    pack_items = [
        {"doc": "Label Bahasa Inggris", "status": "pass"},
        {"doc": "Nutrition Facts", "status": "pass"},
        {"doc": "Country of Origin", "status": "pass"},
    ]
    if dest_code == "jp":
        pack_items.append({"doc": "Label Bahasa Jepang", "status": "warning", "note": "Diperlukan untuk pasar Jepang"})
    elif dest_code == "cn":
        pack_items.append({"doc": "Label Bahasa Mandarin", "status": "warning", "note": "Diperlukan untuk pasar Tiongkok"})

    pack_score = 80 if req.packaging_ready else 50

    # Overall score
    overall = int((doc_pct * 0.5) + (cert_score * 0.25) + (pack_score * 0.25))
    overall = min(max(overall, 0), 100)

    if overall >= 80:
        status = "Siap Ekspor"
    elif overall >= 60:
        status = "Hampir Siap"
    else:
        status = "Perlu Persiapan"

    categories = [
        {"name": "Kelengkapan Dokumen", "score": doc_pct, "items": doc_items},
        {"name": "Kesiapan Sertifikasi", "score": cert_score, "items": cert_items},
        {"name": "Kepatuhan Kemasan", "score": pack_score, "items": pack_items},
    ]

    # Cost breakdown
    is_agri = commodity.lower() in ["kopi", "cokelat", "rempah", "singkong", "keripik", "teh", "kakao"]
    cost_breakdown = {
        "production": {"label": f"Biaya Produksi ({commodity})", "amount": "Rp 150.000.000" if is_agri else "Rp 75.000.000"},
        "freight": {"label": f"Freight (FCL 20ft → {dest_name})", "amount": "Rp 32.000.000"},
        "insurance": {"label": "Asuransi Kargo", "amount": "Rp 3.500.000"},
        "docs": {"label": "Pengurusan Dokumen & Sertifikasi", "amount": "Rp 8.500.000"},
        "customs": {"label": "Handling & Clearance", "amount": "Rp 6.000.000"},
        "total": "Rp 200.000.000" if is_agri else "Rp 125.000.000",
    }

    # Timeline
    timeline = [
        {"phase": "Persiapan Dokumen", "duration": "7-10 hari kerja"},
        {"phase": "Pengemasan & Stuffing", "duration": "3-5 hari kerja"},
        {"phase": "Customs Clearance Asal", "duration": "2-3 hari kerja"},
        {"phase": "Transit Laut", "duration": "14-18 hari" if dest_code in ["jp", "cn", "kr", "sg"] else "25-35 hari"},
        {"phase": "Customs Clearance Tujuan", "duration": "3-5 hari kerja"},
    ]

    # Risks
    risks = []
    missing_critical = [i for i in doc_items if i["status"] == "fail"]
    if missing_critical:
        risks.append({
            "level": "high",
            "desc": f"{missing_critical[0]['doc']} belum ada — pengiriman akan ditolak tanpa dokumen ini"
        })
    if not req.packaging_ready:
        risks.append({
            "level": "medium",
            "desc": f"Label bahasa lokal {dest_name} diperlukan — barang bisa ditahan di karantina"
        })
    risks.append({
        "level": "low",
        "desc": "Waktu transit bervariasi tergantung musim dan rute kapal"
    })

    return ReadinessResponse(
        product=commodity,
        destination=dest_name,
        overall_score=overall,
        status=status,
        categories=categories,
        cost_breakdown=cost_breakdown,
        timeline=timeline,
        total_timeline="29-41 hari" if dest_code in ["jp", "cn", "kr", "sg"] else "40-58 hari",
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
    """AI Rule Engine for post-export problem resolution."""
    if req.problem_type == "customs_hold":
        return PostExportResponse(
            problem_title="Barang Tertahan di Pabean Tujuan",
            resolution_steps=[
                "Hubungi agen kepabeanan di pelabuhan tujuan untuk meminta alasan formal barang tertahan (Discrepancy Report).",
                "Ajukan permohonan Re-labeling lokal di dalam Bonded Warehouse bea cukai setempat.",
                "Kirimkan revisi label kemasan dalam format PDF berkualitas tinggi dalam 48 jam.",
                "Minta perpanjangan Free Time di terminal agar tidak kena biaya demurrage.",
            ],
            financial_impact={
                "relabeling_cost": "USD 500",
                "return_cost": f"USD {req.shipment_value * 0.35:.0f}",
                "demurrage_per_day": "USD 150",
                "recommendation": "Re-labeling lokal (hemat 75% vs retur barang)"
            },
            email_draft=(
                "Dear Customs Agent,\n\n"
                "We have submitted the revised label layouts in accordance with your guidelines. "
                "Our consignee is ready to apply the corrections inside the Bonded Warehouse.\n\n"
                "Please approve the release at your earliest convenience.\n\n"
                "Sincerely,\n[Your Company Name]"
            ),
            claim_form_template="FORM KLAIM RE-LABELING: ID SH-001 | BIAYA: USD 500 | STATUS: PENDING APPROVAL",
            timeline="3-7 hari kerja untuk resolusi"
        )

    elif req.problem_type == "transit_damage":
        loss = req.shipment_value * 0.90
        return PostExportResponse(
            problem_title="Kerusakan Barang Saat Transit",
            resolution_steps=[
                "Ambil foto & rekaman video kondisi fisik barang rusak saat bongkar muat kontainer.",
                "Minta Surveyor Independen menerbitkan Joint Inspection Report.",
                "Ajukan klaim asuransi Marine Cargo sesuai polis Clause A (All Risks).",
                "Siapkan dokumen pendukung: Invoice, Packing List, B/L, dan foto kerusakan.",
            ],
            financial_impact={
                "estimated_loss": f"USD {loss:.0f}",
                "insurance_coverage": "80-100% (tergantung polis)",
                "deductible": "USD 250 (standar)",
                "recommendation": "Ajukan klaim asuransi segera (batas waktu 60 hari)"
            },
            email_draft=(
                f"Dear Insurer,\n\n"
                f"We hereby notify a cargo damage claim for Shipment #[Ref_ID] valued at USD {req.shipment_value:.0f}.\n\n"
                f"Please find attached the independent survey report and photographic evidence. "
                f"We request full reimbursement under Policy Clause A.\n\n"
                f"Sincerely,\n[Your Company Name]"
            ),
            claim_form_template=f"MARINE CARGO INSURANCE CLAIM - VALUE: USD {req.shipment_value:.0f} | POLICY: ALL RISKS (CLAUSE A)",
            timeline="14-30 hari kerja untuk pencairan klaim"
        )

    elif req.problem_type == "buyer_dispute":
        return PostExportResponse(
            problem_title="Sengketa dengan Buyer",
            resolution_steps=[
                "Dokumentasikan semua komunikasi dan bukti pengiriman yang sesuai kontrak.",
                "Tawarkan diskon parsial 10-15% sebagai goodwill gesture jika keterlambatan terbukti.",
                "Gunakan L/C Discrepancy waiver untuk mencairkan dana di bank penjamin.",
                "Jika tidak ada resolusi, eskalasi ke BANI (Badan Arbitrase Nasional Indonesia).",
            ],
            financial_impact={
                "goodwill_discount": f"USD {req.shipment_value * 0.15:.0f}",
                "legal_cost": "USD 2,000 - 5,000",
                "arbitration_cost": "USD 3,000 - 10,000",
                "recommendation": "Negosiasi langsung + goodwill discount (termurah)"
            },
            email_draft=(
                "Dear [Buyer Name],\n\n"
                "We sincerely apologize for the logistical delay. After reviewing the situation, "
                "we would like to propose a 15% goodwill discount on this shipment as compensation.\n\n"
                "We value our partnership and hope to resolve this amicably.\n\n"
                "Warm regards,\n[Your Company Name]"
            ),
            claim_form_template="BANK GUARANTEE WAIVER FORM - DISPUTE RESOLUTION | GOODWILL: 15%",
            timeline="7-21 hari kerja untuk resolusi"
        )

    else:  # logistics_delay
        return PostExportResponse(
            problem_title="Keterlambatan Logistik",
            resolution_steps=[
                "Hubungi shipping line untuk mendapatkan Revised ETA dan alasan keterlambatan.",
                "Informasikan buyer tentang keterlambatan beserta revised schedule.",
                "Periksa apakah keterlambatan mempengaruhi L/C expiry date — minta amendment jika perlu.",
                "Ajukan klaim ke shipping line jika keterlambatan melebihi batas kontrak.",
            ],
            financial_impact={
                "storage_cost": "USD 100/hari",
                "lc_amendment": "USD 200-500",
                "penalty_risk": f"USD {req.shipment_value * 0.05:.0f} (5% penalty)",
                "recommendation": "Komunikasi proaktif dengan buyer + LC amendment"
            },
            email_draft=CendolNLPService._call_backup_llm(
                f"Write a professional English email to the buyer apologizing for a logistics delay. The new ETA is [New_ETA] for shipment #[Ref_ID]. Explain we are working with the shipping line to expedite. Output ONLY the email body.",
                ""
            ) or (
                "Dear [Buyer Name],\n\n"
                "We regret to inform you that the shipment #[Ref_ID] has experienced a transit delay. "
                "The revised estimated arrival is [New_ETA].\n\n"
                "We are working closely with the shipping line to expedite the delivery. "
                "We apologize for any inconvenience.\n\n"
                "Sincerely,\n[Your Company Name]"
            ),
            claim_form_template="SHIPPING LINE DELAY CLAIM - REVISED ETA: [DATE] | CONTRACTUAL DEADLINE: [DATE]",
            timeline="Tergantung revisi jadwal pelayaran"
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
    """Simulate the full export journey with document verification at each checkpoint."""
    checkpoints = []
    risk_count = {"low": 0, "medium": 0, "high": 0, "very_high": 0}

    for cp in DRY_RUN_CHECKPOINTS:
        # Check if user has the required docs for this checkpoint
        user_docs_lower = [d.lower() for d in req.documents]
        cp_docs = cp["documents"]
        matched = sum(1 for d in cp_docs if any(ud in d.lower() for ud in user_docs_lower))

        if matched == len(cp_docs):
            doc_status = "complete"
        elif matched > 0:
            doc_status = "partial"
        else:
            doc_status = "missing"

        risk_count[cp["risk_level"]] = risk_count.get(cp["risk_level"], 0) + 1

        checkpoints.append({
            **cp,
            "doc_status": doc_status
        })

    # Overall risk assessment
    if risk_count.get("very_high", 0) > 0 or risk_count.get("high", 0) >= 2:
        overall_risk = "TINGGI"
        recommendation = "⚠️ Ada checkpoint berisiko tinggi. Lengkapi semua dokumen sebelum pengiriman!"
    elif risk_count.get("medium", 0) >= 2:
        overall_risk = "SEDANG"
        recommendation = "📋 Persiapan cukup baik. Perhatikan checkpoint medium risk."
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


@router.post("/nego-coach", response_model=NegoResponse)
def analyze_negotiation(req: NegoRequest, current_user: dict = Depends(get_current_user)):
    """Compare buyer offer against market data and generate counter-offer."""
    # Market benchmarks (from COMTRADE-like data)
    benchmarks = {
        "kopi": {"min": 3.80, "max": 4.80, "avg": 4.25},
        "singkong": {"min": 0.80, "max": 1.40, "avg": 1.10},
        "kayu": {"min": 15.0, "max": 45.0, "avg": 28.0},
        "rempah": {"min": 5.0, "max": 12.0, "avg": 8.5},
    }

    commodity_key = "kopi"
    for k in benchmarks:
        if k in req.commodity.lower():
            commodity_key = k
            break

    bm = benchmarks.get(commodity_key, benchmarks["kopi"])
    margin = ((req.buyer_offer_usd - bm["min"]) / bm["avg"]) * 100
    counter = round(bm["avg"] * 0.97, 2)  # 3% below average as reasonable counter

    total_value = req.buyer_offer_usd * req.quantity_kg
    counter_total = counter * req.quantity_kg

    if margin < 10:
        rec = "⚠️ Tawaran buyer TERLALU RENDAH. Wajib counter-offer!"
    elif margin < 25:
        rec = "📊 Tawaran buyer masih di bawah rata-rata pasar. Negosiasi disarankan."
    else:
        rec = "✅ Tawaran buyer cukup baik. Pertimbangkan untuk menerima."

    return NegoResponse(
        buyer_offer=f"USD {req.buyer_offer_usd:.2f}/kg ({req.incoterm} {req.destination})",
        market_benchmark=f"USD {bm['min']:.2f} - {bm['max']:.2f}/kg (Avg: USD {bm['avg']:.2f})",
        margin_pct=round(margin, 1),
        counter_offer=f"USD {counter:.2f}/kg ({req.incoterm} {req.destination})",
        profitability_analysis={
            "buyer_total": f"USD {total_value:,.0f}",
            "counter_total": f"USD {counter_total:,.0f}",
            "difference": f"USD {counter_total - total_value:,.0f}",
            "market_position": "Di bawah rata-rata" if req.buyer_offer_usd < bm["avg"] else "Di atas rata-rata",
        },
        email_draft=CendolNLPService._call_backup_llm(
            f"Write a professional English negotiation email to a buyer. They offered USD {req.buyer_offer_usd:.2f}/kg for {req.commodity}. Reject it politely and counter with USD {counter:.2f}/kg ({req.incoterm} {req.destination}). Quantity: {req.quantity_kg} kg. Mention our high quality. Output ONLY the email body.",
            ""
        ) or (
            f"Dear [Buyer Name],\n\n"
            f"Thank you for your valuable offer of USD {req.buyer_offer_usd:.2f}/kg for our premium {req.commodity}.\n\n"
            f"After carefully analyzing our production costs and current market benchmarks "
            f"(UN COMTRADE average: USD {bm['avg']:.2f}/kg), we would like to propose a "
            f"counter-offer of USD {counter:.2f}/kg ({req.incoterm} {req.destination}).\n\n"
            f"We can commit to {req.quantity_kg:,.0f} kg with a shipping window within 30 days "
            f"of receiving the advance payment (30% T/T, 70% Irrevocable L/C at Sight).\n\n"
            f"We look forward to your favorable response.\n\n"
            f"Warm regards,\n[Your Company Name]"
        ),
        recommendation=rec
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
    """Generate personalized export calendar based on commodity and destination."""
    dest = req.destination or "Jepang"

    key_deadlines = [
        {"deadline": "SKA (Certificate of Origin)", "rule": "Maks. 7 hari setelah kapal berangkat", "priority": "high"},
        {"deadline": "Phytosanitary Certificate", "rule": "Berlaku 14 hari dari tanggal diterbitkan", "priority": "high"},
        {"deadline": "Bea Keluar (jika ada)", "rule": "Harus lunas sebelum PEB disetujui", "priority": "medium"},
        {"deadline": "PEB (Pemberitahuan Ekspor Barang)", "rule": "Diajukan maks. 7 hari sebelum kapal berangkat", "priority": "high"},
        {"deadline": "Booking Kontainer", "rule": "Minimal 14 hari sebelum target sailing date", "priority": "medium"},
    ]

    # Best window based on commodity
    commodity_lower = req.commodity.lower()
    if "kopi" in commodity_lower:
        best_window = "September-Oktober (Panen raya selesai → peak demand Eropa/AS)"
    elif "rempah" in commodity_lower:
        best_window = "Februari-Maret (Menjelang Ramadan) & Oktober-November (Pre-Christmas)"
    elif "kayu" in commodity_lower:
        best_window = "Agustus-September (Pre-Christmas production window)"
    else:
        best_window = "Oktober-November (Global peak demand season)"

    return CalendarResponse(
        commodity=req.commodity,
        destination=dest,
        calendar=CALENDAR_EVENTS,
        key_deadlines=key_deadlines,
        best_shipping_window=best_window
    )
