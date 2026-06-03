import requests
import os
from dotenv import load_dotenv

load_dotenv()
gemini_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
payload = {"contents": [{"parts": [{"text": "Test"}]}]}
try:
    print("Testing Gemini REST API with 2.0-flash...")
    res = requests.post(url, json=payload, timeout=10)
    print(res.status_code, res.text[:200])
except Exception as e:
    print("Error:", e)
