from pydantic import BaseModel
from typing import Optional


class StatusEntidade(BaseModel):
    nome: str
    documento: Optional[str] = None  # CNPJ ou CPF
    existe: bool
    id: Optional[int] = None


class AnaliseResponse(BaseModel):
    fornecedor: StatusEntidade
    faturado: StatusEntidade
    despesa: StatusEntidade


class LancamentoResponse(BaseModel):
    sucesso: bool
    mensagem: str
    movimento_id: int
