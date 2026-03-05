from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SummaryRecord(BaseModel):
    id: str = Field(alias="_id")
    file_name: str
    file_type: str
    extracted_text: str
    summary: str
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class SummaryHistoryItem(BaseModel):
    id: str = Field(alias="_id")
    file_name: str
    file_type: str
    summary: str
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)
