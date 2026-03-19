import requests
import os
from dotenv import load_dotenv

load_dotenv()

CENDOL_API_URL = os.getenv("CENDOL_API_URL", "https://api.indonlp.org/v1/cendol")
CENDOL_API_KEY = os.getenv("CENDOL_API_KEY")

class CendolNLPManager:
    """
    Manager for Cendol NLP (IndoNLP) API.
    Handles intent classification and text generation for RAG.
    """
    def __init__(self):
        self.api_key = CENDOL_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def classify_intent(self, text: str):
        """Classify user intent (e.g., 'REGULATION_QUERY', 'MARKET_DATA_QUERY')"""
        payload = {"text": text, "task": "intent_classification"}
        try:
            # Placeholder for actual Cendol API endpoint logic
            # response = requests.post(f"{CENDOL_API_URL}/classify", json=payload, headers=self.headers)
            # return response.json().get("intent")
            
            # Simple simulation for MVP
            if any(key in text.lower() for key in ["syarat", "aturan", "regulasi", "boleh"]):
                return "REGULATION"
            return "MARKET_GAP"
        except Exception as e:
            return "UNKNOWN"

    def generate_response(self, prompt: str):
        """Invoke Cendol LLM for text generation"""
        payload = {
            "prompt": prompt,
            "max_tokens": 512,
            "temperature": 0.3
        }
        try:
            # Actual API call to Cendol NLP
            response = requests.post(f"{CENDOL_API_URL}/generate", json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json().get("text", "Maaf, saya gagal memproses jawaban.")
        except Exception as e:
            return f"Error Cendol API: {str(e)}"

# Singleton instance
cendol_manager = CendolNLPManager()
