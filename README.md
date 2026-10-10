# SmartSummarizer AI

Local-first document intelligence for summarizing text, PDFs, Word documents, images, audio, and video. Text and image inference use Ollama on the same computer; speech transcription uses faster-whisper locally. MongoDB stores summaries and history.

## Supported inputs

- PDF, DOCX, and TXT
- PNG, JPG/JPEG, WEBP, BMP, and TIFF
- MP3, WAV, and MP4 (video audio extraction uses PyAV)

Text PDFs use `pdfplumber`. Scanned pages and pages with embedded figures are rendered with PyMuPDF and analyzed with the configured vision model, subject to `MAX_DOCUMENT_PAGES` and `MAX_VISION_PAGES`. DOCX extraction includes paragraphs and tables. Image uploads are validated and normalized before local vision analysis. Audio and video are transcribed with faster-whisper on CPU.

## Local AI and privacy

The backend calls only Ollama's local HTTP API at `http://127.0.0.1:11434` by default. Configuration rejects non-loopback Ollama endpoints. The project launcher sets `OLLAMA_NO_CLOUD=1`, disabling Ollama Cloud features. There is no hosted AI fallback or provider API key. Ollama must be running, and the configured model must be present. Speech model weights are fetched once by faster-whisper when first used; inference itself runs locally.

Ollama's catalog lists `qwen3.5:2b-q4_K_M` at about 1.9 GB with text and image input. It is the initial local inference candidate; actual memory use and responsiveness still need to be measured on this machine. See the [Ollama model catalog](https://ollama.com/library/qwen3.5/tags).

Model weights and project-specific downloads belong on D:. Ollama's Windows runtime supports a configurable `OLLAMA_MODELS` path; its own process must be restarted with that variable set before pulling models. The [Ollama FAQ](https://github.com/ollama/ollama/blob/main/docs/faq.mdx) documents model directory configuration. First-time setup requires internet to install packages and download model weights. After setup, AI inference does not need an internet connection.

## Windows setup (D: workspace)

The project was inspected at `D:\SmartSummarizer AI`. Run commands below from the repository root.

1. Keep the portable Ollama runtime under `.tools\ollama` on D:. Start it with the launcher so its model storage and temporary files stay on D:. The launcher refuses to start if another process already owns port 11434.

   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\scripts\Start-Local.ps1 -Mode Ollama
   ```

2. Install project dependencies using D:-local caches. Use a D:-installed Python if available. The environment used for this implementation is `.venv` on D: based on the existing Python installation on C:; installed project packages and caches are on D:, but the base interpreter remains on C:.

   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\scripts\Start-Local.ps1 -Mode Install
   ```

3. Copy `backend/.env.example` to `backend/.env` and adjust the local models/limits if needed. No AI API key is required.
4. In a second PowerShell terminal, download the model only after confirming disk space and that the server started with `OLLAMA_MODELS` pointing to D::

   ```powershell
   .\.tools\ollama\ollama.exe pull qwen3.5:2b-q4_K_M
   ```

5. Start local MongoDB, then start the backend and frontend in separate terminals:

   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\scripts\Start-Local.ps1 -Mode Backend
   ```

   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\scripts\Start-Local.ps1 -Mode Frontend
   ```

The default MongoDB URI is local at `mongodb://127.0.0.1:27017`; the database remains `smart_summarizer` and the collection remains `summaries`.

## Configuration

`backend/.env.example` documents all settings. The main options are `LOCAL_AI_PROVIDER`, `OLLAMA_BASE_URL`, `LOCAL_TEXT_MODEL`, `LOCAL_VISION_MODEL`, `LOCAL_MODEL_TIMEOUT`, `LOCAL_MODEL_CONTEXT`, `FAST_WHISPER_MODEL`, `MONGODB_URI`, `DATABASE_NAME`, `MAX_CHUNK_CHARS`, `CHUNK_OVERLAP`, `MAX_UPLOAD_MB`, `MAX_DOCUMENT_PAGES`, `MAX_VISION_PAGES`, and `MAX_IMAGE_PIXELS`. Only the `ollama` provider and loopback URLs are accepted; the frontend also rejects non-loopback `VITE_API_URL` values. The default Whisper model is `tiny` to keep first-run storage low; the default context is 8,192 tokens to limit memory use, and long files are processed in chunks.

