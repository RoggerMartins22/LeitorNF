from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ExtractionLog(Base):
    __tablename__ = "extraction_logs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    extracted_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
