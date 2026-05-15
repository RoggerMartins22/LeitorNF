from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.extractor_controller import router as extractor_router
from app.controllers.lancamento_controller import router as lancamento_router
from app.controllers.gestao_controller import router as gestao_router
from app.database import Base, engine
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Extrator de Notas Fiscais", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extractor_router)
app.include_router(lancamento_router)
app.include_router(gestao_router)


@app.get("/health")
def health():
    return {"status": "ok"}
