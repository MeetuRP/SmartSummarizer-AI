from functools import lru_cache

from groq import Groq

from config import get_settings

SUMMARY_PROMPT_TEMPLATE = """Summarize the following document into a structured format with:

* Key Points
* Important Details
* Final Summary

Document:
{text}
"""


@lru_cache
def _get_client() -> Groq:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is missing. Add it to backend/.env.")
    return Groq(api_key=settings.groq_api_key)


def summarize_text(text: str) -> str:
    settings = get_settings()
    client = _get_client()

    response = client.chat.completions.create(
        model=settings.groq_model,
        temperature=0.2,
        messages=[
            {"role": "system", "content": "You are an expert document summarizer."},
            {"role": "user", "content": SUMMARY_PROMPT_TEMPLATE.format(text=text)},
        ],
    )

    content = response.choices[0].message.content if response.choices else ""
    if not content:
        raise RuntimeError("Groq returned an empty summary.")

    return content.strip()


def transcribe_audio_bytes(audio_bytes: bytes, filename: str) -> str:
    settings = get_settings()
    client = _get_client()

    transcription = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model=settings.whisper_model,
        response_format="json",
        temperature=0.0,
    )

    text = getattr(transcription, "text", "") or ""
    if not text.strip():
        raise RuntimeError("No transcription text returned by Whisper API.")

    return text.strip()
