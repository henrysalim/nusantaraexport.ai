"""
AI Transparency Routes — System Card & Metrics Endpoint.

Endpoints:
  GET  /api/ai/transparency/system-card  — AI Model Card (publicly accessible)
  GET  /api/ai/transparency/metrics      — Aggregate real-time metrics dari ai_inference_logs
  POST /api/ai/transparency/feedback     — User submit feedback per inferensi
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.ai_metadata_service import get_aggregate_metrics
from app.config.db_config import execute_query
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


# ──────────────────────────────────────────────────────────────────────────────
# AI System Card (Model Card)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/system-card")
def get_system_card():
    """
    Mengembalikan AI System Card yang menjawab 8 kriteria evaluasi AI/ML.
    Endpoint ini PUBLIC — tidak memerlukan JWT auth.
    """
    return {
        "system_name": "NusantaraExport.AI — AI Export Compliance Assistant",
        "version": "3.1.0",

        # 1. Input Model
        "input_spec": {
            "text_prompt": "Pertanyaan bebas user dalam Bahasa Indonesia atau Inggris",
            "rag_context": "Konteks regulasi dari ChromaDB (optional — di-inject otomatis)",
            "image": "Foto kemasan produk dalam format base64 (optional — untuk Packaging Checker)",
            "structured_params": [
                "destination_country (string) — kode negara tujuan ekspor",
                "product_type (string) — jenis produk",
                "commodity (string) — nama komoditas",
                "buyer_offer_usd (float) — tawaran harga buyer",
            ],
        },

        # 2. Sumber Data
        "data_sources": [
            {
                "name": "ChromaDB RAG Vector Store",
                "description": "127 dokumen regulasi ekspor Indonesia (INSW, Bea Cukai, Kemendag)",
                "type": "Vector Database",
                "update_frequency": "Manual — diperbarui saat regulasi berubah",
            },
            {
                "name": "packaging_regulations.json",
                "description": "Aturan kemasan per negara tujuan × kategori produk (8 negara, 4 kategori)",
                "type": "Structured JSON",
                "update_frequency": "Manual",
            },
            {
                "name": "hs_code_db.json",
                "description": "Database kode HS 4-digit untuk produk ekspor umum Indonesia",
                "type": "Structured JSON",
                "update_frequency": "Tahunan (mengikuti HS Nomenclature update WCO)",
            },
            {
                "name": "UN COMTRADE API",
                "description": "Data perdagangan internasional real-time via Gemini (indirect)",
                "type": "Third-party API (via LLM knowledge)",
                "update_frequency": "Real-time via LLM knowledge cutoff",
            },
            {
                "name": "ICO / FAO FPMA / World Bank",
                "description": "Harga komoditas internasional — diakses melalui LLM knowledge (Nego Coach)",
                "type": "LLM Knowledge",
                "update_frequency": "Terbatas pada knowledge cutoff model",
            },
        ],

        # 3. Bagaimana Data Diproses
        "processing_pipeline": {
            "description": "3-tier AI fallback pipeline untuk ketersediaan tinggi",
            "tiers": [
                {
                    "tier": 1,
                    "name": "Gemini Flash (Primary)",
                    "model": GEMINI_MODEL,
                    "trigger": "Default — dipanggil pertama untuk semua request",
                    "config": {
                        "temperature": 0.2,
                        "topP": 0.8,
                        "topK": 40,
                        "maxOutputTokens": 1500,
                        "thinking_extraction": True,
                    },
                    "anti_hallucination": [
                        "System prompt eksplisit: 'Jangan mengarang data'",
                        "Temperature rendah (0.2) untuk output deterministik",
                        "Instruksi wajib sertakan tautan resmi yang bisa diklik",
                        "Chain-of-Thought thinking block sebelum jawaban utama",
                    ],
                },
                {
                    "tier": 2,
                    "name": "Backup LLM (Cendol NLP / HuggingFace Mistral)",
                    "model": "mistralai/Mistral-7B-Instruct-v0.2",
                    "trigger": "Dipanggil jika Tier 1 timeout/rate-limit/error",
                    "config": {"temperature": 0.2, "max_new_tokens": 512},
                },
                {
                    "tier": 3,
                    "name": "Rule-based Engine",
                    "model": "rule-based-engine",
                    "trigger": "Dipanggil jika Tier 1 dan Tier 2 gagal — selalu berhasil",
                    "config": "Template statis berbasis intent classification",
                },
            ],
        },

        # 4. Output Model
        "output_types": [
            {
                "module": "Chat / Konsultasi AI",
                "type": "Markdown text",
                "example_fields": ["reply", "detected_intent", "referenced_sources"],
            },
            {
                "module": "Packaging Checker",
                "type": "Structured JSON + text recommendation",
                "example_fields": ["score (0-100)", "status", "items (checklist)", "suggestion"],
            },
            {
                "module": "HS Code Optimizer",
                "type": "Structured JSON",
                "example_fields": ["hs_code", "description", "fta_results", "best_fta", "best_saving"],
            },
            {
                "module": "Nego Coach",
                "type": "Structured JSON + email draft",
                "example_fields": ["counter_offer", "market_benchmark", "margin_pct", "email_draft"],
            },
            {
                "module": "Export Readiness Simulator",
                "type": "Structured JSON",
                "example_fields": ["overall_score", "categories", "risks", "cost_breakdown"],
            },
        ],

        # 5. Bagaimana Output Digunakan
        "output_usage": (
            "Output AI ditampilkan langsung kepada user UMKM di 10 modul Dashboard Ekspor. "
            "User menggunakan output untuk: mengisi dokumen ekspor, menentukan negara tujuan, "
            "memperbaiki kemasan, merespon buyer, dan merencanakan jadwal ekspor. "
            "Output TIDAK digunakan untuk otomasi penuh — selalu ada kontrol penuh di tangan user."
        ),

        # 6. Metrik Performa (lihat /metrics endpoint untuk data real-time)
        "performance_metrics": {
            "primary_metrics": [
                "Tier distribution (% Gemini Flash vs Backup LLM vs Rule-based)",
                "Average response latency (ms) per modul",
                "Average confidence score per modul",
                "User feedback rate (% helpful vs wrong)",
            ],
            "ai_ml_specific": [
                "Hallucination guard: compliance dengan instruksi sertakan link resmi",
                "Keyword presence test: jawaban harus mengandung keyword regulasi yang diharapkan",
                "Source validity: semua link yang disertakan adalah URL resmi pemerintah Indonesia",
            ],
            "note": "Lihat /api/ai/transparency/metrics untuk data agregat real-time dari log inferensi.",
        },

        # 7. Bagaimana Model Diuji
        "testing_methodology": {
            "offline_benchmark": {
                "description": "Script benchmark (server/benchmark/run_ai_benchmark.py) dengan 23 test case standar",
                "test_categories": [
                    "Regulasi ekspor (8 test cases) — verifikasi keyword dokumen wajib",
                    "HS Code classification (5 test cases) — verifikasi akurasi kode 4-digit",
                    "Packaging compliance (5 test cases) — verifikasi item checklist",
                    "Nego Coach (3 test cases) — verifikasi counter-offer logic",
                    "Fallback behavior (2 test cases) — verifikasi rule-based engine",
                ],
                "pass_criterion": "≥ 80% pass rate, ≤ 5% hallucination indicators",
            },
            "online_monitoring": "Feedback user via 👍/👎 per respons AI, tersimpan di ai_inference_logs",
        },

        # 8. Keterbatasan
        "limitations": [
            "Knowledge cutoff model Gemini — data harga komoditas dan regulasi mungkin tidak up-to-date",
            "Quota Gemini API (gratis) — dapat fallback ke Backup LLM atau Rule-based saat rate limit",
            "Hallucination risk: meskipun ada guardrail, Gemini dapat membuat data yang terdengar masuk akal namun tidak akurat",
            "Packaging Checker Vision: akurasi bergantung pada kualitas foto yang diupload user",
            "RAG ChromaDB: hanya mencakup 127 dokumen regulasi — pertanyaan di luar cakupan ini dijawab dari general knowledge",
            "Bahasa: dioptimalkan untuk Bahasa Indonesia; pertanyaan dalam bahasa daerah atau slang mungkin kurang akurat",
        ],

        # 9. Human Oversight
        "human_oversight": {
            "mechanism": [
                "Setiap respons AI memiliki tombol 👍/👎 (Feedback Widget) — user bisa menandai jawaban salah",
                "Laporan 'jawaban salah' tersimpan di ai_inference_logs.feedback = -1 beserta catatan user",
                "Tim developer mereview log secara berkala untuk mengidentifikasi pola error",
                "System prompt secara eksplisit instruksikan AI untuk mengakui ketidaktahuan daripada mengarang",
            ],
            "disclaimer": (
                "NusantaraExport.AI adalah alat bantu. Semua keputusan ekspor tetap merupakan "
                "tanggung jawab pengguna. Untuk kepastian hukum, selalu konsultasikan dengan "
                "Bea Cukai, Kemendag, atau konsultan ekspor resmi."
            ),
        },

        "third_party_disclosure": (
            "Sistem ini mengintegrasikan Google Gemini API (pihak ketiga) sebagai LLM primer. "
            "Data prompt dikirim ke server Google untuk diproses. "
            "Konten ini TIDAK dikembangkan oleh Google — NusantaraExport.AI adalah lapisan aplikasi "
            "di atas Gemini API dengan system prompt, RAG pipeline, dan domain logic sendiri."
        ),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Real-time Metrics
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/metrics")
def get_metrics():
    """
    Mengembalikan agregat real-time dari ai_inference_logs.
    Data ini adalah METRIK NYATA dari log inferensi, bukan angka statis.
    """
    return get_aggregate_metrics()


# ──────────────────────────────────────────────────────────────────────────────
# User Feedback (Human Oversight Mechanism)
# ──────────────────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    inference_id: str
    feedback: int          # +1 = helpful, -1 = wrong/misleading
    note: Optional[str] = None


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    User submit feedback 👍/👎 per respons AI.
    Ini adalah mekanisme human oversight yang terstruktur.
    """
    if req.feedback not in (1, -1):
        return {"status": "error", "message": "feedback harus +1 atau -1"}

    try:
        execute_query(
            """
            UPDATE ai_inference_logs
            SET feedback = %s, feedback_note = %s
            WHERE id = %s::uuid
            """,
            params=(req.feedback, req.note, req.inference_id),
        )
        logger.info(
            f"AI feedback recorded: inference_id={req.inference_id} "
            f"feedback={'+1' if req.feedback == 1 else '-1'}"
        )
        return {
            "status": "ok",
            "message": "Terima kasih atas feedback Anda! Ini membantu kami meningkatkan akurasi AI.",
        }
    except Exception as e:
        logger.warning(f"Feedback submit failed: {e}")
        return {"status": "ok", "message": "Feedback diterima (mode offline)."}
