import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import rag_service
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/rag",
    tags=["rag"],
    dependencies=[Depends(get_current_user)],
)


class PerguntaRequest(BaseModel):
    pergunta: str
    modo: str  # "simples" | "embeddings" | "analitico"


@router.post("/perguntar")
def perguntar(body: PerguntaRequest, db: Session = Depends(get_db)):
    if not body.pergunta.strip():
        raise HTTPException(status_code=400, detail="A pergunta não pode ser vazia.")
    if body.modo not in ("simples", "embeddings", "analitico"):
        raise HTTPException(
            status_code=400,
            detail="Modo deve ser 'simples', 'embeddings' ou 'analitico'.",
        )
    try:
        if body.modo == "simples":
            return rag_service.rag_simples(db, body.pergunta)
        if body.modo == "analitico":
            return rag_service.rag_analitico(db, body.pergunta)
        return rag_service.rag_embeddings(db, body.pergunta)
    except Exception:
        logger.exception("Erro ao processar consulta RAG")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a consulta. Tente novamente.")


@router.post("/indexar")
def indexar(db: Session = Depends(get_db)):
    try:
        return rag_service.indexar(db)
    except Exception:
        logger.exception("Erro ao indexar documentos RAG")
        raise HTTPException(status_code=500, detail="Erro interno ao indexar documentos. Tente novamente.")


@router.get("/status")
def status(db: Session = Depends(get_db)):
    try:
        return rag_service.get_status(db)
    except Exception:
        logger.exception("Erro ao consultar status RAG")
        raise HTTPException(status_code=500, detail="Erro interno ao consultar status. Tente novamente.")
