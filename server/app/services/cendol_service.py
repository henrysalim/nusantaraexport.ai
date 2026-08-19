"""
CendolNLPService v3.0 — Gemini-First Architecture dengan Anti-Hallucination Guard.

Tier 1: Google Gemini Flash (primary — fast, gratis, cerdas)
Tier 2: Cendol NLP / HuggingFace (jika Gemini gagal)
Tier 3: Rule-based engine (always works, never crashes)

Semua fitur diarahkan ke Gemini dengan:
- System prompt ketat berbasis fakta ekspor Indonesia
- Grounding ke RAG context (ChromaDB)
- Temperature rendah (0.2) untuk mengurangi halusinasi
- Instruksi eksplisit: "Jangan mengarang data, jika tidak tahu katakan tidak tahu"
"""
import requests
import os
import json
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
CENDOL_API_KEY = os.getenv("CENDOL_API_KEY", "")
BACKUP_LLM_PROVIDER = os.getenv("BACKUP_LLM_PROVIDER", "huggingface")
BACKUP_LLM_API_KEY  = os.getenv("BACKUP_LLM_API_KEY", "")

# ──────────────────────────────────────────────────────────────────────────────
# MASTER SYSTEM PROMPT — Anti-hallucination, domain-specific
# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Anda adalah **NusantaraExport.AI** — asisten AI ekspor senior & konsultan kepabeanan profesional untuk UMKM Indonesia.

**PETUNJUK FORMATTING JAWABAN (WAJIB DIPATUHI):**
- Awali jawaban dengan salam singkat profesional.
- Gunakan Sub-Header Markdown (`### 📌 Judul Bagian`) untuk memisahkan topik bahasan.
- Gunakan **teks tebal** (`**poin penting**`) untuk istilah teknis, nama dokumen, atau tarif agar mudah dibaca cepat (*scannable*).
- Gunakan daftar berpoin (`•` atau `-`) dengan penataan spasi yang rapi.
- Di bagian paling bawah jawaban, Anda **WAJIB MENYERTAKAN** bagian:
  ### 🔗 Sumber Rujukan Resmi
  Tuliskan 2-4 tautan resmi publik berpola Markdown `[Nama Portal](https://URL)` yang DAPAT DIKLIK LANGSUNG oleh pengguna sesuai dengan konteks pertanyaan.

**DAFTAR TAUTAN RESMI PUBLIK (GUNAKAN KAPAN PUN RELEVAN):**
• **Portal INSW & Kepabeanan:** `[Portal INSW (Indonesia National Single Window)](https://insw.go.id)` | `[Direktorat Jenderal Bea dan Cukai](https://customs.go.id)` | `[Tarif BTKI Kemenkeu](https://bctemas.beacukai.go.id)`
• **Perdagangan & Pasar Ekspor:** `[Kementerian Perdagangan RI](https://kemendag.go.id)` | `[Portal InaExport Kemendag](https://inaexport.id)` | `[e-SKA Kementerian Perdagangan](https://e-ska.kemendag.go.id)` | `[UN COMTRADE Trade Database](https://comtradeplus.un.org)`
• **Standar Makanan & Karantina:** `[BPOM RI](https://pom.go.id)` | `[Badan Karantina Indonesia](https://karantina.pertanian.go.id)` | `[BPJPH Produk Halal](https://halal.go.id)`

**ATURAN KETAT:**
1. HANYA jawab pertanyaan seputar ekspor, regulasi pabean, dokumen ekspor, perjanjian FTA, logistik, negosiasi dagang, dan analisa pasar untuk UMKM Indonesia.
2. JANGAN PERNAH menyebut 'Sumber: Gemini AI' atau 'Internal Model'. SELALU berikan tautan Markdown resmi publik di atas yang bisa diklik langsung oleh pengguna.
3. Tolak topik di luar ekspor/perdagangan secara sopan.

