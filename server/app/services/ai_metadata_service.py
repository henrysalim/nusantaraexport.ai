"""
AIMetadataService — Pusat pengelolaan metadata inferensi AI.

Tanggung jawab:
  1. estimate_confidence()     — heuristic scoring berdasarkan tier + finish_reason
  2. extract_thinking_steps()  — parse <thinking>...</thinking> dari raw Gemini response
  3. build_ai_metadata()       — builder dict metadata AI yang konsisten lintas semua modul
  4. log_inference()           — simpan log ke PostgreSQL ai_inference_logs
  5. get_aggregate_metrics()   — query agregat untuk /api/ai/transparency/metrics
"""
import re
import uuid
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Confidence Scoring
# ──────────────────────────────────────────────────────────────────────────────

def estimate_confidence(
    tier: str,
    finish_reason: str = "STOP",
    temperature: float = 0.2,
    response_length: int = 0,
    thinking_steps_count: int = 0,
    response_time_ms: int = 0,
) -> float:
    """
    Heuristic confidence scoring berdasarkan berbagai sinyal respons AI.

    Faktor yang dipertimbangkan:
      - tier           : Gemini Flash > Backup LLM > Rule-based
      - finish_reason  : STOP = normal, MAX_TOKENS = terpotong (-0.20)
      - response_length: Respons pendek (<100 char) biasanya kurang informatif
      - thinking_steps : Adanya chain-of-thought meningkatkan kepercayaan
      - response_time_ms: Terlalu cepat (<300ms) atau error → lebih rendah
      - jitter kecil   : agar tidak selalu sama persis
    """
    import random

    # ── Tier baseline ──
    if tier == "gemini_flash":
        # temperature 0.1→ lebih determinis, temperature 0.7→ lebih kreatif
        base = max(0.78, 0.92 - (temperature * 0.20))
    elif tier == "backup_llm":
        base = 0.58
    else:  # rule_based — bukan AI, tapi tetap informatif jika data bagus
        base = 0.50

    # ── finish_reason modifier ──
    finish_modifiers = {
        "STOP": 0.0,
        "MAX_TOKENS": -0.18,   # respons terpotong — confidence turun
        "SAFETY": -0.55,       # blocked — sangat tidak pasti
        "RECITATION": -0.35,   # mungkin hanya mengulang data latihan
    }
    base += finish_modifiers.get(finish_reason, 0.0)

    # ── Response length modifier ──
    # Sangat pendek (<80 char) → mungkin fallback atau error
    # Panjang ideal (300-2000) → confidence lebih tinggi
    if response_length > 0:
        if response_length < 80:
            base -= 0.12
        elif response_length < 200:
            base -= 0.04
        elif response_length > 500:
            base += 0.03   # respons panjang & detail

    # ── Thinking steps modifier ──
    # Chain-of-thought meningkatkan kepercayaan (model "berpikir" lebih dalam)
    if thinking_steps_count >= 4:
        base += 0.04
    elif thinking_steps_count >= 2:
        base += 0.02

    # ── Response time heuristic ──
    # Terlalu cepat (< 400ms untuk Gemini) bisa tanda fallback atau error
    if tier == "gemini_flash" and 0 < response_time_ms < 400:
        base -= 0.06

    # ── Jitter kecil agar tidak selalu identik (±1–3%) ──
    jitter = random.uniform(-0.015, 0.025)
    base += jitter

    return round(max(0.10, min(0.97, base)), 3)


# ──────────────────────────────────────────────────────────────────────────────
# Thinking Step Extractor
# ──────────────────────────────────────────────────────────────────────────────

def extract_thinking_steps(raw_text: str) -> tuple:
    """
    Parse blok <thinking>...</thinking> dari respons Gemini mentah.

    Returns:
        (thinking_steps: list[str], clean_answer: str)
        - thinking_steps: daftar langkah reasoning (list string per baris)
        - clean_answer  : teks jawaban bersih tanpa blok <thinking>
    """
    if not raw_text:
        return [], ""

    thinking_pattern = re.compile(
        r"<thinking>(.*?)</thinking>",
        re.DOTALL | re.IGNORECASE
    )
    match = thinking_pattern.search(raw_text)

    if not match:
        return [], raw_text.strip()

    thinking_block = match.group(1).strip()
    clean_answer = thinking_pattern.sub("", raw_text).strip()

    # Pisahkan per baris non-kosong
    steps = [
        line.strip().lstrip("-•*0123456789. ")
        for line in thinking_block.split("\n")
        if line.strip()
    ]

    return steps, clean_answer


# ──────────────────────────────────────────────────────────────────────────────
# Metadata Builder
# ──────────────────────────────────────────────────────────────────────────────

