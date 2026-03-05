def chunk_text(text: str, chunk_size: int, overlap: int = 0) -> list[str]:
    normalized = text.strip()
    if not normalized:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")

    safe_overlap = max(0, min(overlap, chunk_size - 1))
    chunks: list[str] = []
    start = 0

    while start < len(normalized):
        end = min(start + chunk_size, len(normalized))
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(normalized):
            break

        start = end - safe_overlap

    return chunks
