from datetime import datetime, timezone
import asyncio
import logging
import re
from time import perf_counter

from fastapi import UploadFile

from config import get_settings
from database import get_summary_collection
from services.extraction_service import extract_text_from_file
from services.local_ai_service import generate
from utils.chunking import chunk_text

logger = logging.getLogger("uvicorn.error")


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
        logger.info("Summarization started: 1 section, %s extracted characters.", len(extracted_text))
        return _grounded_generation(chunks[0])

    chunk_summaries: list[str] = []
    total = len(chunks)
    logger.info("Summarization started: %d sections, %s extracted characters.", total, len(extracted_text))
    for index, chunk in enumerate(chunks, start=1):
        chunk_started = perf_counter()
        logger.info("Summarization section %d/%d started.", index, total)
        chunk_summary = _grounded_generation(chunk)
        logger.info("Summarization section %d/%d finished in %.1f seconds.", index, total, perf_counter() - chunk_started)
        chunk_summaries.append(f"Chunk {index} Summary:\n{chunk_summary}")

    combined_chunk_summaries = "\n\n".join(chunk_summaries)
    final_prompt = (
        "Combine the chunk summaries below into one final structured summary. "
        "Keep all critical details and remove repetition.\n\n"
        f"{combined_chunk_summaries}"
    )
    logger.info("Final summary merge started.")
    merge_started = perf_counter()
    result = _grounded_generation(extracted_text, final_prompt)
    logger.info("Final summary merge finished in %.1f seconds.", perf_counter() - merge_started)
    return result


def _grounded_generation(source: str, prompt: str | None = None) -> str:
    generated = generate(_summary_prompt(prompt or source))
    if _has_unsupported_claim_markers(source, generated):
        excerpt = _source_excerpt(source)
        return (
            "Key Points\n"
            "- The generated summary included details that could not be checked against the source.\n\n"
            "Important Details\n"
            "- Use the verbatim source excerpt below; unsupported claims were omitted.\n\n"
            "Final Summary\n"
            f"{excerpt}"
        )
    return generated


def _has_unsupported_claim_markers(source: str, summary: str) -> bool:
    source_folded = source.casefold()
    summary_body = "\n".join(
        line for line in summary.splitlines()
        if line.strip().strip("#*_:- ").casefold() not in {"key points", "important details", "final summary"}
    )
    summary_folded = summary_body.casefold()

    # Reject generated names unless the same name is present in the source.
    proper_name = re.compile(
        r"\b(?:[A-Z][a-z]+|[A-Z]\.)(?:\s+(?:[A-Z][a-z]+|[A-Z]\.)){1,3}\b"
    )
    non_name_starters = {
        "a", "an", "and", "as", "at", "but", "each", "from", "he", "here", "how", "i", "in", "it",
        "many", "no", "one", "our", "she", "some", "starts", "starting", "that", "the", "their",
        "this", "those", "to", "two", "we", "what", "when", "where", "which", "who", "you",
    }
    for match in proper_name.finditer(summary_body):
        if match.group(0).split()[0].casefold() in non_name_starters:
            continue
        if match.group(0).casefold() not in source_folded:
            return True

    # Dates, numeric claims, and quoted text must be directly traceable to the source.
    numeric_pattern = re.compile(r"(?<!\w)\d[\d,]*(?:\.\d+)?%?(?!\w)")
    source_numbers = {value.replace(",", "") for value in numeric_pattern.findall(source)}
    if any(value.replace(",", "") not in source_numbers for value in numeric_pattern.findall(summary_body)):
        return True

    number_words = {
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
        "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
        "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
        "hundred", "thousand", "million", "billion", "first", "second", "third", "fourth", "fifth",
        "sixth", "seventh", "eighth", "ninth", "tenth",
    }
    source_words = set(re.findall(r"[a-z]+", source_folded))
    if (set(re.findall(r"[a-z]+", summary_folded)) & number_words) - source_words:
        return True

    context_markers = {
        "wartime", "inaugural", "historical", "history", "president", "presidential", "speaker",
        "author", "origin", "origins", "attributed", "quotation", "quote", "january", "february",
        "march", "april", "may", "june", "july", "august", "september", "october", "november",
        "december", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    }
    if (set(re.findall(r"[a-z]+", summary_folded)) & context_markers) - source_words:
        return True

    for quoted in re.findall(r'["\u201c](.+?)["\u201d]', summary_body):
        normalized_quote = re.sub(r"\s+", " ", quoted).strip().casefold()
        normalized_source = re.sub(r"\s+", " ", source).strip().casefold()
        if normalized_quote and normalized_quote not in normalized_source:
            return True
    return False


def _source_excerpt(source: str, max_chars: int = 1200) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", source.strip())
    excerpt = " ".join(sentences[:3])
    if len(excerpt) > max_chars:
        excerpt = excerpt[:max_chars].rsplit(" ", 1)[0].rstrip() + "..."
    elif len(sentences) > 3:
        excerpt += " ..."
    return excerpt


def _summary_prompt(text: str) -> str:
    return ("Summarize only facts stated in the source. Every name, date, number, quotation, and historical or contextual claim "
            "must be explicitly supported by the source. Never guess a speaker, identity, quotation origin, event, date, or context from memory. "
            "Preserve source names, dates, quantities, units, qualifications, and exceptions. If information is absent, say it is not stated. "
            "Do not add interpretations that change factual meaning. Keep the summary concise: at most 6 key-point bullets and about 120 words total. "
            "Return exactly these sections: Key Points, Important Details, Final Summary.\n\n"
            f"SOURCE:\n{text}")


async def process_uploaded_file(file: UploadFile) -> dict:
    request_started = perf_counter()
    max_bytes = get_settings().max_upload_mb * 1024 * 1024
    parts: list[bytes] = []
    total = 0
    logger.info("Upload received; reading file data.")
    while True:
        part = await file.read(min(1024 * 1024, max_bytes + 1 - total))
        if not part:
            break
        parts.append(part)
        total += len(part)
        if total > max_bytes:
            raise ValueError(f"File exceeds the {get_settings().max_upload_mb} MB upload limit.")
    file_bytes = b"".join(parts)
    file_name = file.filename or "uploaded_file"
    logger.info("Upload received: %.2f MB. Extracting content.", len(file_bytes) / (1024 * 1024))

    extraction_started = perf_counter()
    extracted = await asyncio.to_thread(
        extract_text_from_file,
        filename=file_name,
        content_type=file.content_type,
        file_bytes=file_bytes,
    )
    logger.info("Content extraction finished in %.1f seconds.", perf_counter() - extraction_started)

    file_type, extracted_text, image_bytes = extracted
    logger.info("Local summarization started for %s content (%s extracted characters).", file_type, len(extracted_text))
    summarization_started = perf_counter()
    if image_bytes:
        summary = await asyncio.to_thread(generate, "Analyze this image as evidence. Identify whether it is a photo, document, chart, table, diagram, slide, screenshot, or form. Separate directly observed content, visible text and values, cautious interpretations, and unreadable/uncertain information. Preserve labels and units; never invent unreadable numbers. Return Key Points, Visual Findings, Extracted Data (when applicable), and Final Summary.", image_bytes=image_bytes)
    else:
        summary = await asyncio.to_thread(generate_structured_summary, extracted_text)
    logger.info("Local summarization finished in %.1f seconds. Saving result to history.", perf_counter() - summarization_started)

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
    logger.info("Upload processing completed in %.1f seconds.", perf_counter() - request_started)

    return document
