<div align="center">

# SmartSummarizer AI

### Multi-Format AI Document Summarization Platform

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)](https://groq.com)

**Upload once. Summarize intelligently. Revisit anytime.**

[Getting Started](#getting-started) | [Features](#features) | [Architecture](#architecture) | [Tech Stack](#tech-stack)

</div>

---

## Repository Description

AI-powered full-stack app that ingests PDF, DOCX, TXT, MP3, WAV, and MP4 files, extracts/transcribes content, generates structured summaries using Groq, and stores searchable history in MongoDB.

---

## Features

### Multi-format Input
- Supports `PDF`, `DOCX`, `TXT`, `MP3`, `WAV`, `MP4`
- Drag-and-drop upload with progress states
- History retrieval with one-click summary reopen

### Intelligent Extraction and Transcription
- `TXT`: direct decode
- `PDF`: `pdfplumber`
- `DOCX`: `python-docx`
- `MP3/WAV`: Groq Whisper transcription
- `MP4`: `ffmpeg` audio extraction, then Whisper transcription

### Structured AI Summaries
- Generates:
  - Key Points
  - Important Details
  - Final Summary
- Uses chunking with overlap for long documents
- Merges per-chunk summaries into one final response

### Backend (Python)
- Built with **Python + FastAPI + Uvicorn**
- Async MongoDB operations using Motor
- REST API endpoints for upload, history, and summary detail

---

## Architecture

```text
SmartSummarizer AI/
|-- backend/                        # Python FastAPI backend
|   |-- main.py                     # App entrypoint, CORS, router mount
|   |-- config.py                   # Environment settings
|   |-- database.py                 # MongoDB async connection (Motor)
|   |-- requirements.txt
|   |-- .env.example
|   |-- models/
|   |   `-- summary_model.py
|   |-- routers/
|   |   `-- summary_router.py       # /upload, /history, /summary/{id}
|   |-- services/
|   |   |-- extraction_service.py   # File extraction + transcription
|   |   |-- groq_service.py         # Groq chat + whisper clients
|   |   `-- summarizer_service.py   # Chunking + summarization pipeline
|   `-- utils/
|       `-- chunking.py
|
|-- frontend/                       # React + Vite frontend
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   `-- src/
|       |-- main.jsx
|       |-- App.jsx
|       |-- index.css
|       |-- api/
|       |   `-- api.js
|       |-- components/
|       |   |-- UploadBox.jsx
|       |   |-- SummaryCard.jsx
|       |   `-- Loader.jsx
|       `-- pages/
|           |-- Home.jsx
|           |-- Upload.jsx
|           |-- Result.jsx
|           `-- History.jsx
|
|-- .gitignore
`-- README.md
```

### Data Flow Diagram

```text
+--------------+   Upload File   +------------------+   Store/Query   +--------------+
|   Frontend   | --------------> | FastAPI Backend  | --------------> |   MongoDB    |
| (React/Vite) | <-------------- |   (Python)       | <-------------- |   (Motor)    |
+--------------+  JSON Response  +--------+---------+   History Data  +--------------+
                                       |
                                       v
                            +------------------------+
                            | Extraction Pipeline    |
                            | - TXT direct read      |
                            | - PDF: pdfplumber      |
                            | - DOCX: python-docx    |
                            | - MP3/WAV: Whisper     |
                            | - MP4: ffmpeg+Whisper  |
                            +-----------+------------+
                                        |
                                        v
                            +------------------------+
                            | Groq Summarization     |
                            | - Chunking             |
                            | - Per-chunk summary    |
                            | - Final merged output  |
                            +------------------------+
```

### Summarization Pipeline

```text
[Upload] -> [Type Detection] -> [Extract/Transcribe] -> [Chunk Large Text]
        -> [Groq Summarize Chunks] -> [Combine Summaries] -> [Save in MongoDB]
        -> [Return Structured Summary to UI]
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, Vite, Axios, React Router | SPA and API integration |
| Styling | TailwindCSS | Modern SaaS-like UI |
| Backend | Python, FastAPI, Uvicorn | Async REST API |
| Database | MongoDB, Motor | Summary persistence and history |
| AI Provider | Groq Chat + Groq Whisper | Summarization and transcription |
| Media | ffmpeg-python + system `ffmpeg` | MP4 audio extraction |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload file and generate summary |
| `GET` | `/history` | Get recent summaries |
| `GET` | `/summary/{id}` | Get a summary by id |

Example:

```bash
curl -X POST "http://127.0.0.1:8001/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf"
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| MongoDB | 6+ |
| ffmpeg | Latest stable |

### 1) Backend Setup (Python)

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (copy from `.env.example`) and set real values:

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

Start backend:

```bash
cd backend
uvicorn main:app --reload --port 8001
```

### 2) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Optional `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8001
```

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Network Error on upload | Wrong backend URL/port | Point frontend API to `8001` |
| `GROQ_API_KEY is missing` | Key not set in `backend/.env` | Add key and restart backend |
| `Invalid summary id` | Stale history payload | Refresh page and open latest record |
| MP4 upload 500 | Missing FFmpeg in PATH | Install FFmpeg and restart terminal |

Install FFmpeg on Windows:

```powershell
winget install --id Gyan.FFmpeg --source winget
ffmpeg -version
```

---

## Git Setup

```bash
git init -b main
git add .
git commit -m "feat: initial SmartSummarizer AI release"
git remote add origin https://github.com/MeetuRP/SmartSummarizer-AI.git
git push -u origin main
```

---

## Credits

Made with ❤️ by Tushar Chauhan, Bhoomi Chavda & Meet Parmar
