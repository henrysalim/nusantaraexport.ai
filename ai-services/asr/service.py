"""
ASR Service — Whisper-based Speech Recognition
===============================================
Modul ini akan menangani:
- Load model Whisper (fine-tuned untuk dialek Nusantara)
- Transkripsikan audio (WAV/MP3) → teks standar Indonesia
- Deteksi bahasa daerah secara otomatis
"""


class ASRService:
    """Automatic Speech Recognition menggunakan Whisper."""

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self.model = None

    def load_model(self):
        """Load Whisper model. Akan diimplementasikan di Step 4."""
        # import whisper
        # self.model = whisper.load_model(self.model_size)
        pass

    def transcribe(self, audio_path: str) -> dict:
        """
        Transkripsi file audio ke teks.

        Args:
            audio_path: Path ke file audio (WAV/MP3)

        Returns:
            dict dengan keys: text, language, segments
        """
        # Placeholder — implementasi di Step 4
        return {
            "text": "",
            "language": "id",
            "segments": [],
        }
