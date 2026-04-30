from pydantic import BaseModel
from typing import List, Optional


class Fornecedor(BaseModel):
    razao_social: Optional[str] = None
    fantasia: Optional[str] = None
    cnpj: Optional[str] = None


class Faturado(BaseModel):
    nome_completo: Optional[str] = None
    cpf: Optional[str] = None


class Parcela(BaseModel):
    numero_parcela: int
    data_vencimento: Optional[str] = None
    valor: Optional[float] = None


class ClassificacaoDespesa(BaseModel):
    categoria: Optional[str] = None
    descricao: Optional[str] = None


class NotaFiscalExtraida(BaseModel):
    fornecedor: Optional[Fornecedor] = None
    faturado: Optional[Faturado] = None
    numero_nota_fiscal: Optional[str] = None
    data_emissao: Optional[str] = None
    descricao_produtos: Optional[str] = None
    valor_total: Optional[float] = None
    parcelas: Optional[List[Parcela]] = []
    classificacoes_despesa: Optional[List[ClassificacaoDespesa]] = []
