from io import BytesIO
from pathlib import Path
import shutil
import tempfile

import ffmpeg
import pdfplumber
from docx import Document

from services.groq_service import transcribe_audio_bytes

SUPPORTED_EXTENSIONS = {
    ".txt": "txt",
    ".pdf": "pdf",
    ".docx": "docx",
    ".mp3": "audio",
    ".wav": "audio",
    ".mp4": "video",
}


def _detect_file_type(filename: str, content_type: str | None) -> str:
    extension = Path(filename).suffix.lower()
    if extension in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[extension]

    if content_type:
        lowered = content_type.lower()
        if "text/plain" in lowered:
            return "txt"
        if "pdf" in lowered:
            return "pdf"
        if "word" in lowered or "officedocument" in lowered:
            return "docx"
        if lowered.startswith("audio/"):
            return "audio"
        if lowered.startswith("video/"):
            return "video"

    raise ValueError("Unsupported file type. Use PDF, DOCX, TXT, MP3, WAV, or MP4.")


def _extract_txt(file_bytes: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode TXT file with supported encodings.")


def _extract_pdf(file_bytes: bytes) -> str:
    pages_text: list[str] = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            pages_text.append(page.extract_text() or "")
    return "\n".join(pages_text)


def _extract_docx(file_bytes: bytes) -> str:
    document = Document(BytesIO(file_bytes))
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    return "\n".join(paragraphs)


def _extract_video_audio_bytes(file_bytes: bytes) -> bytes:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError(
            "FFmpeg is not installed or not in PATH. Install FFmpeg to process MP4 files."
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        video_path = Path(temp_dir) / "input.mp4"
        audio_path = Path(temp_dir) / "audio.wav"

        video_path.write_bytes(file_bytes)

        try:
            (
                ffmpeg.input(str(video_path))
                .output(str(audio_path), ac=1, ar="16000", format="wav")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except FileNotFoundError as exc:
            raise RuntimeError(
                "FFmpeg executable was not found. Ensure ffmpeg is installed and available in PATH."
            ) from exc
        except ffmpeg.Error as exc:
            stderr = exc.stderr.decode("utf-8", errors="ignore") if exc.stderr else ""
            raise RuntimeError(f"Failed to extract audio from video: {stderr}") from exc

        if not audio_path.exists():
            raise RuntimeError("Audio track extraction failed for MP4 file.")

        return audio_path.read_bytes()


def _normalize_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines).strip()


def extract_text_from_file(filename: str, content_type: str | None, file_bytes: bytes) -> tuple[str, str]:
    if not filename:
        raise ValueError("File name is missing.")
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    file_type = _detect_file_type(filename, content_type)

    if file_type == "txt":
        extracted = _extract_txt(file_bytes)
    elif file_type == "pdf":
        extracted = _extract_pdf(file_bytes)
    elif file_type == "docx":
        extracted = _extract_docx(file_bytes)
    elif file_type == "audio":
        extracted = transcribe_audio_bytes(file_bytes, filename)
    elif file_type == "video":
        audio_bytes = _extract_video_audio_bytes(file_bytes)
        audio_filename = f"{Path(filename).stem}.wav"
        extracted = transcribe_audio_bytes(audio_bytes, audio_filename)
    else:
        raise ValueError("Unsupported file type.")

    normalized = _normalize_text(extracted)
    if not normalized:
        raise ValueError("No readable text was extracted from the file.")

    return file_type, normalized
