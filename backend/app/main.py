import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.extractor_controller import router as extractor_router
from app.controllers.lancamento_controller import router as lancamento_router
from app.controllers.gestao_controller import router as gestao_router
from app.controllers.rag_controller import router as rag_router
from app.controllers.conta_controller import router as conta_router
from app.controllers.auth_controller import router as auth_router
from app.database import Base, SessionLocal, engine
from app.services.auth_service import seed_usuario_admin
import app.models

Base.metadata.create_all(bind=engine)

# Seed do usuário coordenador inicial (idempotente).
_seed_db = SessionLocal()
try:
    seed_usuario_admin(_seed_db)
finally:
    _seed_db.close()

app = FastAPI(title="Extrator de Notas Fiscais", version="3.0.0")

_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_extra = os.environ.get("FRONTEND_ORIGINS", "").strip()
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(extractor_router)
app.include_router(lancamento_router)
app.include_router(gestao_router)
app.include_router(conta_router)
app.include_router(rag_router)


@app.get("/health")
def health():
    return {"status": "ok"}