def build_ai_metadata(
    tier: str,
    model: str,
    finish_reason: str,
    response_time_ms: int,
    thinking_steps: list,
    data_sources: list,
    temperature: float = 0.2,
    response_length: int = 0,
) -> dict:
    """
    Builder dict metadata AI yang konsisten lintas semua modul.
    """
    confidence = estimate_confidence(
        tier=tier,
        finish_reason=finish_reason,
        temperature=temperature,
        response_length=response_length,
        thinking_steps_count=len(thinking_steps) if thinking_steps else 0,
        response_time_ms=response_time_ms,
    )
    inference_id = str(uuid.uuid4())

    tier_labels = {
        "gemini_flash": "Gemini Flash",
        "backup_llm": "Backup LLM",
        "rule_based": "Rule-based Engine",
    }
    tier_icons = {
        "gemini_flash": "✨",
        "backup_llm": "🔄",
        "rule_based": "📋",
    }

    return {
        "inference_id": inference_id,
        "ai_tier": tier,
        "model_used": model or "unknown",
        "confidence": confidence,
        "finish_reason": finish_reason,
        "response_time_ms": response_time_ms,
        "thinking_steps": thinking_steps or [],
        "data_sources": data_sources or [],
        "tier_label": tier_labels.get(tier, tier),
        "tier_icon": tier_icons.get(tier, "🤖"),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Inference Logger (async-safe, non-blocking)
# ──────────────────────────────────────────────────────────────────────────────

def log_inference(
    module: str,
    metadata: dict,
    has_image: bool = False,
) -> None:
    """
    Simpan log inferensi ke PostgreSQL ai_inference_logs.
    Gagal secara diam-diam (tidak memblokir respons ke user).
    """
    try:
        from app.config.db_config import execute_query
        execute_query(
            """
            INSERT INTO ai_inference_logs
                (id, module, ai_tier, model_used, confidence, finish_reason,
                 response_time_ms, has_image)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            params=(
                metadata.get("inference_id"),
                module,
                metadata.get("ai_tier", "rule_based"),
                metadata.get("model_used"),
                metadata.get("confidence"),
                metadata.get("finish_reason"),
                metadata.get("response_time_ms"),
                has_image,
            ),
        )
    except Exception as e:
        # Log to stderr tapi jangan crash request
        logger.warning(f"ai_metadata log_inference failed (non-critical): {e}")


# ──────────────────────────────────────────────────────────────────────────────
# Aggregate Metrics
# ──────────────────────────────────────────────────────────────────────────────

def get_aggregate_metrics() -> dict:
    """
    Query agregat dari ai_inference_logs untuk /api/ai/transparency/metrics.

    Returns dict siap render di AI System Card / dashboard.
    """
    try:
        from app.config.db_config import execute_query

        rows = execute_query(
            "SELECT * FROM ai_metrics_summary ORDER BY total_calls DESC",
            fetch=True,
        )

        if not rows:
            return _empty_metrics()

        totals = {
            "total_inferences": sum(int(r["total_calls"]) for r in rows),
            "gemini_calls": sum(int(r["gemini_calls"]) for r in rows),
            "backup_llm_calls": sum(int(r["backup_llm_calls"]) for r in rows),
            "rule_based_calls": sum(int(r["rule_based_calls"]) for r in rows),
            "helpful_count": sum(int(r["helpful_count"]) for r in rows),
            "wrong_count": sum(int(r["wrong_count"]) for r in rows),
        }

        total = max(totals["total_inferences"], 1)
        feedback_total = max(
            totals["helpful_count"] + totals["wrong_count"], 1
        )

        tier_distribution = {
            "gemini_flash": round(totals["gemini_calls"] / total * 100, 1),
            "backup_llm": round(totals["backup_llm_calls"] / total * 100, 1),
            "rule_based": round(totals["rule_based_calls"] / total * 100, 1),
        }

        per_module = {}
        for r in rows:
            per_module[r["module"]] = {
                "total_calls": int(r["total_calls"]),
                "avg_confidence": float(r["avg_confidence"] or 0),
                "avg_response_time_ms": int(r["avg_response_time_ms"] or 0),
            }

        return {
            "total_inferences": totals["total_inferences"],
            "tier_distribution": tier_distribution,
            "per_module": per_module,
            "feedback": {
                "helpful_pct": round(
                    totals["helpful_count"] / feedback_total * 100, 1
                ),
                "wrong_pct": round(
                    totals["wrong_count"] / feedback_total * 100, 1
                ),
                "total_feedback": totals["helpful_count"] + totals["wrong_count"],
            },
        }

    except Exception as e:
        logger.warning(f"get_aggregate_metrics failed: {e}")
        return _empty_metrics()


def _empty_metrics() -> dict:
    """Return struktur metrik kosong saat DB tidak tersedia."""
    return {
        "total_inferences": 0,
        "tier_distribution": {
            "gemini_flash": 0.0,
            "backup_llm": 0.0,
            "rule_based": 0.0,
        },
        "per_module": {},
        "feedback": {
            "helpful_pct": 0.0,
            "wrong_pct": 0.0,
            "total_feedback": 0,
        },
    }
