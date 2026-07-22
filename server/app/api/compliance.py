"""
Compliance Routes — Packaging Checker & HS Code Optimizer.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.middleware import get_current_user
from app.services.cendol_service import CendolNLPService
from app.services.packaging_service import (
    build_checklist,
    analyze_packaging_image,
    merge_checklist_with_vision,
    calculate_compliance_score,
    generate_recommendation,
    classify_product_category,
)
from app.services.hscode_service import classify_product_hs_code
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────────────────────────────────
# Packaging Checker
# ──────────────────────────────────────────────────────

class PackagingRequest(BaseModel):
    destination_country: str = "us"
    product_type: str = "makanan"
    filename: str = ""
    # Multi-image support: list of {"base64": str, "mime_type": str}
    images: list = []
    # Legacy single-image fields (kept for backward compatibility)
    image_base64: str = ""
    image_mime_type: str = "image/jpeg"


class PackagingResponse(BaseModel):
    score: int
    status: str
    items: list
    suggestion: str
    category: str
    country_name: str
    has_image_analysis: bool


@router.post("/packaging-check", response_model=PackagingResponse)
def check_packaging(req: PackagingRequest, current_user: dict = Depends(get_current_user)):
    """
    Real-time packaging compliance check.

    Flow:
      1. Classify product category from free-text product_type.
      2. Build checklist from packaging_regulations.json (universal + category + country-specific).
      3. If image uploaded → Gemini Vision detects presence/absence of each item.
      4. Merge Gemini detections into checklist statuses.
      5. Calculate weighted compliance score from actual statuses.
      6. Generate AI recommendation via Gemini text (fallback to template).
    """
    dest = req.destination_country.lower()

    # Step 1 & 2: Build checklist from JSON regulations
    checklist = build_checklist(dest, req.product_type)
    category = classify_product_category(req.product_type)
    logger.info(f"Packaging check: product='{req.product_type}' dest='{dest}' category='{category}' items={len(checklist)}")

    # Normalize images: prefer req.images list, fall back to legacy single image
    images = req.images or []
    if not images and req.image_base64:
        images = [{"base64": req.image_base64, "mime_type": req.image_mime_type}]
    logger.info(f"Packaging check: {len(images)} image(s) provided.")

    # Step 3 & 4: Gemini Vision (only if images provided)
    vision_summary = ""
    has_image_analysis = False
    if images:
        gemini_detections = analyze_packaging_image(
            images=images,
            country_code=dest,
            product_type=req.product_type,
            checklist_items=checklist,
        )
        if gemini_detections:
            checklist, vision_summary = merge_checklist_with_vision(checklist, gemini_detections)
            has_image_analysis = True
            logger.info(f"Gemini Vision analysis applied. vision_summary={vision_summary[:80]}...")

    # Step 5: Score
    score = calculate_compliance_score(checklist)
    status = "Siap Ekspor" if score >= 75 else "Perlu Perbaikan" if score >= 50 else "Belum Siap"

    # Step 6: AI Recommendation
    suggestion = generate_recommendation(
        product_type=req.product_type,
        country_code=dest,
        score=score,
        items=checklist,
        vision_summary=vision_summary,
    )

    # Resolve country display name
    from app.services.packaging_service import _load_regulations
    db = _load_regulations()
    country_info = db.get(dest, db.get("default", {}))
    country_name = country_info.get("name", dest.upper())

    # Strip internal fields not needed by frontend
    frontend_items = [
        {
            "label": item["label"],
            "status": item["status"],
            "note": item["note"],
        }
        for item in checklist
    ]

    return PackagingResponse(
        score=score,
        status=status,
        items=frontend_items,
        suggestion=suggestion,
        category=category,
        country_name=country_name,
        has_image_analysis=has_image_analysis,
    )


# ──────────────────────────────────────────────────────
# HS Code Optimizer
# ──────────────────────────────────────────────────────

class HSCodeRequest(BaseModel):
    product_name: str


class HSCodeResponse(BaseModel):
    product: str
    hs_code: str
    description: str
    chapter: str
    mfn_tariff: str
    fta_results: list
    best_fta: str
    best_saving: str
    reason: Optional[str] = None
    data_source: Optional[str] = None


@router.post("/hs-code", response_model=HSCodeResponse)
def classify_hs_code(req: HSCodeRequest, current_user: dict = Depends(get_current_user)):
    """
    Classify product HS Code and calculate FTA tariff benefits in real-time.
    Uses hscode_service which integrates local databases and gemini-3.1-flash-lite.
    """
    logger.info(f"HS Code optimization requested for product: '{req.product_name}'")
    result = classify_product_hs_code(req.product_name)
    return HSCodeResponse(**result)

