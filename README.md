# NusantaraExport.AI

**AI Market Gap Detector** — Sistem deteksi celah pasar ekspor untuk UMKM Indonesia, dengan antarmuka teks dan suara (_voice-first_).

Dibangun untuk Hackathon Pusat Inovasi Digital Indonesia.

## Arsitektur

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Frontend   │────▶│     Backend      │────▶│    AI Services    │
│  React+Vite │     │ FastAPI (Python) │     │  FastAPI (Python) │
└─────────────┘     └────────┬─────────┘     └───────┬───────────┘
                             │                       │
                    ┌────────▼───────────────────────▼──┐
                    │     PostgreSQL + pgvector         │
                    │     (Star Schema + Embeddings)    │
                    └───────────────────────────────────┘
```

## Tech Stack

| Layer       | Teknologi                                                                            |
| ----------- | ------------------------------------------------------------------------------------ |
| Frontend    | React + Vite                                                                         |
| Backend API | FastAPI                                                                              |
| AI Services | Python (FastAPI): Whisper ASR, TTS, HS Code NLP, Market Gap Scorer, Cendol LLM + RAG |
| Scraper     | Playwright (Python)                                                                  |
| Database    | PostgreSQL 16 + pgvector                                                             |

## Quick Start

```bash
# 1. Jalankan database
cd docker && docker compose up -d

# 2. Jalankan backend
cd server && pip install -r requirements.txt && python -m app.main

# 3. Jalankan frontend
cd frontend && npm install && npm run dev

# 4. Jalankan AI services
cd ai-services && pip install -r requirements.txt && uvicorn main:app --reload
```

## Struktur Folder

```
├── server/           # FastAPI API Gateway
├── frontend/         # React + Vite
├── ai-services/      # Python AI modules
├── scraper/          # Playwright pipeline
├── database/         # DDL & seed SQL
└── docker/           # Docker Compose
```

## Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan nilainya.
