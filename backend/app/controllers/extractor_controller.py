from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.extraction_service import ExtractionService
from app.schemas.nota_fiscal import NotaFiscalExtraida

router = APIRouter(prefix="/api", tags=["extractor"])


@router.post("/extract", response_model=NotaFiscalExtraida)
async def extract(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    pdf_bytes = await file.read()

    try:
        service = ExtractionService(db)
        result = service.process_pdf(filename=file.filename, pdf_bytes=pdf_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar com Gemini: {str(e)}")
