"""
Document API — NusantaraExport.AI
Draft CRUD + PDF generation for all 9 export document types.
Includes automatic table initialization, in-memory fallback store for offline/degraded mode,
and bulletproof error handling.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator
from typing import Optional, List, Any, Dict
from app.middleware import get_current_user
from app.config.db_config import execute_query, get_db_connection
from app.services.pdf_service import generate_doc
import uuid
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

import tempfile

def _get_export_dir():
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        d = os.path.join(tempfile.gettempdir(), "exports")
    else:
        d = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports"
        )
    try:
        os.makedirs(d, exist_ok=True)
        return d
    except (OSError, PermissionError):
        d = tempfile.gettempdir()
        os.makedirs(d, exist_ok=True)
        return d

EXPORT_DIR = _get_export_dir()

# ─────────────────────────────────────────────────────────────────
# In-Memory Fallback Drafts Store (Keyed by str(user_id) -> dict of doc_id -> draft)
# ─────────────────────────────────────────────────────────────────
FALLBACK_DRAFTS: Dict[str, Dict[str, dict]] = {}


def bootstrap_export_documents_table():
    """Ensure export_documents table exists in PostgreSQL on startup."""
    ddl = """
    CREATE TABLE IF NOT EXISTS export_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title VARCHAR(255) DEFAULT 'Draft Dokumen Ekspor',
        status VARCHAR(50) DEFAULT 'draft',
        company_logo_url TEXT,
        company_name VARCHAR(255),
        company_address TEXT,
        company_phone VARCHAR(100),
        company_email VARCHAR(255),
        company_website VARCHAR(255),
        owner_name VARCHAR(255),
        product_name VARCHAR(255),
        hs_code VARCHAR(50),
        product_spec TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        buyer_name VARCHAR(255),
        buyer_country VARCHAR(100),
        buyer_address TEXT,
        incoterm VARCHAR(50),
        payment_method VARCHAR(100),
        transaction_date DATE,
        invoice_ref_no VARCHAR(100),
        port_loading VARCHAR(255),
        port_destination VARCHAR(255),
        vessel_name VARCHAR(255),
        etd_date DATE,
        eta_date DATE,
        container_no VARCHAR(100),
        seal_no VARCHAR(100),
        container_type VARCHAR(100),
        forwarder_name VARCHAR(255),
        pickup_address TEXT,
        usd_idr_rate NUMERIC(15, 2),
        price_at_warehouse NUMERIC(15, 2),
        qty_kg NUMERIC(15, 2),
        loading_cost NUMERIC(15, 2),
        trucking_cost NUMERIC(15, 2),
        thc_cost NUMERIC(15, 2),
        insurance_pct NUMERIC(5, 2),
        deposit_pct NUMERIC(5, 2),
        bank_account TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_export_documents_user ON export_documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_export_documents_updated ON export_documents(updated_at DESC);
    """
    try:
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
            conn.commit()
            conn.close()
            logger.info("✅ Database table 'export_documents' ready.")
    except Exception as e:
        logger.warning(f"⚠️ Could not auto-initialize export_documents table in PostgreSQL: {e}")


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def _to_float_or_none(v: Any) -> Optional[float]:
    """Coerce empty string / None → None, otherwise → float."""
    if v is None or v == "" or v == "null":
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def _to_str_or_none(v: Any) -> Optional[str]:
    """Coerce empty string → None."""
    if v is None or (isinstance(v, str) and v.strip() == ""):
        return None
    return str(v)


# ─────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────
class ItemSchema(BaseModel):
    name: Optional[str] = ""
    hs_code: Optional[str] = ""
    qty_kg: Optional[float] = 0
    qty_bags: Optional[float] = 0
    price_usd: Optional[float] = 0
    total_usd: Optional[float] = 0

    @field_validator("qty_kg", "qty_bags", "price_usd", "total_usd", mode="before")
    @classmethod
    def coerce_floats(cls, v):
        return _to_float_or_none(v) or 0


class DocDraftSchema(BaseModel):
    title: Optional[str] = "Draft Dokumen Ekspor"
    # Step 1: Profil UMKM
    company_logo_url: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    owner_name: Optional[str] = None
    # Step 2: Produk & Buyer
    product_name: Optional[str] = None
    hs_code: Optional[str] = None
    product_spec: Optional[str] = None
    items: Optional[List[ItemSchema]] = []
    buyer_name: Optional[str] = None
    buyer_country: Optional[str] = None
    buyer_address: Optional[str] = None
    incoterm: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_date: Optional[str] = None
    # Step 3: Pengiriman
    port_loading: Optional[str] = None
    port_destination: Optional[str] = None
    vessel_name: Optional[str] = None
    etd_date: Optional[str] = None
    eta_date: Optional[str] = None
    container_no: Optional[str] = None
    seal_no: Optional[str] = None
    container_type: Optional[str] = None
    forwarder_name: Optional[str] = None
    pickup_address: Optional[str] = None
    invoice_ref_no: Optional[str] = None
    # Step 4: Keuangan
    usd_idr_rate: Optional[float] = None
    price_at_warehouse: Optional[float] = None
    qty_kg: Optional[float] = None
    loading_cost: Optional[float] = None
    trucking_cost: Optional[float] = None
    thc_cost: Optional[float] = None
    insurance_pct: Optional[float] = None
    deposit_pct: Optional[float] = None
    bank_account: Optional[str] = None

    # ── Coerce empty strings for numeric fields ──────────────────
    @field_validator(
        "usd_idr_rate", "price_at_warehouse", "qty_kg",
        "loading_cost", "trucking_cost", "thc_cost",
        "insurance_pct", "deposit_pct",
        mode="before"
    )
    @classmethod
    def coerce_numerics(cls, v):
        return _to_float_or_none(v)

    # ── Coerce empty strings for date fields → None ───────────────
    @field_validator(
        "transaction_date", "etd_date", "eta_date",
        mode="before"
    )
    @classmethod
    def coerce_dates(cls, v):
        return _to_str_or_none(v)

    # ── Coerce all other optional string fields ───────────────────
    @field_validator(
        "company_name", "company_address", "company_phone",
        "company_email", "company_website", "owner_name",
        "product_name", "hs_code", "product_spec",
        "buyer_name", "buyer_country", "buyer_address",
        "incoterm", "payment_method", "invoice_ref_no",
        "port_loading", "port_destination", "vessel_name",
        "container_no", "seal_no", "container_type",
        "forwarder_name", "pickup_address", "bank_account",
        mode="before"
    )
    @classmethod
    def coerce_strings(cls, v):
        return _to_str_or_none(v)


# ─────────────────────────────────────────────────────────────────
# Helper: convert DB row to dict
# ─────────────────────────────────────────────────────────────────
def _row_to_dict(row) -> dict:
    if not row:
        return {}
    d = dict(row)
    # Ensure items is list of dicts
    if "items" in d and d["items"] is None:
        d["items"] = []
    if "items" in d and isinstance(d["items"], str):
        try:
            d["items"] = json.loads(d["items"])
        except Exception:
            d["items"] = []
    return d


# ─────────────────────────────────────────────────────────────────
# DRAFT CRUD
# ─────────────────────────────────────────────────────────────────
@router.post("/draft/save")
def save_draft(
    body: DocDraftSchema,
    doc_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Create or update a draft. If doc_id provided → UPDATE, else → INSERT."""
    user_id = str(current_user["id"])
    target_id = doc_id or str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # Prepare draft dict
    draft_dict = body.dict()
    draft_dict["id"] = target_id
    draft_dict["user_id"] = user_id
    draft_dict["status"] = "draft"
    draft_dict["updated_at"] = now_iso
    if not doc_id:
        draft_dict["created_at"] = now_iso

    # Update in-memory fallback cache first
    if user_id not in FALLBACK_DRAFTS:
        FALLBACK_DRAFTS[user_id] = {}
    FALLBACK_DRAFTS[user_id][target_id] = draft_dict

    items_json = json.dumps([item.dict() for item in (body.items or [])])

    try:
        if doc_id:
            # UPDATE
            query = """
            UPDATE export_documents SET
                title = %s, company_logo_url = %s, company_name = %s, company_address = %s,
                company_phone = %s, company_email = %s, company_website = %s, owner_name = %s,
                product_name = %s, hs_code = %s, product_spec = %s, items = %s::jsonb,
                buyer_name = %s, buyer_country = %s, buyer_address = %s, incoterm = %s,
                payment_method = %s, transaction_date = %s,
                port_loading = %s, port_destination = %s, vessel_name = %s, etd_date = %s,
                eta_date = %s, container_no = %s, seal_no = %s, container_type = %s,
                forwarder_name = %s, pickup_address = %s, invoice_ref_no = %s,
                usd_idr_rate = %s, price_at_warehouse = %s, qty_kg = %s, loading_cost = %s,
                trucking_cost = %s, thc_cost = %s, insurance_pct = %s, deposit_pct = %s,
                bank_account = %s, updated_at = NOW()
            WHERE id = %s AND user_id = %s
            RETURNING id;
            """
            params = (
                body.title, body.company_logo_url, body.company_name, body.company_address,
                body.company_phone, body.company_email, body.company_website, body.owner_name,
                body.product_name, body.hs_code, body.product_spec, items_json,
                body.buyer_name, body.buyer_country, body.buyer_address, body.incoterm,
                body.payment_method, body.transaction_date or None,
                body.port_loading, body.port_destination, body.vessel_name,
                body.etd_date or None, body.eta_date or None,
                body.container_no, body.seal_no, body.container_type,
                body.forwarder_name, body.pickup_address, body.invoice_ref_no,
                body.usd_idr_rate, body.price_at_warehouse, body.qty_kg,
                body.loading_cost, body.trucking_cost, body.thc_cost,
                body.insurance_pct, body.deposit_pct, body.bank_account,
                target_id, user_id
            )
            result = execute_query(query, params, fetch=True)
            if result and len(result) > 0:
                return {"id": str(result[0]["id"]), "status": "updated"}
            # If DB returned empty (e.g. offline), return fallback
            return {"id": target_id, "status": "updated"}
        else:
            # INSERT
            query = """
            INSERT INTO export_documents (
                id, user_id, title, company_logo_url, company_name, company_address,
                company_phone, company_email, company_website, owner_name,
                product_name, hs_code, product_spec, items,
                buyer_name, buyer_country, buyer_address, incoterm,
                payment_method, transaction_date,
                port_loading, port_destination, vessel_name, etd_date, eta_date,
                container_no, seal_no, container_type, forwarder_name, pickup_address, invoice_ref_no,
                usd_idr_rate, price_at_warehouse, qty_kg, loading_cost, trucking_cost,
                thc_cost, insurance_pct, deposit_pct, bank_account
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING id;
            """
            params = (
                target_id, user_id,
                body.title, body.company_logo_url, body.company_name, body.company_address,
                body.company_phone, body.company_email, body.company_website, body.owner_name,
                body.product_name, body.hs_code, body.product_spec, items_json,
                body.buyer_name, body.buyer_country, body.buyer_address, body.incoterm,
                body.payment_method, body.transaction_date or None,
                body.port_loading, body.port_destination, body.vessel_name,
                body.etd_date or None, body.eta_date or None,
                body.container_no, body.seal_no, body.container_type,
                body.forwarder_name, body.pickup_address, body.invoice_ref_no,
                body.usd_idr_rate, body.price_at_warehouse, body.qty_kg,
                body.loading_cost, body.trucking_cost, body.thc_cost,
                body.insurance_pct, body.deposit_pct, body.bank_account
            )
            result = execute_query(query, params, fetch=True)
            if result and len(result) > 0:
                return {"id": str(result[0]["id"]), "status": "created"}
            return {"id": target_id, "status": "created"}

    except Exception as e:
        logger.warning(f"Database save error (using fallback store): {e}")
        return {"id": target_id, "status": "created" if not doc_id else "updated"}


