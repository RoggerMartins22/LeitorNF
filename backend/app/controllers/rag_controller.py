from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import rag_service

router = APIRouter(prefix="/api/rag", tags=["rag"])


class PerguntaRequest(BaseModel):
    pergunta: str
    modo: str  # "simples" | "embeddings"


@router.post("/perguntar")
def perguntar(body: PerguntaRequest, db: Session = Depends(get_db)):
    if not body.pergunta.strip():
        raise HTTPException(status_code=400, detail="A pergunta não pode ser vazia.")
    if body.modo not in ("simples", "embeddings"):
        raise HTTPException(status_code=400, detail="Modo deve ser 'simples' ou 'embeddings'.")
    try:
        if body.modo == "simples":
            return rag_service.rag_simples(db, body.pergunta)
        return rag_service.rag_embeddings(db, body.pergunta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar consulta: {str(e)}")


@router.post("/indexar")
def indexar(db: Session = Depends(get_db)):
    try:
        return rag_service.indexar(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao indexar documentos: {str(e)}")


@router.get("/status")
def status(db: Session = Depends(get_db)):
    try:
        return rag_service.get_status(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar status: {str(e)}")
