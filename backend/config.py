import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017").strip()
        self.database_name = os.getenv("DATABASE_NAME", "smart_summarizer").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        self.whisper_model = os.getenv("WHISPER_MODEL", "whisper-large-v3").strip()
        self.max_chunk_chars = int(os.getenv("MAX_CHUNK_CHARS", "6000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "500"))
        self.max_history_items = int(os.getenv("MAX_HISTORY_ITEMS", "50"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
