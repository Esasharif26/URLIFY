from pydantic import BaseModel, HttpUrl
from datetime import datetime


class LinkCreate(BaseModel):

    original_url: HttpUrl

    short_code: str


class LinkResponse(BaseModel):

    id: int

    original_url: str

    short_code: str

    clicks: int

    created_at: datetime

    class Config:
        from_attributes = True