## API

- `POST /upload` — extract/transcribe, summarize, store, and return a record.
- `GET /history` — recent records without full extracted text.
- `GET /summary/{id}` — retrieve a saved record.
- `GET /health` — backend status.
- `GET /health/ai` — model names, availability, and Ollama connection status.

The summary record fields `id`, `file_name`, `file_type`, `extracted_text`, `summary`, and `created_at` remain compatible with existing history documents.

## Tests and genuine inference check

Run deterministic backend tests (mocked inference; no model download required):

```powershell
cd backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Run the production frontend build:

```powershell
cd frontend
npm run build
```

The frontend uses Vite 6, React Router 7, and Tailwind CSS 4. Use Node.js 20 or 22+; Tailwind CSS 4 targets Chrome 111+, Safari 16.4+, and Firefox 128+.

Check configured Ollama models and run real text inference; optionally include an image:

```powershell
..\.venv\Scripts\python.exe backend\verify_local_model.py
..\.venv\Scripts\python.exe backend\verify_local_model.py --image path\to\image.png
```

Run the synthetic, real-inference evaluation cases (text, long text, PDF, DOCX/table, image text, chart, and scene). The report is written to the ignored D:-drive `artifacts/evaluation/latest.json` and requires manual fact review:

```powershell
..\.venv\Scripts\python.exe backend\evaluate_local_model.py
```

For Ollama troubleshooting, confirm `ollama list`, `http://127.0.0.1:11434`, the model tag, and the process's actual D:-drive model directory. Faster-whisper downloads the configured speech model into `.models`; PyAV extracts and resamples MP4 audio locally. A small quantized model may be slower or less capable on CPU than a larger model on suitable hardware.

Focused real-inference checks on 2026-10-10 passed for a text summary, a synthetic image, a spoken-audio fixture, and an MP4 audio track. They are smoke checks, not a broad quality evaluation. Qwen produced an unsupported speaker and historical attribution for a short quotation; a deterministic marker check now rejects that output and falls back to source text. The check is heuristic and cannot detect every unsupported claim. The video path transcribes its audio track and does not analyze visual frames. Headless Chrome interaction checks were completed using software rendering.

## Evaluation and training status

No training corpus was downloaded or used. BillSum has unresolved rights for the redistributed records. XSum's dataset card lists CC BY-SA 4.0, but it contains BBC news text, likely PII, has no consent policy, and targets one-sentence news abstracts rather than this app's document, image, and transcript workloads. No candidate was approved for training. See [training/README.md](training/README.md). Backend unit tests use synthetic inputs and mocks; separate smoke checks used real local inference. Neither is a broad quality evaluation.

No fine-tuning was performed. Ollama is used for pretrained local inference, not training. A future training experiment needs appropriately licensed/consented examples, non-leaking train/validation/test splits, a separate training stack, and hardware assessment.

## Known limitations

- Ollama and MongoDB are external local prerequisites. PyAV handles MP4 audio extraction without a separate FFmpeg installation.
- Summaries can contain unsupported claims. A heuristic rejects some unsupported names, numbers, dates, quotes, and context markers, but it is not semantic fact verification. Verify claims against the uploaded source.
- Video uploads are summarized from their audio track; visual frames are not analyzed.
- Browser checks used installed headless Chrome with SwiftShader and mocked API responses. Upload preview, result display, copy/download, history, error display, navigation, and 390/768/1440 px layouts were checked; this does not verify every backend/browser combination.
- At this review, `npm audit` and `npm audit --omit=dev` report zero known vulnerabilities. Recheck before release because advisories change over time.
- Real local text/image/audio/video inference and MongoDB persistence passed focused smoke checks; they do not establish bug-free operation.
- Image/chart interpretation depends on the selected vision model; check its numerical claims against the source.
- Scanned PDF visual analysis requires PyMuPDF and a configured vision model and is capped by the page limit.
- Windows itself, VS Code/Codex, and the preinstalled base Python may write system-managed files to C:. Project dependencies, npm packages, caches, generated files, and temporary processing data are configured for D:.

## Project structure

```text
backend/       FastAPI API, extraction, local model adapters, and tests
frontend/      React/Vite application
scripts/       D:-scoped cache and environment setup
training/      Dataset discovery and training decision record
```

## Credits

Made with ❤️ by Meet Parmar
