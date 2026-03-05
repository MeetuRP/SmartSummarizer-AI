from datetime import datetime, timezone

from fastapi import UploadFile

from config import get_settings
from database import get_summary_collection
from services.extraction_service import extract_text_from_file
from services.groq_service import summarize_text
from utils.chunking import chunk_text


def generate_structured_summary(extracted_text: str) -> str:
    settings = get_settings()
    chunks = chunk_text(
        text=extracted_text,
        chunk_size=settings.max_chunk_chars,
        overlap=settings.chunk_overlap,
    )

    if not chunks:
        raise ValueError("No text available for summarization.")

    if len(chunks) == 1:
        return summarize_text(chunks[0])

    chunk_summaries: list[str] = []
    total = len(chunks)
    for index, chunk in enumerate(chunks, start=1):
        chunk_summary = summarize_text(f"Document chunk {index}/{total}:\n\n{chunk}")
        chunk_summaries.append(f"Chunk {index} Summary:\n{chunk_summary}")

    combined_chunk_summaries = "\n\n".join(chunk_summaries)
    final_prompt = (
        "Combine the chunk summaries below into one final structured summary. "
        "Keep all critical details and remove repetition.\n\n"
        f"{combined_chunk_summaries}"
    )
    return summarize_text(final_prompt)


async def process_uploaded_file(file: UploadFile) -> dict:
    file_bytes = await file.read()
    file_name = file.filename or "uploaded_file"

    file_type, extracted_text = extract_text_from_file(
        filename=file_name,
        content_type=file.content_type,
        file_bytes=file_bytes,
    )

    summary = generate_structured_summary(extracted_text)

    document = {
        "file_name": file_name,
        "file_type": file_type,
        "extracted_text": extracted_text,
        "summary": summary,
        "created_at": datetime.now(timezone.utc),
    }

    collection = get_summary_collection()
    result = await collection.insert_one(document)
    document["_id"] = str(result.inserted_id)

    return document
