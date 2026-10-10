import os
from functools import lru_cache
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.local_ai_provider = os.getenv("LOCAL_AI_PROVIDER", "ollama").strip().lower()
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")
        parsed = urlparse(self.ollama_base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("OLLAMA_BASE_URL must be a valid HTTP URL.")
        if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
            raise ValueError("Ollama must use a loopback URL. Remote inference endpoints are not supported.")
        if self.local_ai_provider != "ollama":
            raise ValueError("Only LOCAL_AI_PROVIDER=ollama is supported.")
        self.local_text_model = os.getenv("LOCAL_TEXT_MODEL", "qwen3.5:2b-q4_K_M").strip()
        self.local_vision_model = os.getenv("LOCAL_VISION_MODEL", self.local_text_model).strip()
        self.local_model_timeout = float(os.getenv("LOCAL_MODEL_TIMEOUT", "300"))
        self.local_model_context = int(os.getenv("LOCAL_MODEL_CONTEXT", "8192"))
        self.local_model_max_tokens = int(os.getenv("LOCAL_MODEL_MAX_TOKENS", "256"))
        self.fast_whisper_model = os.getenv("FAST_WHISPER_MODEL", "tiny").strip()
        self.mongodb_uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017").strip()
        self.database_name = os.getenv("DATABASE_NAME", "smart_summarizer").strip()
        self.max_chunk_chars = int(os.getenv("MAX_CHUNK_CHARS", "10000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "500"))
        self.max_history_items = int(os.getenv("MAX_HISTORY_ITEMS", "50"))
        self.max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "50"))
        self.max_document_pages = int(os.getenv("MAX_DOCUMENT_PAGES", "100"))
        self.max_vision_pages = int(os.getenv("MAX_VISION_PAGES", "20"))
        self.max_image_pixels = int(os.getenv("MAX_IMAGE_PIXELS", "25000000"))
        if self.max_chunk_chars < 100 or self.chunk_overlap < 0 or self.chunk_overlap >= self.max_chunk_chars:
            raise ValueError("Require MAX_CHUNK_CHARS >= 100 and 0 <= CHUNK_OVERLAP < MAX_CHUNK_CHARS.")
        if min(self.local_model_timeout, self.local_model_context, self.local_model_max_tokens, self.max_upload_mb, self.max_document_pages, self.max_vision_pages, self.max_image_pixels) <= 0:
            raise ValueError("Timeout, upload, page, and pixel limits must be positive.")


@lru_cache
def get_settings() -> Settings:
    return Settings()
