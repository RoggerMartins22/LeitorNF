from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ContaCreate(BaseModel):
    nome: str
    tipo: str
    banco: Optional[str] = None
    agencia: Optional[str] = None
    numero: Optional[str] = None
    saldo_inicial: float = 0.0


class ContaUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    numero: Optional[str] = None
    saldo_inicial: Optional[float] = None


class ContaResponse(BaseModel):
    id: int
    nome: str
    tipo: str
    banco: Optional[str] = None
    agencia: Optional[str] = None
    numero: Optional[str] = None
    saldo_inicial: float
    ativo: bool
    criado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
