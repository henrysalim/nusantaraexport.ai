"""
Post-Export Solver Service — Real-time AI troubleshooting for cargo and buyer issues.
Uses Gemini 3.1 Flash Lite to generate dynamic resolutions, cost impacts, and professional emails.
"""
import json
import logging
import os
import re
from typing import Optional

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.1-flash-lite"


def _get_gemini_key() -> Optional[str]:
    key = os.getenv("GEMINI_API_KEY", "").strip('"').strip("'")
    return key if key else None


def _call_gemini(prompt: str, max_tokens: int = 1200) -> Optional[str]:
    key = _get_gemini_key()
    if not key:
        return None
    try:
        import requests
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }
        resp = requests.post(url, json=payload, timeout=25)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini call failed in post_export_service: {e}")
        return None


def solve_post_export(problem_type: str, shipment_value: float, description: str) -> dict:
    """
    Generate dynamic resolution steps, financial impact analysis, and email drafts.
    """
    prompt = f"""You are a senior international trade dispute & logistics resolution specialist.
Analyze this post-export problem:
  - Problem Type: {problem_type} ("customs_hold", "transit_damage", "buyer_dispute", or "logistics_delay")
  - Cargo Value: USD {shipment_value:,.2f}
  - Exporter Description: "{description}"

Provide a tailored resolution plan. Your response must be a JSON object with this structure:
{{
  "problem_title": "Concise, descriptive title in Indonesian",
  "resolution_steps": [
    "Step 1 in Indonesian (clear and actionable)",
    "Step 2 in Indonesian",
    "Step 3 in Indonesian",
    "Step 4 in Indonesian"
  ],
  "financial_impact": {{
    "estimated_cost_or_loss": "Estimated cost in USD or % based on cargo value",
    "additional_fee": "Demurrage/relabeling/legal cost estimate",
    "recommendation": "Indonesian recommendation, e.g. 'Ajukan klaim asuransi segera (hemat 90% kerugian)'"
  }},
  "email_draft": "Professional English email draft to the appropriate party (customs agent, buyer, insurer, or carrier) explaining the situation and suggesting resolution.",
  "claim_form_template": "A brief structural textual template for filing a claim or notice (e.g. 'CLAIM NOTICE TO CARRIER | Date: ... | Ocean Vessel: ...')",
  "timeline": "e.g., '3-7 hari kerja untuk penyelesaian'"
}}

Ensure all Indonesian text is natural and helpful. Respond ONLY with valid JSON."""

    raw = _call_gemini(prompt)
    if raw:
        try:
            raw = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()
            data = json.loads(raw)
            required = [
                "problem_title", "resolution_steps", "financial_impact",
                "email_draft", "claim_form_template", "timeline"
            ]
            if all(k in data for k in required):
                return data
        except Exception as e:
            logger.warning(f"Failed to parse solver response: {e}")

    # Fallback to local default resolver
    return get_fallback_solver(problem_type, shipment_value, description)


