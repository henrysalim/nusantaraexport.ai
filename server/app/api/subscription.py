"""
Subscription API — NusantaraExport.AI
Endpoint dummy untuk manajemen langganan (tanpa payment gateway).
Berfungsi sebagai pondasi untuk integrasi Midtrans/Xendit di masa depan.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.middleware import get_current_user
from app.config.db_config import execute_auth_query
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Konstanta paket ───────────────────────────────────────────────────────────
PLANS = {
    "free": {
        "name":        "Free",
        "price_idr":   0,
        "token_quota_daily": 1_000,
        "features": [
            "Chatbot Regulasi (1.000 token/hari)",
            "OCR Packaging Checker (1x/hari)",
            "Akses komunitas & marketplace",
        ],
    },
    "starter": {
        "name":        "Starter",
        "price_idr":   49_000,
        "token_quota_daily": 10_000,
        "features": [
            "Chatbot Regulasi (10.000 token/hari)",
            "OCR Packaging Checker unlimited",
            "Akses komunitas & marketplace",
        ],
    },
    "pro": {
        "name":        "Pro",
        "price_idr":   79_000,
        "token_quota_daily": 50_000,
        "features": [
            "Chatbot Regulasi (50.000 token/hari)",
            "OCR Packaging Checker unlimited",
            "Auto-DocGen 9 dokumen ekspor (PDF)",
        ],
    },
    "premium": {
        "name":        "Premium",
        "price_idr":   99_000,
        "token_quota_daily": None,  # unlimited
        "features": [
            "Token chatbot tidak terbatas",
            "Auto-DocGen 9 dokumen ekspor (PDF)",
            "Dry Run & Export Simulator",
            "Nego Coach + Smart Calendar + Problem Solver",
            "HS Code & FTA Optimizer",
            "Market Gap Analysis global",
        ],
    },
}

# ── Feature access map ────────────────────────────────────────────────────────
FEATURE_TIER_MAP = {
    "chatbot":    "free",
    "packaging":  "free",
    "docs":       "pro",
    "simulator":  "premium",
    "nego":       "premium",
    "calendar":   "premium",
    "postexport": "premium",
    "hscode":     "premium",
    "market":     "premium",
    "alerts":     "premium",
}
TIER_RANK = {"free": 0, "starter": 1, "pro": 2, "premium": 3}


# ── Request Models ────────────────────────────────────────────────────────────
class ActivateRequest(BaseModel):
    tier: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def _get_user_tier(user_id: str) -> dict:
    """Ambil tier langganan dari DB. Fallback ke 'free' jika kolom belum ada."""
    try:
        row = execute_auth_query(
            """
            SELECT COALESCE(subscription_tier, 'free') AS tier,
                   subscription_expires_at AS expires_at
            FROM users WHERE id = %s
            """,
            (str(user_id),),
            fetch_one=True,
        )
        if not row:
            return {"tier": "free", "expires_at": None}
        return {"tier": row["tier"] or "free", "expires_at": row.get("expires_at")}
    except Exception as e:
        logger.warning(f"_get_user_tier fallback: {e}")
        return {"tier": "free", "expires_at": None}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    """Daftar semua paket langganan dengan harga dan fitur."""
    return {"plans": PLANS}


@router.get("/my")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Tier langganan aktif user yang sedang login."""
    sub = _get_user_tier(current_user["id"])
    plan_info = PLANS.get(sub["tier"], PLANS["free"])
    return {
        "tier":        sub["tier"],
        "plan":        plan_info,
        "expires_at":  sub["expires_at"].isoformat() if sub["expires_at"] else None,
        "is_active":   True,
    }


@router.post("/activate")
async def activate_subscription(
    req: ActivateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Aktivasi tier langganan (dummy — tanpa payment gateway).
    Menyimpan tier ke kolom users.subscription_tier di DB.
    """
    if req.tier not in PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tier tidak valid. Pilih: {', '.join(PLANS.keys())}"
        )

    expires_at = None
    if req.tier != "free":
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    try:
        execute_auth_query(
            """
            UPDATE users
            SET subscription_tier = %s,
                subscription_expires_at = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (req.tier, expires_at, str(current_user["id"])),
        )
        logger.info(f"User {current_user['id']} activated tier: {req.tier}")
    except Exception as e:
        # Kolom belum ada di DB (migrasi belum dijalankan) — tetap lanjut (frontend pakai localStorage)
        logger.warning(f"activate_subscription DB update failed (non-critical, will use localStorage): {e}")

    return {
        "message":    f"Tier {PLANS[req.tier]['name']} berhasil diaktifkan (demo mode)",
        "tier":       req.tier,
        "expires_at": expires_at.isoformat() if expires_at else None,
    }


@router.get("/check/{feature_key}")
async def check_feature_access(
    feature_key: str,
    current_user: dict = Depends(get_current_user),
):
    """Cek apakah user aktif boleh mengakses fitur tertentu berdasarkan tier."""
    if feature_key not in FEATURE_TIER_MAP:
        raise HTTPException(status_code=404, detail="Fitur tidak dikenal")

    sub = _get_user_tier(current_user["id"])
    user_tier    = sub["tier"]
    required_tier = FEATURE_TIER_MAP[feature_key]
    has_access   = TIER_RANK.get(user_tier, 0) >= TIER_RANK.get(required_tier, 0)

    return {
        "feature":       feature_key,
        "user_tier":     user_tier,
        "required_tier": required_tier,
        "has_access":    has_access,
    }
