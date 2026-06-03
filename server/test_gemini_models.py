import requests
import os
from dotenv import load_dotenv

load_dotenv()
gemini_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
try:
    res = requests.get(url, timeout=10)
    data = res.json()
    if "models" in data:
        for m in data["models"]:
            if "gemini" in m["name"]:
                print(m["name"])
    else:
        print("Error:", data)
except Exception as e:
    print("Exception:", e)
