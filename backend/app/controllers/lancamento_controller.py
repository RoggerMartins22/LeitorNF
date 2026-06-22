import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.services.auth_service import get_current_user
from app.services.extraction_service import ExtractionService
from app.services.lancamento_service import LancamentoService

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/api", tags=["lancamento"])


@router.post("/lancar")
async def lancar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _current_user: Usuario = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    pdf_bytes = await file.read()

    if len(pdf_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Limite: 10 MB.")

    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um PDF válido.")

    try:
        extraction_service = ExtractionService(db)
        nota = extraction_service.process_pdf(filename=file.filename, pdf_bytes=pdf_bytes)

        lancamento_service = LancamentoService(db)
        resultado = lancamento_service.analisar_e_lancar(nota)

        return resultado
    except Exception:
        logger.exception("Erro ao processar nota fiscal")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o arquivo. Tente novamente.")
