"""
Marketplace API Routes — Produk UMKM siap ekspor & Buyer Internasional.
Prefix: /api/marketplace
"""
import logging
import json
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field

from app.config.db_config import execute_auth_query
from app.middleware import get_current_user
from app.api.community import get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter()


# ──────────────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────────────

class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    price_usd: float = Field(..., gt=0)
    price_idr: Optional[float] = None
    min_order_qty: Optional[str] = None
    hs_code: Optional[str] = None
    images: Optional[List[str]] = []
    badges: Optional[List[str]] = []
    location: Optional[str] = None
    lead_time: Optional[str] = None
    packaging: Optional[str] = None
    seller_name: Optional[str] = None
    whatsapp_number: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    user_id: Optional[str]
    name: str
    category: str
    description: Optional[str]
    price_usd: float
    price_idr: Optional[float]
    min_order_qty: Optional[str]
    hs_code: Optional[str]
    images: List[str]
    badges: List[str]
    location: Optional[str]
    lead_time: Optional[str]
    packaging: Optional[str]
    status: str
    seller_name: Optional[str]
    whatsapp_number: Optional[str]
    created_at: str


class BuyerResponse(BaseModel):
    id: str
    company_name: str
    country: str
    contact_email: Optional[str]
    target_categories: List[str]
    interested_hs_codes: List[str]
    annual_volume_usd: Optional[float]
    is_verified: bool
    notes: Optional[str]


class CoopMatchRequest(BaseModel):
    hs_code: str = Field(..., min_length=2)
    city: Optional[str] = None
    min_products: int = Field(default=2, ge=1)


# ──────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────

def _row_to_product(p) -> ProductResponse:
    imgs = p["images"]
    if isinstance(imgs, str):
        try:
            imgs = json.loads(imgs)
        except Exception:
            imgs = []
    imgs = imgs or []

    bdgs = p["badges"]
    if isinstance(bdgs, str):
        try:
            bdgs = json.loads(bdgs)
        except Exception:
            bdgs = []
    bdgs = bdgs or []

    return ProductResponse(
        id=str(p["id"]),
        user_id=str(p["user_id"]) if p["user_id"] else None,
        name=p["name"],
        category=p["category"],
        description=p["description"],
        price_usd=float(p["price_usd"]),
        price_idr=float(p["price_idr"]) if p["price_idr"] else None,
        min_order_qty=p["min_order_qty"],
        hs_code=p["hs_code"],
        images=imgs,
        badges=bdgs,
        location=p["location"],
        lead_time=p["lead_time"],
        packaging=p["packaging"],
        status=p["status"],
        seller_name=p["seller_name"],
        whatsapp_number=p.get("whatsapp_number"),
        created_at=str(p["created_at"]),
    )


# ──────────────────────────────────────────────────────
# Endpoints: Products
# ──────────────────────────────────────────────────────

