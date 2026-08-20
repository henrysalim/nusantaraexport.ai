"""
Entry point untuk Vercel Serverless Functions.
Vercel mendeteksi objek `app` di sini secara otomatis.
"""
import sys
import os

# Tambahkan parent directory ke path agar import app.* bisa jalan
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401
