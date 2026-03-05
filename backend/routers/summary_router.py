from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from config import get_settings
from database import get_summary_collection
from models.summary_model import SummaryHistoryItem, SummaryRecord
from services.summarizer_service import process_uploaded_file

router = APIRouter(tags=["summaries"])


def _serialize_mongo_doc(document: dict) -> dict:
    document["_id"] = str(document["_id"])
    return document


@router.post("/upload", response_model=SummaryRecord, status_code=status.HTTP_201_CREATED)
async def upload_and_summarize(file: UploadFile = File(...)):
    try:
        return await process_uploaded_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get("/history", response_model=list[SummaryHistoryItem])
async def get_history():
    settings = get_settings()
    collection = get_summary_collection()

    cursor = (
        collection.find({}, {"extracted_text": 0})
        .sort("created_at", -1)
        .limit(settings.max_history_items)
    )

    records: list[dict] = []
    async for document in cursor:
        records.append(_serialize_mongo_doc(document))

    return records


@router.get("/summary/{summary_id}", response_model=SummaryRecord)
async def get_summary(summary_id: str):
    try:
        object_id = ObjectId(summary_id)
    except InvalidId as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid summary id.") from exc

    collection = get_summary_collection()
    document = await collection.find_one({"_id": object_id})

    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

    return _serialize_mongo_doc(document)
