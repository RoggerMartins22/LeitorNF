import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.controllers.extractor_controller import router as extractor_router
from app.controllers.lancamento_controller import router as lancamento_router
from app.controllers.gestao_controller import router as gestao_router
from app.controllers.rag_controller import router as rag_router
from app.controllers.conta_controller import router as conta_router
from app.controllers.auth_controller import router as auth_router
from app.database import Base, engine
from app.rate_limit import limiter
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Extrator de Notas Fiscais", version="3.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_extra = os.environ.get("FRONTEND_ORIGINS", "").strip()
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


app.add_middleware(SecurityHeadersMiddleware)
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
