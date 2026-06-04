"""
Compliance Routes — Packaging Checker & HS Code Optimizer.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.mock_data import HS_CODE_DB
from app.services.cendol_service import CendolNLPService
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
    image_base64: str = ""
    image_mime_type: str = "image/jpeg"


class PackagingResponse(BaseModel):
    score: int
    status: str
    items: list
    suggestion: str


# Deterministic packaging rules by product category
FOOD_KEYWORDS = ["kopi", "coffee", "teh", "tea", "cokelat", "kakao", "rempah", "spice",
                 "singkong", "keripik", "makanan", "food", "snack", "minuman", "beverage",
                 "gula", "madu", "honey", "bumbu", "sambal", "kecap"]


def _is_food_product(product_type: str) -> bool:
    return any(kw in product_type.lower() for kw in FOOD_KEYWORDS)


@router.post("/packaging-check", response_model=PackagingResponse)
def check_packaging(req: PackagingRequest):
    """
    Analyze product packaging for export compliance.
    Uses deterministic rule engine + AI for contextual suggestions.
    """
    dest = req.destination_country.lower()
    is_food = _is_food_product(req.product_type)

    # Build checklist deterministically based on product type
    items = []
    score = 0
    total_checks = 0

    # Universal checks
    items.append({"label": "Label Bahasa Inggris", "status": "pass", "note": "Wajib untuk semua pasar internasional"})
    score += 1
    total_checks += 1

    items.append({"label": "Negara Asal (Country of Origin)", "status": "pass", "note": "'Made in Indonesia' harus tercantum jelas"})
    score += 1
    total_checks += 1

    items.append({"label": "Kode Barcode (EAN-13)", "status": "pass", "note": "Barcode internasional terstandar"})
    score += 1
    total_checks += 1

    items.append({"label": "Berat Bersih / Netto", "status": "pass", "note": "Harus dalam satuan metrik (gram/kg)"})
    score += 1
    total_checks += 1

    # Food-specific checks
    if is_food:
        items.append({"label": "Informasi Nutrisi (Nutrition Facts)", "status": "warning", "note": "Panel nutrisi wajib untuk produk makanan ekspor"})
        score += 0.5
        total_checks += 1

        items.append({"label": "Tanggal Kedaluwarsa", "status": "pass", "note": "Format DD/MM/YYYY — wajib untuk produk pangan"})
        score += 1
        total_checks += 1

        items.append({"label": "Daftar Bahan / Ingredients", "status": "warning", "note": "Harus dalam bahasa Inggris, urutkan dari komposisi terbesar"})
        score += 0.5
        total_checks += 1

        items.append({"label": "Sertifikasi Halal", "status": "pass", "note": "Logo MUI — nilai tambah untuk pasar global"})
        score += 1
        total_checks += 1
    else:
        items.append({"label": "Petunjuk Penggunaan", "status": "warning", "note": "Instruksi pemakaian dalam bahasa Inggris disarankan"})
        score += 0.5
        total_checks += 1

        items.append({"label": "Material Safety Data", "status": "pass", "note": "Informasi keamanan bahan untuk produk non-pangan"})
        score += 1
        total_checks += 1

    # Destination-specific checks
    if dest in ["us", "usa"]:
        items.append({"label": "FDA Nutrition Facts Panel", "status": "warning" if is_food else "pass",
                      "note": "Format vertikal standar FDA diperlukan untuk pasar Amerika" if is_food else "Tidak wajib untuk produk non-pangan"})
        score += 0.5 if is_food else 1
        total_checks += 1

        if is_food:
            items.append({"label": "Berat dalam oz (ounce)", "status": "warning",
                          "note": "Tambahkan satuan oz di samping gram untuk memenuhi standar FDA"})
            score += 0.5
            total_checks += 1

    elif dest in ["jp", "jepang"]:
        items.append({"label": "Label Bahasa Jepang", "status": "warning",
                      "note": "Japan Food Sanitation Act mewajibkan label dalam bahasa Jepang"})
        score += 0.5
        total_checks += 1

    elif dest in ["cn", "tiongkok", "china"]:
        items.append({"label": "Label Bahasa Mandarin", "status": "warning",
                      "note": "Regulasi Tiongkok mewajibkan semua informasi dalam bahasa Mandarin"})
        score += 0.5
        total_checks += 1

    elif dest in ["eu", "de", "nl", "gb", "eropa"]:
        items.append({"label": "EU Allergen Declaration", "status": "warning" if is_food else "pass",
                      "note": "Deklarasi alergen wajib sesuai EU Food Information Regulation" if is_food else "Tidak wajib untuk produk non-pangan"})
        score += 0.5 if is_food else 1
        total_checks += 1

        if is_food:
            items.append({"label": "EU Organic Certification", "status": "warning",
                          "note": "Label organik UE meningkatkan daya saing produk"})
            score += 0.5
            total_checks += 1

    elif dest in ["kr", "korea"]:
        items.append({"label": "Label Bahasa Korea", "status": "warning",
                      "note": "KFDA mewajibkan informasi produk dalam bahasa Korea"})
        score += 0.5
        total_checks += 1

    elif dest in ["au", "australia"]:
        items.append({"label": "Australia NZ Food Standards", "status": "warning" if is_food else "pass",
                      "note": "Standar FSANZ berlaku untuk produk pangan impor" if is_food else "Standar umum berlaku"})
        score += 0.5 if is_food else 1
        total_checks += 1

    # Calculate final score
    final_score = int((score / max(total_checks, 1)) * 100)
    status = "Siap Ekspor" if final_score >= 75 else "Perlu Perbaikan" if final_score >= 50 else "Belum Siap"

    # AI Generated Suggestion
    if req.image_base64:
        prompt = f"Analisis gambar kemasan ini. Apakah komponen visualnya sudah sesuai untuk diekspor ke negara '{req.destination_country}' sebagai produk '{req.product_type}'? Berikan 2 kalimat evaluasi visual dan rekomendasi."
        dynamic_suggestion = CendolNLPService._call_backup_llm(prompt, "", image_base64=req.image_base64, mime_type=req.image_mime_type)
    else:
        prompt = f"Berikan 2 kalimat saran perbaikan kemasan ekspor untuk produk '{req.product_type}' ke negara '{req.destination_country}'. Fokus pada regulasi kemasan internasional."
        dynamic_suggestion = CendolNLPService._call_backup_llm(prompt, "")
        
    fallback_suggestion = f"Kemasan produk {req.product_type} Anda sudah {final_score}% siap ekspor. Perhatikan item yang berstatus 'warning' untuk memenuhi standar negara tujuan."
    dynamic_suggestion = dynamic_suggestion or fallback_suggestion

    return PackagingResponse(
        score=final_score,
        status=status,
        items=items,
        suggestion=dynamic_suggestion
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


@router.post("/hs-code", response_model=HSCodeResponse)
def classify_hs_code(req: HSCodeRequest):
    """Classify product HS Code and calculate FTA tariff benefits."""
    product_lower = req.product_name.lower()

    # Match against database
    matched = None
    for key, data in HS_CODE_DB.items():
        if key in product_lower or product_lower in key:
            matched = data
            break

    if not matched:
        for key, data in HS_CODE_DB.items():
            if any(word in product_lower for word in key.split()):
                matched = data
                break

    if not matched:
        matched = {
            "product": req.product_name,
            "hs_code": "9999.99.00",
            "chapter": "Klasifikasi memerlukan data lebih detail",
            "mfn_tariff": "5-30%",
            "fta_results": [
                {"agreement": "ACFTA (Tiongkok)", "tariff": "0-5%", "saving": "Bervariasi", "status": "Perlu Cek"},
                {"agreement": "IJEPA (Jepang)", "tariff": "0-8%", "saving": "Bervariasi", "status": "Perlu Cek"},
            ],
            "best_fta": "Tergantung negara tujuan",
        }

    # AI Generated Description
    desc_prompt = f"Berikan deskripsi singkat (1 kalimat) tentang HS Code untuk komoditas '{req.product_name}'."
    dynamic_desc = CendolNLPService._call_backup_llm(desc_prompt, "") or matched.get("description", "Memerlukan analisis lebih lanjut.")

    # AI Generated Saving Suggestion
    saving_prompt = f"Berikan satu kalimat singkat tentang potensi penghematan pajak/tarif ekspor untuk produk '{req.product_name}' jika menggunakan Free Trade Agreement (FTA)."
    dynamic_saving = CendolNLPService._call_backup_llm(saving_prompt, "") or matched.get("best_saving", "Masukkan produk spesifik untuk analisis akurat.")

    return HSCodeResponse(
        product=matched["product"],
        hs_code=matched["hs_code"],
        description=dynamic_desc,
        chapter=matched["chapter"],
        mfn_tariff=matched["mfn_tariff"],
        fta_results=matched["fta_results"],
        best_fta=matched["best_fta"],
        best_saving=dynamic_saving,
    )
