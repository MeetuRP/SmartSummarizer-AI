# SmartSummarizer AI

<div align="center">

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](#tech-stack)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](#tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](#tech-stack)
[![AI Provider](https://img.shields.io/badge/AI-Groq-F55036)](#summarization-flow)
[![Styling](https://img.shields.io/badge/UI-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](#tech-stack)

Multi-format AI document summarization platform for PDF, DOCX, TXT, MP3, WAV, and MP4.

</div>

## Why This Project

SmartSummarizer AI converts long, unstructured content into a structured summary format:

- Key Points
- Important Details
- Final Summary

It supports file ingestion, extraction/transcription, AI summarization, and Mongo-backed history retrieval in one workflow.

## Core Capabilities

| Capability | Description |
|---|---|
| Multi-format upload | Accepts `pdf`, `docx`, `txt`, `mp3`, `wav`, `mp4` |
| Text extraction | `pdfplumber` for PDF, `python-docx` for DOCX, direct read for TXT |
| Speech-to-text | Groq Whisper transcription for audio and extracted video audio |
| Chunked summarization | Large text is chunked, summarized per chunk, then merged |
| Persistent history | Stores summaries in MongoDB with retrieval by id |
| SaaS-style frontend | Modern UI with drag-drop, animated loader, copy/download actions |

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, TailwindCSS, Axios, React Router |
| Backend | FastAPI, Uvicorn, Python |
| Database | MongoDB + Motor (async driver) |
| AI | Groq Chat Completions + Groq Whisper |
| Media | ffmpeg-python (requires system `ffmpeg` binary) |

## System Architecture

```mermaid
flowchart LR
    U[User / Browser] --> F[React Frontend]
    F -->|POST /upload| B[FastAPI Backend]
    B --> E[Extraction Service]
    E -->|PDF| P[pdfplumber]
    E -->|DOCX| D[python-docx]
    E -->|TXT| T[Direct Read]
    E -->|MP3/WAV| W[Groq Whisper]
    E -->|MP4| X[ffmpeg -> WAV -> Whisper]
    B --> S[Summarizer Service]
    S --> G[Groq LLM]
    B --> M[(MongoDB)]
    F -->|GET /history| B
    F -->|GET /summary/{id}| B
```

## Summarization Flow

1. File uploaded through frontend.
2. Backend detects file type.
3. Backend extracts text or transcribes audio.
4. Text is chunked when large.
5. Each chunk is summarized via Groq.
6. Chunk summaries are merged into one structured final summary.
7. Result is stored in MongoDB and returned to UI.

## API Contract

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/upload` | Upload file and generate summary |
| GET | `/history` | Retrieve recent summaries |
| GET | `/summary/{id}` | Retrieve single summary by id |

### Upload Request

```bash
curl -X POST "http://127.0.0.1:8001/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf"
```

## Project Layout

```text
SmartSummarizer AI/
  backend/
    main.py
    config.py
    database.py
    .env.example
    requirements.txt
    routers/
      summary_router.py
    services/
      extraction_service.py
      groq_service.py
      summarizer_service.py
    models/
      summary_model.py
    utils/
      chunking.py
  frontend/
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx
      index.css
      api/
        api.js
      components/
        UploadBox.jsx
        SummaryCard.jsx
        Loader.jsx
      pages/
        Home.jsx
        Upload.jsx
        Result.jsx
        History.jsx
  .gitignore
  README.md
```

## Prerequisites

| Tool | Version Recommendation |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| MongoDB | 6+ |
| ffmpeg | Latest stable |

## Environment Setup

Create `backend/.env` from `backend/.env.example` and add real secrets.

```env
GROQ_API_KEY=
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=smart_summarizer

GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
MAX_CHUNK_CHARS=6000
CHUNK_OVERLAP=500
MAX_HISTORY_ITEMS=50
```

Important:

1. Never commit real API keys.
2. Keep `.env` local only.
3. `.gitignore` is configured to exclude env files.

## Local Run

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`  
Backend: `http://127.0.0.1:8001`

Optional frontend env override (`frontend/.env`):

```env
VITE_API_URL=http://127.0.0.1:8001
```

## MongoDB Notes

1. Local MongoDB example URI: `mongodb://localhost:27017`
2. Atlas example URI: `mongodb+srv://<user>:<password>@<cluster>/`
3. Collection used: `summaries`
4. Stored fields: `file_name`, `file_type`, `extracted_text`, `summary`, `created_at`

## FFmpeg Notes (Required for MP4)

If MP4 uploads fail with FFmpeg errors, install FFmpeg and ensure it is in PATH.

```powershell
winget install --id Gyan.FFmpeg --source winget
ffmpeg -version
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Network Error on upload | Wrong backend URL/port | Ensure frontend points to `8001` |
| `GROQ_API_KEY is missing` | Missing key in backend `.env` | Add key and restart backend |
| `Invalid summary id` | Old history payload id mismatch | Use latest code and refresh history |
| MP4 upload 500 | FFmpeg missing in PATH | Install FFmpeg, restart terminal/backend |

## Git Repository Setup (New Repo)

Run these commands from the project root:

```bash
git init -b main
git add .
git commit -m "feat: initial SmartSummarizer AI release"
```

Create a new empty GitHub repository, then connect and push:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## Security Guidance

1. Never place API keys directly in code.
2. Rotate credentials if accidentally exposed.
3. Use environment-based configs for all environments.
4. Add backend auth/rate-limits before production use.

## Production Hardening Ideas

1. Add background job queue for long media processing.
2. Add upload size limits and MIME validation.
3. Add user authentication and per-user history isolation.
4. Add Redis caching for repeated summary requests.
5. Add observability (structured logs, tracing, metrics).

## License

Use your preferred license before open-sourcing (MIT/Apache-2.0 recommended for most projects).
