from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.pdf_service import generate_invoice_pdf
from app.api.umkm import get_profile
import uuid
from datetime import datetime
import os

router = APIRouter()

class DocRequest(BaseModel):
    user_id: str
    items: list # List of {desc, hs_code, qty, unit, price}
    destination_country: str

@router.post("/generate/invoice")
async def create_invoice(request: DocRequest):
    # 1. Fetch UMKM Profile
    try:
        profile = await get_profile(request.user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Profil UMKM belum diisi.")

    # 2. Prepare Data for Invoice
    invoice_data = {
        "business_name": profile['business_name'],
        "location": profile['location'],
        "owner_name": profile['owner_name'],
        "invoice_no": f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}",
        "date": datetime.now().strftime("%d %B %Y"),
        "items": request.items,
        "destination": request.destination_country
    }

    # 3. Generate PDF
    filename = f"invoice_{request.user_id}_{uuid.uuid4().hex[:6]}.pdf"
    filepath = generate_invoice_pdf(invoice_data, filename)

    if os.path.exists(filepath):
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/pdf'
        )
@router.post("/generate/packing-list")
async def create_packing_list(request: DocRequest):
    profile = await get_profile(request.user_id)
    
    pl_data = {
        "business_name": profile['business_name'],
        "location": profile['location'],
        "pl_no": f"PL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}",
        "date": datetime.now().strftime("%d %B %Y"),
        "items": request.items
    }

    filename = f"packing_list_{request.user_id}_{uuid.uuid4().hex[:6]}.pdf"
    filepath = generate_invoice_pdf(pl_data, filename) # Temporary: use same PL logic or refactor

    return FileResponse(path=filepath, filename=filename, media_type='application/pdf')
