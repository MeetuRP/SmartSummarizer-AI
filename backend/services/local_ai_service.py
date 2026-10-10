"""Loopback-only Ollama and on-device Whisper adapters."""
import base64
import json
from pathlib import Path
import urllib.error
import urllib.request
from functools import lru_cache

from config import get_settings


class LocalAIUnavailableError(RuntimeError):
    """Raised when the local Ollama service cannot process a request."""


def _ollama_request(path: str, payload: dict | None = None, timeout: float = 10) -> dict:
    settings = get_settings()
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{settings.ollama_base_url}{path}", data=body,
        headers={"Content-Type": "application/json"}, method="POST" if body else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        if exc.code == 404:
            raise LocalAIUnavailableError(f"Ollama model or endpoint was not found: {detail}. Pull the configured model first.") from exc
        raise RuntimeError(f"Ollama returned HTTP {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise LocalAIUnavailableError(f"Cannot reach local Ollama at {settings.ollama_base_url}. Start Ollama and try again.") from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise RuntimeError("Ollama returned an invalid response.") from exc
    if not isinstance(result, dict):
        raise RuntimeError("Ollama returned an invalid response.")
    return result


def list_models() -> list[str]:
    response = _ollama_request("/api/tags")
    return [item["name"] for item in response.get("models", []) if isinstance(item, dict) and item.get("name")]


def generate(prompt: str, *, image_bytes: bytes | None = None, model: str | None = None) -> str:
    settings = get_settings()
    message = {"role": "user", "content": prompt}
    if image_bytes:
        message["images"] = [base64.b64encode(image_bytes).decode("ascii")]
    payload = {
        "model": model or (settings.local_vision_model if image_bytes else settings.local_text_model),
        "messages": [
            {
                "role": "system",
                "content": (
                    "Every name, date, number, quotation, and historical or contextual claim must be directly supported by the provided source or image. "
                    "Do not identify a person, speaker, quotation origin, event, date, or context from memory. "
                    "When information is absent, say it is not stated. Preserve uncertainty."
                ),
            },
            message,
        ],
        "stream": False,
        "think": False,
        "options": {"temperature": 0.0, "num_ctx": settings.local_model_context,
                    "num_predict": settings.local_model_max_tokens},
    }
    result = _ollama_request("/api/chat", payload, timeout=settings.local_model_timeout)
    content = result.get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("The local model returned an empty response.")
    return content.strip()


def transcribe_audio_bytes(audio_bytes: bytes, filename: str) -> str:
    """Transcribe with faster-whisper; model weights are cached in the project."""
    import os
    import tempfile

    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError("Local transcription requires faster-whisper. Install backend requirements in the project virtual environment.") from exc

    root = Path(__file__).resolve().parents[2]
    model_root = root / ".models" / "faster-whisper"
    model_root.mkdir(parents=True, exist_ok=True)
    temp_root = root / ".cache" / "tmp"
    temp_root.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=Path(filename).suffix or ".wav", dir=temp_root, delete=False) as audio_file:
        audio_file.write(audio_bytes)
        audio_path = audio_file.name
    try:
        model = _get_whisper_model(WhisperModel, model_root)
        segments, _ = model.transcribe(audio_path, beam_size=5)
        transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
    except Exception as exc:
        raise RuntimeError(f"Local audio transcription failed: {exc}") from exc
    finally:
        try:
            os.unlink(audio_path)
        except OSError:
            pass
    if not transcript:
        raise RuntimeError("No speech was detected in the audio.")
    return transcript


@lru_cache(maxsize=2)
def _get_whisper_model(model_class, model_root: Path):
    name = get_settings().fast_whisper_model
    return model_class(name, device="cpu", compute_type="int8", download_root=str(model_root))