@router.get("/draft/list")
def list_drafts(current_user: dict = Depends(get_current_user)):
    """Get all drafts for current user (summary only)."""
    user_id = str(current_user["id"])
    query = """
    SELECT id, title, status, company_name, buyer_name, buyer_country,
           created_at, updated_at
    FROM export_documents
    WHERE user_id = %s
    ORDER BY updated_at DESC;
    """
    try:
        rows = execute_query(query, (user_id,), fetch=True)
        if rows and len(rows) > 0:
            return [_row_to_dict(r) for r in rows]
    except Exception as e:
        logger.warning(f"Database list error (using fallback store): {e}")

    # Fallback from memory
    user_drafts = FALLBACK_DRAFTS.get(user_id, {})
    return [
        {
            "id": d["id"],
            "title": d.get("title") or "Draft Dokumen Ekspor",
            "status": d.get("status", "draft"),
            "company_name": d.get("company_name", ""),
            "buyer_name": d.get("buyer_name", ""),
            "buyer_country": d.get("buyer_country", ""),
            "created_at": d.get("created_at", ""),
            "updated_at": d.get("updated_at", ""),
        }
        for d in user_drafts.values()
    ]


@router.get("/draft/{doc_id}")
def get_draft(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Get full draft data by ID."""
    user_id = str(current_user["id"])
    query = "SELECT * FROM export_documents WHERE id = %s AND user_id = %s"
    try:
        rows = execute_query(query, (doc_id, user_id), fetch=True)
        if rows and len(rows) > 0:
            return _row_to_dict(rows[0])
    except Exception as e:
        logger.warning(f"Database get draft error (checking fallback): {e}")

    # Fallback from memory
    user_drafts = FALLBACK_DRAFTS.get(user_id, {})
    if doc_id in user_drafts:
        return user_drafts[doc_id]

    raise HTTPException(status_code=404, detail="Draft tidak ditemukan.")


@router.delete("/draft/{doc_id}")
def delete_draft(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a draft."""
    user_id = str(current_user["id"])
    query = "DELETE FROM export_documents WHERE id = %s AND user_id = %s RETURNING id"
    try:
        execute_query(query, (doc_id, user_id), fetch=True)
    except Exception as e:
        logger.warning(f"Database delete draft error: {e}")

    # Clean fallback store
    if user_id in FALLBACK_DRAFTS and doc_id in FALLBACK_DRAFTS[user_id]:
        del FALLBACK_DRAFTS[user_id][doc_id]

    return {"status": "deleted", "id": doc_id}


# ─────────────────────────────────────────────────────────────────
# PDF GENERATION
# ─────────────────────────────────────────────────────────────────
VALID_DOC_TYPES = [
    "invoice", "proforma-invoice", "packing-list", "shipping-instruction",
    "surat-penawaran", "sales-contract-buyer", "kontrak-supplier",
    "surat-jalan", "perhitungan-biaya"
]

DOC_LABELS = {
    "invoice": "Commercial Invoice",
    "proforma-invoice": "Proforma Invoice",
    "packing-list": "Packing List",
    "shipping-instruction": "Shipping Instruction",
    "surat-penawaran": "Surat Penawaran",
    "sales-contract-buyer": "Sales Contract",
    "kontrak-supplier": "Kontrak Supplier",
    "surat-jalan": "Surat Jalan",
    "perhitungan-biaya": "Perhitungan Biaya Ekspor",
}


@router.post("/generate/{doc_type}")
def generate_document(
    doc_type: str,
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate a PDF for the given doc_type from draft data."""
    if doc_type not in VALID_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type tidak valid: {doc_type}")

    user_id = str(current_user["id"])
    data = None

    # Try database first
    try:
        query = "SELECT * FROM export_documents WHERE id = %s AND user_id = %s"
        rows = execute_query(query, (doc_id, user_id), fetch=True)
        if rows and len(rows) > 0:
            data = _row_to_dict(rows[0])
    except Exception as e:
        logger.warning(f"Database query error during PDF gen: {e}")

    # Fallback to memory store if not found in DB
    if not data:
        user_drafts = FALLBACK_DRAFTS.get(user_id, {})
        data = user_drafts.get(doc_id)

    if not data:
        raise HTTPException(status_code=404, detail="Draft data tidak ditemukan untuk pembuatan PDF.")

    try:
        filepath = generate_doc(doc_type, data)
    except Exception as e:
        logger.error(f"ReportLab PDF generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Gagal membuat PDF: {str(e)}")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="File PDF tidak terbuat pada server.")

    company = (data.get("company_name") or "dokumen").replace(" ", "_")
    safe_filename = f"{doc_type}_{company}.pdf"

    return FileResponse(
        path=filepath,
        filename=safe_filename,
        media_type="application/pdf"
    )
