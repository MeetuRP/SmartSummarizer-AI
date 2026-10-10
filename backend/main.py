from contextlib import asynccontextmanager
import asyncio
import tempfile
from pathlib import Path

_project_temp = Path(__file__).resolve().parents[1] / ".cache" / "tmp"
_project_temp.mkdir(parents=True, exist_ok=True)
tempfile.tempdir = str(_project_temp)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import close_mongo_connection, connect_to_mongo
from routers.summary_router import router as summary_router
from services.local_ai_service import list_models
from config import get_settings
from fastapi import HTTPException


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="SmartSummarizer AI API",
    description="Local-first document, image, and media summarization API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summary_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"message": "SmartSummarizer AI backend is running."}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ai", tags=["health"])
async def local_ai_health() -> dict:
    settings = get_settings()
    try:
        models = await asyncio.to_thread(list_models)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "provider": "ollama",
        "status": "ready" if settings.local_text_model in models and settings.local_vision_model in models else "model_missing",
        "text_model": settings.local_text_model,
        "vision_model": settings.local_vision_model,
        "text_model_available": settings.local_text_model in models,
        "vision_model_available": settings.local_vision_model in models,
        "available_models": models,
    }