def get_fallback_solver(problem_type: str, shipment_value: float, description: str) -> dict:
    """Offline fallback for post-export solver."""
    if problem_type == "customs_hold":
        return {
            "problem_title": "Barang Tertahan di Pabean Tujuan (Berdasarkan Aturan Bea Cukai)",
            "resolution_steps": [
                "Hubungi kepabeanan negara tujuan untuk meminta discrepancy report resmi.",
                "Ajukan permohonan re-labeling lokal jika masalah pada format label.",
                "Kirimkan dokumen deklarasi revisi dalam format PDF resolusi tinggi.",
                "Koordinasi dengan buyer untuk pengurusan lokal di pelabuhan."
            ],
            "financial_impact": {
                "estimated_loss": "Maks. 30% dari nilai kargo jika diretur",
                "additional_fee": "Demurrage/storage USD 150/hari",
                "recommendation": "Lakukan re-labeling lokal di bonded warehouse."
            },
            "email_draft": (
                "Dear Customs Clearance Agent,\n\n"
                "We have corrected the packaging label documents. Please find attached the corrected PDF. "
                "We kindly request approval for local labeling modification.\n\n"
                "Warm regards,\n[Your Company Name]"
            ),
            "claim_form_template": "NOTICE OF HOLD: SHIPMENT VALUED AT USD " + f"{shipment_value:,.2f}",
            "timeline": "5-10 hari kerja"
        }
    elif problem_type == "transit_damage":
        loss = shipment_value * 0.90
        return {
            "problem_title": "Kerusakan Barang Saat Transit",
            "resolution_steps": [
                "Ambil bukti visual (foto/video) kondisi kargo saat un-stuffing.",
                "Minta Surveyor Independen untuk melakukan verifikasi kerusakan.",
                "Ajukan Notice of Claim tertulis kepada maskapai pelayaran/udara.",
                "Hubungi perusahaan asuransi kargo Anda."
            ],
            "financial_impact": {
                "estimated_loss": f"USD {loss:,.0f} (90% kerugian)",
                "insurance_coverage": "Tertutup 80-100% oleh polis Marine Cargo",
                "recommendation": "Segera terbitkan Notice of Claim kepada pihak carrier."
            },
            "email_draft": (
                "Dear Claims Department,\n\n"
                f"We hereby notify you of cargo damage on shipment valued at USD {shipment_value:,.2f}. "
                "Attached is the survey report and photos. Please process this claim under our policy.\n\n"
                "Sincerely,\n[Your Company Name]"
            ),
            "claim_form_template": "CARGO DAMAGE CLAIM FORM | VALUE: USD " + f"{shipment_value:,.2f}",
            "timeline": "14-30 hari kerja"
        }
    elif problem_type == "buyer_dispute":
        return {
            "problem_title": "Sengketa Kontrak / Kualitas dengan Buyer",
            "resolution_steps": [
                "Kumpulkan semua bukti email, kontrak penjualan (Sales Contract), dan BL.",
                "Tawarkan kompensasi parsial/diskon untuk kiriman berikutnya.",
                "Gunakan L/C discrepancy waiver di bank penjamin jika ada.",
                "Hubungi atase perdagangan Indonesia di negara tujuan jika dispute buntu."
            ],
            "financial_impact": {
                "estimated_loss": f"Diskon parsial USD {shipment_value*0.15:,.0f}",
                "legal_cost": "Bervariasi (disarankan negosiasi damai)",
                "recommendation": "Tawarkan diskon bersahabat 10-15% sebagai solusi damai."
            },
            "email_draft": (
                "Dear [Buyer Name],\n\n"
                "We want to resolve the quality dispute amicably. We propose a 15% discount on the invoice "
                "value to compensate for the discrepancies you described.\n\n"
                "Best regards,\n[Your Company Name]"
            ),
            "claim_form_template": "AMENDMENT WAIVER: AMICABLE DISPUTE RESOLUTION",
            "timeline": "7-21 hari kerja"
        }
    else:  # logistics_delay
        return {
            "problem_title": "Keterlambatan Logistik / Transit",
            "resolution_steps": [
                "Hubungi shipping line untuk meminta Revised ETA dan Letter of Delay.",
                "Kirimkan jadwal pengiriman yang diperbarui secara proaktif ke buyer.",
                "Minta perpanjangan masa berlaku L/C (Letter of Credit) jika mendekati kadaluwarsa."
            ],
            "financial_impact": {
                "estimated_loss": "Risiko penalti keterlambatan 3-5%",
                "additional_fee": "Biaya amandemen dokumen USD 100",
                "recommendation": "Segera hubungi buyer dan amandemen L/C di bank penerbit."
            },
            "email_draft": (
                "Dear [Buyer Name],\n\n"
                "We regret to inform you that our shipment #[ID] has been delayed due to port congestion. "
                "The revised arrival date is [ETA]. We apologize for the inconvenience.\n\n"
                "Warm regards,\n[Your Company Name]"
            ),
            "claim_form_template": "CARRIER DELAY NOTICE | CARGO VALUE: USD " + f"{shipment_value:,.2f}",
            "timeline": "Tergantung pelayaran / ETA terbaru"
        }
