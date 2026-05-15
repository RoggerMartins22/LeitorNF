from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.extraction_service import ExtractionService
from app.services.lancamento_service import LancamentoService

router = APIRouter(prefix="/api", tags=["lancamento"])


@router.post("/lancar")
async def lancar(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Recebe um PDF de nota fiscal, extrai os dados via IA (Etapa 1),
    analisa cada entidade no banco, cria as que não existem e lança
    o movimento financeiro com suas parcelas (Etapa 2).
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    pdf_bytes = await file.read()

    try:
        # Etapa 1 — extração via Gemini
        extraction_service = ExtractionService(db)
        nota = extraction_service.process_pdf(filename=file.filename, pdf_bytes=pdf_bytes)

        # Etapa 2 — análise + lançamento
        lancamento_service = LancamentoService(db)
        resultado = lancamento_service.analisar_e_lancar(nota)

        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar nota fiscal: {str(e)}")
