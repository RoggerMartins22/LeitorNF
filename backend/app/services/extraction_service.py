from sqlalchemy.orm import Session
from app.services.gemini_service import extract_nota_fiscal
from app.repositories.extraction_repository import ExtractionRepository
from app.schemas.nota_fiscal import NotaFiscalExtraida


class ExtractionService:
    def __init__(self, db: Session):
        self.repository = ExtractionRepository(db)

    def process_pdf(self, filename: str, pdf_bytes: bytes) -> NotaFiscalExtraida:
        raw_data = extract_nota_fiscal(pdf_bytes)
        self.repository.save(filename=filename, extracted_data=raw_data)
        return NotaFiscalExtraida(**raw_data)