@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status_filter: str = Query("active"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    List semua produk UMKM aktif dengan filter kategori dan pencarian.
    """
    base_q = """
        SELECT id, user_id, name, hs_code, category, description,
               price_usd, price_idr, min_order_qty, images, badges,
               location, lead_time, packaging, status, seller_name,
               whatsapp_number, created_at
        FROM marketplace_products
        WHERE status = %s
    """
    params = [status_filter]

    if category:
        base_q += " AND category = %s"
        params.append(category)

    if search:
        base_q += " AND (name ILIKE %s OR description ILIKE %s OR seller_name ILIKE %s)"
        s = f"%{search}%"
        params.extend([s, s, s])

    base_q += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    try:
        rows = execute_auth_query(base_q, tuple(params), fetch=True)
        return [_row_to_product(r) for r in rows]
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuat daftar produk marketplace"
        )


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    req: ProductCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Tambah produk ekspor baru oleh UMKM yang sudah login.
    """
    try:
        row = execute_auth_query(
            """
            INSERT INTO marketplace_products
              (user_id, name, hs_code, category, description, price_usd, price_idr,
               min_order_qty, images, badges, location, lead_time, packaging,
               status, seller_name, whatsapp_number)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'active',%s,%s)
            RETURNING id, user_id, name, hs_code, category, description,
                      price_usd, price_idr, min_order_qty, images, badges,
                      location, lead_time, packaging, status, seller_name,
                      whatsapp_number, created_at
            """,
            (
                str(current_user["id"]),
                req.name,
                req.hs_code,
                req.category,
                req.description,
                req.price_usd,
                req.price_idr,
                req.min_order_qty,
                json.dumps(req.images or []),
                json.dumps(req.badges or []),
                req.location,
                req.lead_time,
                req.packaging,
                req.seller_name or current_user.get("full_name", ""),
                req.whatsapp_number,
            ),
            fetch_one=True,
        )
        return _row_to_product(row)
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal menambahkan produk. Pastikan tabel marketplace_products sudah dibuat."
        )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_detail(product_id: str):
    """Detail satu produk."""
    try:
        row = execute_auth_query(
            """
            SELECT id, user_id, name, hs_code, category, description,
                   price_usd, price_idr, min_order_qty, images, badges,
                   location, lead_time, packaging, status, seller_name, created_at
            FROM marketplace_products WHERE id = %s
            """,
            (product_id,),
            fetch_one=True,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
        return _row_to_product(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Gagal memuat produk")


# ──────────────────────────────────────────────────────
# Endpoints: Buyers
# ──────────────────────────────────────────────────────

@router.get("/buyers", response_model=List[BuyerResponse])
async def get_buyers(
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    verified_only: bool = Query(False),
):
    """List buyer internasional terverifikasi."""
    q = """
        SELECT id, company_name, country, contact_email,
               target_categories, interested_hs_codes,
               annual_volume_usd, is_verified, notes
        FROM marketplace_buyers WHERE 1=1
    """
    params = []
    if verified_only:
        q += " AND is_verified = TRUE"
    if country:
        q += " AND country ILIKE %s"
        params.append(f"%{country}%")
    q += " ORDER BY is_verified DESC, company_name ASC"

    try:
        rows = execute_auth_query(q, tuple(params), fetch=True)
        result = []
        for r in rows:
            cats = r["target_categories"]
            if isinstance(cats, str):
                try:
                    cats = json.loads(cats)
                except Exception:
                    cats = []
            hs = r["interested_hs_codes"]
            if isinstance(hs, str):
                try:
                    hs = json.loads(hs)
                except Exception:
                    hs = []
            result.append(BuyerResponse(
                id=str(r["id"]),
                company_name=r["company_name"],
                country=r["country"],
                contact_email=r["contact_email"],
                target_categories=cats or [],
                interested_hs_codes=hs or [],
                annual_volume_usd=r["annual_volume_usd"],
                is_verified=r["is_verified"],
                notes=r["notes"],
            ))
        return result
    except Exception as e:
        logger.error(f"Error fetching buyers: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gagal memuat daftar buyer"
        )


# ──────────────────────────────────────────────────────
# Endpoints: Cooperative Match (Konsolidasi LCL)
# ──────────────────────────────────────────────────────

@router.post("/cooperative-match")
async def cooperative_match(
    req: CoopMatchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Cari UMKM lain dengan HS Code dan lokasi serupa
    untuk konsolidasi pengiriman LCL (Less than Container Load).
    """
    hs_prefix = req.hs_code[:4]  # gunakan 4 digit pertama HS Code

    q = """
        SELECT id, name, seller_name, location, hs_code, category,
               price_usd, min_order_qty, created_at
        FROM marketplace_products
        WHERE status = 'active'
          AND hs_code LIKE %s
    """
    params = [f"{hs_prefix}%"]

    if req.city:
        q += " AND location ILIKE %s"
        params.append(f"%{req.city}%")

    q += " ORDER BY created_at DESC LIMIT 20"

    try:
        rows = execute_auth_query(q, tuple(params), fetch=True)
        matches = [
            {
                "id": str(r["id"]),
                "name": r["name"],
                "seller": r["seller_name"],
                "location": r["location"],
                "hs_code": r["hs_code"],
                "category": r["category"],
                "price_usd": float(r["price_usd"]),
                "min_order_qty": r["min_order_qty"],
            }
            for r in rows
        ]
        return {
            "hs_prefix": hs_prefix,
            "city_filter": req.city,
            "total_matches": len(matches),
            "consolidation_eligible": len(matches) >= req.min_products,
            "message": (
                f"Ditemukan {len(matches)} UMKM dengan HS Code {hs_prefix}xx"
                + (f" di area {req.city}" if req.city else "")
                + ". Cocok untuk konsolidasi LCL!"
                if len(matches) >= req.min_products
                else f"Hanya ditemukan {len(matches)} UMKM. Tambah produk lebih banyak untuk memenuhi syarat LCL."
            ),
            "matches": matches,
        }
    except Exception as e:
        logger.error(f"Error in cooperative match: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gagal menjalankan pencarian konsolidasi"
        )
