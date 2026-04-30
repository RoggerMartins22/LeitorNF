import json
from sqlalchemy.orm import Session
from app.models.extraction import ExtractionLog


class ExtractionRepository:
    def __init__(self, db: Session):
        self.db = db

    def save(self, filename: str, extracted_data: dict) -> ExtractionLog:
        log = ExtractionLog(
            filename=filename,
            extracted_json=json.dumps(extracted_data, ensure_ascii=False),
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def find_all(self) -> list[ExtractionLog]:
        return self.db.query(ExtractionLog).order_by(ExtractionLog.created_at.desc()).all()

    def find_by_id(self, extraction_id: int) -> ExtractionLog | None:
        return self.db.query(ExtractionLog).filter(ExtractionLog.id == extraction_id).first()