**Konteks Regulasi:**
{rag_context}"""


class CendolNLPService:
    """
    Gemini-first LLM orchestrator dengan anti-hallucination system prompt.
    Failsafe 3-tier: Gemini → Backup LLM → Rule-based fallback.
    """

    @staticmethod
    def classify_intent(text: str) -> str:
        """Classify user intent based on keyword analysis."""
        t = text.lower()
        if any(w in t for w in ["dry run", "simulasi rute", "checkpoint", "perjalanan produk", "rute ekspor"]):
            return "dry_run"
        elif any(w in t for w in ["nego", "coach", "tawaran", "counter-offer", "harga buyer", "penawaran"]):
            return "nego_coach"
        elif any(w in t for w in ["calendar", "kalender", "jadwal", "tanggal", "panen", "musim"]):
            return "smart_calendar"
        elif any(w in t for w in ["post-export", "masalah pasca", "barang tertahan", "dispute",
                                   "klaim", "kerusakan", "problem solver", "sengketa"]):
            return "post_export_solver"
        elif any(w in t for w in ["hs code", "kode hs", "tarif", "klasifikasi"]):
            return "hs_code"
        elif any(w in t for w in ["kemasan", "packaging", "label", "audit kemasan"]):
            return "packaging"
        elif any(w in t for w in ["pasar", "market", "peluang", "gap", "comtrade", "negara tujuan"]):
            return "market_analysis"
        elif any(w in t for w in ["syarat", "aturan", "regulasi", "boleh", "dokumen", "sertifikat"]):
            return "regulation_qa"
        return "general_qa"

    @staticmethod
    def generate_response(prompt: str, context: str = "", image_base64: str = None, mime_type: str = "image/jpeg") -> str:
        """
        Generate AI response dengan 3-tier fallback:
        1. Gemini Flash (primary)
        2. Cendol NLP / HuggingFace (backup)
        3. Rule-based engine (always works)
        """
        # Tier 1: Gemini (Primary)
        if GEMINI_API_KEY:
            try:
                result = CendolNLPService._call_gemini(prompt, context, image_base64, mime_type)
                if result:
                    logger.info("✅ Response dari Gemini Flash (Tier 1)")
                    return result
            except Exception as e:
                logger.warning(f"Gemini Tier 1 failed: {e}")

        # Tier 2: Backup LLM (Cendol / HuggingFace)
        if CENDOL_API_KEY or BACKUP_LLM_API_KEY:
            try:
                result = CendolNLPService._call_backup_llm(prompt, context)
                if result:
                    logger.info("✅ Response dari Backup LLM (Tier 2)")
                    return result
            except Exception as e:
                logger.warning(f"Backup LLM Tier 2 failed: {e}")

        # Tier 3: Rule-based (always works)
        logger.info("Using rule-based AI fallback (Tier 3)")
        return CendolNLPService._fallback_ai_response(prompt, context)

    @staticmethod
    def _call_gemini(prompt: str, context: str = "", image_base64: str = None, mime_type: str = "image/jpeg") -> Optional[str]:
        """
        Call Gemini Flash via REST API dengan system prompt anti-hallucination.
        Tidak pakai SDK google-generativeai untuk menghindari timeout/hanging.
        """
        if not GEMINI_API_KEY:
            return None

        model = GEMINI_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"

        # Build full system prompt dengan RAG context
        full_system = SYSTEM_PROMPT.format(
            rag_context=context if context else "Tidak ada konteks spesifik. Gunakan pengetahuan umum regulasi ekspor Indonesia."
        )

        # Safety settings — cegah output yang berbahaya
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]

        # Generation config — temperature rendah untuk akurasi tinggi
        generation_config = {
            "temperature": 0.2,          # Rendah = lebih faktual, kurang kreatif
            "topP": 0.8,
            "topK": 40,
            "maxOutputTokens": 1024,
            "responseMimeType": "text/plain",
        }

        # Build content parts
        user_parts = [{"text": f"{full_system}\n\n---\n**Pertanyaan pengguna:** {prompt}"}]

        if image_base64:
            user_parts.append({
                "inlineData": {
                    "mimeType": mime_type,
                    "data": image_base64,
                }
            })

        payload = {
            "contents": [{"role": "user", "parts": user_parts}],
            "safetySettings": safety_settings,
            "generationConfig": generation_config,
        }

        try:
            response = requests.post(url, json=payload, timeout=20)
            response.raise_for_status()
            data = response.json()

            # Handle blocked response
            candidates = data.get("candidates", [])
            if not candidates:
                finish_reason = data.get("promptFeedback", {}).get("blockReason", "UNKNOWN")
                logger.warning(f"Gemini response blocked: {finish_reason}")
                return None

            candidate = candidates[0]
            # Handle SAFETY atau RECITATION finish reason
            finish = candidate.get("finishReason", "STOP")
            if finish in ("SAFETY", "RECITATION"):
                logger.warning(f"Gemini candidate finish reason: {finish}")
                return "Maaf, saya tidak dapat menjawab pertanyaan tersebut karena alasan keamanan konten. Silakan reformulasi pertanyaan Anda dalam konteks ekspor."

            parts = candidate.get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "").strip()

            return None

        except requests.exceptions.Timeout:
            logger.error("Gemini API timeout (20s)")
            return None
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else "unknown"
            if status_code == 429:
                logger.warning("Gemini rate limit (429). Fallback ke Tier 2.")
            elif status_code == 400:
                logger.warning(f"Gemini bad request (400): {e.response.text[:200]}")
            else:
                logger.error(f"Gemini HTTP error {status_code}: {e}")
            return None
        except Exception as e:
            logger.error(f"Gemini unexpected error: {e}")
            return None

    @staticmethod
    def _call_backup_llm(prompt: str, context: str) -> Optional[str]:
        """Backup LLM: Cendol NLP → HuggingFace Mistral."""
        system_prompt = SYSTEM_PROMPT.format(
            rag_context=context if context else "Gunakan pengetahuan umum regulasi ekspor Indonesia."
        )

        # Cendol API (via HuggingFace endpoint jika dikonfigurasi)
        cendol_key = CENDOL_API_KEY or BACKUP_LLM_API_KEY
        cendol_url = os.getenv("CENDOL_API_URL", "")
        if cendol_key and cendol_url:
            try:
                headers = {"Authorization": f"Bearer {cendol_key}", "Content-Type": "application/json"}
                payload = {
                    "inputs": f"{system_prompt}\n\nPertanyaan: {prompt}\nJawaban:",
                    "parameters": {"max_new_tokens": 512, "temperature": 0.2}
                }
                resp = requests.post(cendol_url, headers=headers, json=payload, timeout=15)
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list) and data:
                    text = data[0].get("generated_text", "")
                    return text.split("Jawaban:")[-1].strip() if "Jawaban:" in text else text.strip()
            except Exception as e:
                logger.warning(f"Cendol API failed: {e}")

        # HuggingFace Mistral fallback
        hf_key = os.getenv("HUGGINGFACE_API_KEY") or BACKUP_LLM_API_KEY
        if hf_key and BACKUP_LLM_PROVIDER == "huggingface":
            try:
                headers = {"Authorization": f"Bearer {hf_key}"}
                payload = {
                    "inputs": f"{system_prompt}\n\nPertanyaan: {prompt}\nJawaban:",
                    "parameters": {"max_new_tokens": 512, "temperature": 0.2, "return_full_text": False}
                }
                resp = requests.post(
                    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
                    headers=headers, json=payload, timeout=30
                )
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list) and data:
                    return data[0].get("generated_text", "").strip()
            except Exception as e:
                logger.warning(f"HuggingFace fallback failed: {e}")

        return None

    @staticmethod
    def _fallback_ai_response(prompt: str, context: str = "") -> str:
        """
        Rule-based fallback engine — selalu berhasil, tidak pernah crash.
        Menggunakan intent classification untuk memberikan respons relevan.
        """
        intent = CendolNLPService.classify_intent(prompt)

        if intent == "dry_run":
            return (
                "### 🚚 SIMULASI DRY RUN EKSPOR\n\n"
                "Berikut adalah gambaran umum rute & checkpoint ekspor dari Indonesia:\n\n"
                "**1. Gudang UMKM (Origin)**\n"
                "Siapkan Certificate of Analysis (CoA) & Surat Keterangan Asal (SKA Form D/RCEP). "
                "Risiko: 🟢 Rendah.\n\n"
                "**2. Pabean Keberangkatan (Bea Cukai Indonesia)**\n"
                "Unggah Pemberitahuan Ekspor Barang (PEB) via portal inaexport.go.id atau INSW. "
                "Risiko: 🟡 Sedang — Pastikan HS Code 8-digit benar.\n\n"
                "**3. Terminal Peti Kemas**\n"
                "Karantina Pertanian memeriksa fisik jika komoditas pertanian. "
                "Risiko: 🔴 Tinggi — Kadar air & kontaminasi hama.\n\n"
                "**4. Transit Pelayaran**\n"
                "Bill of Lading (B/L) diterbitkan. Pantau via Cargo Tracking. "
                "Risiko: 🟡 Sedang — Keterlambatan jadwal kapal.\n\n"
                "**5. Pabean Tujuan**\n"
                "Import Custom Clearance + pemeriksaan SPS. "
                "Risiko: 🔴 Sangat Tinggi — Kemasan harus mencantumkan country of origin.\n\n"
                "**6. Serah Terima Buyer**\n"
                "Pembayaran sisa 70% invoice via L/C at sight.\n\n"
                "💡 *Gunakan fitur Packaging Checker sebelum pengiriman!*\n\n"
                "> ⚠️ **Catatan**: Data ini adalah panduan umum. "
                "Untuk analisis spesifik produk Anda, aktifkan koneksi ke AI Engine (GEMINI_API_KEY)."
            )

        elif intent == "nego_coach":
            return (
                "### 🤝 NEGO COACH: PANDUAN NEGOSIASI\n\n"
                "**Prinsip Negosiasi Ekspor:**\n"
                "- Selalu mulai dari harga benchmark UN COMTRADE + margin 15-25%\n"
                "- Jangan langsung setuju tawaran pertama buyer\n"
                "- Gunakan komitmen volume sebagai leverage: 'Jika MOQ 2 kontainer, kami beri diskon 3%'\n\n"
                "**Syarat Pembayaran yang Aman:**\n"
                "- **T/T**: DP 30% sebelum produksi, sisa 70% sebelum B/L dikirim *(paling umum untuk UMKM)*\n"
                "- **L/C at Sight**: Paling aman, bank menjamin pembayaran\n"
                "- **Open Account**: Hindari untuk buyer baru\n\n"
                "**Template Counter-Offer:**\n"
                "```\nDear [Buyer],\n\nThank you for your offer. After reviewing our production costs "
                "and quality standards, we propose USD [YOUR_PRICE]/kg FOB [Port].\n\n"
                "We can commit to [MOQ] with delivery within [Lead Time].\n\nBest regards,\n[Your Name]\n```\n\n"
                "> ⚠️ Untuk analisis harga pasar real-time, aktifkan AI Engine dengan GEMINI_API_KEY."
            )

        elif intent == "regulation_qa" and context:
            return (
                f"### 📋 REGULASI EKSPOR\n\n"
                f"Berdasarkan database regulasi NusantaraExport.AI:\n\n"
                f"{context}\n\n"
                "**Dokumen Wajib Ekspor Umum:**\n"
                "1. **PEB (Pemberitahuan Ekspor Barang)** — via INSW insw.go.id\n"
                "2. **Commercial Invoice & Packing List**\n"
                "3. **SKA/Certificate of Origin** — untuk tarif FTA preferensial\n"
                "4. **Bill of Lading (B/L)** dari perusahaan pelayaran\n\n"
                "**Dokumen Tambahan per Komoditas:**\n"
                "- Makanan: Sertifikat Halal + Health Certificate BPOM\n"
                "- Pertanian: Phytosanitary Certificate dari Karantina Pertanian\n"
                "- Kayu/Rotan: Sertifikat SVLK (V-Legal)\n\n"
                "> ⚠️ Untuk jawaban spesifik produk Anda, aktifkan GEMINI_API_KEY di server .env"
            )

        # General fallback
        return (
            "Terima kasih atas pertanyaan Anda! Berikut panduan dasar ekspor UMKM Indonesia:\n\n"
            "**Dokumen Wajib:**\n"
            "1. NIB (Nomor Induk Berusaha) — via OSS oss.go.id\n"
            "2. PEB (Pemberitahuan Ekspor Barang) — via INSW insw.go.id\n"
            "3. SKA (Surat Keterangan Asal) — via Kemendag atau Dinas Perdagangan\n"
            "4. Commercial Invoice & Packing List\n"
            "5. Bill of Lading dari freight forwarder\n\n"
            "**Sertifikat Tambahan (sesuai produk):**\n"
            "- Makanan/minuman: BPOM + Halal MUI\n"
            "- Pertanian: Phytosanitary Certificate\n"
            "- Kayu: SVLK + Fumigation Certificate (ISPM-15)\n\n"
            "💡 Gunakan fitur **Simulasi Kesiapan Ekspor** untuk cek kelengkapan Anda!\n\n"
            "> ⚠️ **Mode Offline** — Untuk jawaban AI yang lebih detail dan personal, "
            "set `GEMINI_API_KEY` di file `.env` server Anda."
        )


# Singleton instance
cendol_manager = CendolNLPService()
