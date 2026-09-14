from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database import Base


class Link(Base):
    __tablename__ = "links"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, nullable=False)
    short_code = Column(String, unique=True, nullable=False, index=True)
    clicks = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Firebase user ID
    firebase_uid = Column(String, nullable=True, index=True)