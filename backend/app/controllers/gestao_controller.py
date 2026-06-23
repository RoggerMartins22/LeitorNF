from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.gestao_repository import GestaoRepository
from app.repositories.pessoas_repository import PessoasRepository
from app.repositories.classificacao_repository import ClassificacaoRepository
from app.services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/gestao",
    tags=["gestao"],
    dependencies=[Depends(get_current_user)],
)


# ── Schemas ─────────────────────────────────────────────────────────────

class PessoaCreate(BaseModel):
    tipo: str
    razao_social: str
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    cpf: Optional[str] = None

class PessoaUpdate(BaseModel):
    razao_social: str
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    cpf: Optional[str] = None

class ClassificacaoCreate(BaseModel):
    tipo: str   # DESPESA | RECEITA
    descricao: str

class ClassificacaoUpdate(BaseModel):
    tipo: str
    descricao: str

class ParcelaInput(BaseModel):
    valor: Optional[float] = None
    data_vencimento: Optional[str] = None

class MovimentoCreate(BaseModel):
    tipo: str   # APAGAR | ARECEBER
    numero_nf: Optional[str] = None
    data_nf: Optional[str] = None
    valor_total: Optional[float] = None
    descricao_produtos: Optional[str] = None
    pessoa_id: Optional[int] = None
    faturado_id: Optional[int] = None
    classificacao_ids: list[int] = []
    parcelas: list[ParcelaInput] = []

class MovimentoUpdate(MovimentoCreate):
    pass


# ── helpers ──────────────────────────────────────────────────────────────

def _fmt_pessoa(p):
    return {"id": p.id, "tipo": p.tipo, "razao_social": p.razao_social,
            "nome_fantasia": p.nome_fantasia, "cnpj": p.cnpj, "cpf": p.cpf,
            "ativo": p.ativo, "criado_em": p.criado_em}

def _fmt_clf(c):
    return {"id": c.id, "tipo": c.tipo, "descricao": c.descricao,
            "ativo": c.ativo, "criado_em": c.criado_em}

def _fmt_mov(m):
    return {"id": m.id, "tipo": m.tipo, "numero_nf": m.numero_nf,
            "data_nf": m.data_nf, "valor_total": m.valor_total,
            "descricao_produtos": m.descricao_produtos, "pessoa_id": m.pessoa_id,
            "faturado_id": m.faturado_id, "ativo": getattr(m, "ativo", True),
            "criado_em": m.criado_em}


# ── PESSOAS ────────────────────────────────────────────────────────────

@router.get("/pessoas")
def listar_pessoas(
    q: Optional[str] = None,
    tipo: Optional[str] = None,
    ativo: Optional[bool] = None,
    documento: Optional[str] = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
    db: Session = Depends(get_db),
):
    pessoas = PessoasRepository(db).listar(
        q=q, tipo=tipo, ativo=ativo, documento=documento,
        order_by=order_by, order_dir=order_dir,
    )
    return [_fmt_pessoa(p) for p in pessoas]


@router.get("/pessoas/todos")
def listar_pessoas_ativas(db: Session = Depends(get_db)):
    return [_fmt_pessoa(p) for p in PessoasRepository(db).listar_ativos()]

@router.post("/pessoas", status_code=201)
def criar_pessoa(body: PessoaCreate, db: Session = Depends(get_db)):
    if body.tipo not in ("CLIENTE-FORNECEDOR", "FATURADO"):
        raise HTTPException(400, "tipo deve ser CLIENTE-FORNECEDOR ou FATURADO")
    p = GestaoRepository(db).criar_pessoa(
        body.tipo, body.razao_social, body.nome_fantasia, body.cnpj, body.cpf)
    return _fmt_pessoa(p)

@router.put("/pessoas/{id}")
def atualizar_pessoa(id: int, body: PessoaUpdate, db: Session = Depends(get_db)):
    p = GestaoRepository(db).atualizar_pessoa(id, body.razao_social, body.nome_fantasia, body.cnpj, body.cpf)
    if not p:
        raise HTTPException(404, "Pessoa não encontrada.")
    return _fmt_pessoa(p)

@router.patch("/pessoas/{id}/inativar")
def inativar_pessoa(id: int, db: Session = Depends(get_db)):
    p = GestaoRepository(db).inativar_pessoa(id)
    if not p:
        raise HTTPException(404, "Pessoa não encontrada.")
    return {"id": p.id, "ativo": p.ativo, "mensagem": "Registro inativado com sucesso."}

@router.patch("/pessoas/{id}/reativar")
def reativar_pessoa(id: int, db: Session = Depends(get_db)):
    p = GestaoRepository(db).reativar_pessoa(id)
    if not p:
        raise HTTPException(404, "Pessoa não encontrada.")
    return {"id": p.id, "ativo": p.ativo, "mensagem": "Registro reativado com sucesso."}

@router.delete("/pessoas/{id}")
def system_delete_pessoa(id: int, db: Session = Depends(get_db)):
    p = GestaoRepository(db).system_delete_pessoa(id)
    if not p:
        raise HTTPException(404, "Pessoa não encontrada.")
    return {"id": p.id, "mensagem": "Registro marcado como SYSTEM_DELETED."}


# ── CLASSIFICAÇÕES ─────────────────────────────────────────────────────

@router.get("/classificacoes")
def listar_classificacoes(
    q: Optional[str] = None,
    tipo: Optional[str] = None,
    ativo: Optional[bool] = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
    db: Session = Depends(get_db),
):
    classificacoes = ClassificacaoRepository(db).listar(
        q=q, tipo=tipo, ativo=ativo, order_by=order_by, order_dir=order_dir
    )
    return [_fmt_clf(c) for c in classificacoes]


@router.get("/classificacoes/todos")
def listar_classificacoes_ativas(db: Session = Depends(get_db)):
    return [_fmt_clf(c) for c in ClassificacaoRepository(db).listar_ativos()]

@router.post("/classificacoes", status_code=201)
def criar_classificacao(body: ClassificacaoCreate, db: Session = Depends(get_db)):
    if body.tipo not in ("DESPESA", "RECEITA"):
        raise HTTPException(400, "tipo deve ser DESPESA ou RECEITA")
    c = GestaoRepository(db).criar_classificacao(body.tipo, body.descricao)
    return _fmt_clf(c)

@router.put("/classificacoes/{id}")
def atualizar_classificacao(id: int, body: ClassificacaoUpdate, db: Session = Depends(get_db)):
    c = GestaoRepository(db).atualizar_classificacao(id, body.tipo, body.descricao)
    if not c:
        raise HTTPException(404, "Classificação não encontrada.")
    return _fmt_clf(c)

@router.patch("/classificacoes/{id}/inativar")
def inativar_classificacao(id: int, db: Session = Depends(get_db)):
    c = GestaoRepository(db).inativar_classificacao(id)
    if not c:
        raise HTTPException(404, "Classificação não encontrada.")
    return {"id": c.id, "ativo": c.ativo, "mensagem": "Registro inativado com sucesso."}

@router.patch("/classificacoes/{id}/reativar")
def reativar_classificacao(id: int, db: Session = Depends(get_db)):
    c = GestaoRepository(db).reativar_classificacao(id)
    if not c:
        raise HTTPException(404, "Classificação não encontrada.")
    return {"id": c.id, "ativo": c.ativo, "mensagem": "Registro reativado com sucesso."}

@router.delete("/classificacoes/{id}")
def system_delete_classificacao(id: int, db: Session = Depends(get_db)):
    c = GestaoRepository(db).system_delete_classificacao(id)
    if not c:
        raise HTTPException(404, "Classificação não encontrada.")
    return {"id": c.id, "mensagem": "Registro marcado como SYSTEM_DELETED."}


# ── MOVIMENTOS ─────────────────────────────────────────────────────────

@router.get("/movimentos")
def listar_movimentos(
    q: Optional[str] = None,
    tipo: Optional[str] = None,
    numero_nf: Optional[str] = None,
    ativo: Optional[bool] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
    db: Session = Depends(get_db),
):
    movimentos = GestaoRepository(db).listar_movimentos(
        q=q, tipo=tipo, numero_nf=numero_nf, ativo=ativo,
        data_inicio=data_inicio, data_fim=data_fim,
        order_by=order_by, order_dir=order_dir,
    )
    return [_fmt_mov(m) for m in movimentos]

@router.get("/movimentos/todos")
def listar_movimentos_ativos(db: Session = Depends(get_db)):
    return [_fmt_mov(m) for m in GestaoRepository(db).listar_movimentos_ativos()]

@router.get("/movimentos/{id}")
def detalhe_movimento(id: int, db: Session = Depends(get_db)):
    dados = GestaoRepository(db).get_movimento_completo(id)
    if not dados:
        raise HTTPException(404, "Movimento não encontrado.")
    m = dados["movimento"]
    f = dados["fornecedor"]
    fat = dados["faturado"]
    return {
        **_fmt_mov(m),
        "fornecedor": {"id": f.id, "razao_social": f.razao_social, "cnpj": f.cnpj} if f else None,
        "faturado": {"id": fat.id, "razao_social": fat.razao_social, "cpf": fat.cpf} if fat else None,
        "classificacoes": [{"id": c.id, "tipo": c.tipo, "descricao": c.descricao} for c in dados["classificacoes"]],
        "parcelas": [{"id": p.id, "numero_parcela": p.numero_parcela, "valor": p.valor,
                      "data_vencimento": p.data_vencimento} for p in dados["parcelas"]],
    }

@router.post("/movimentos", status_code=201)
def criar_movimento(body: MovimentoCreate, db: Session = Depends(get_db)):
    if body.tipo not in ("APAGAR", "ARECEBER"):
        raise HTTPException(400, "tipo deve ser APAGAR ou ARECEBER")
    parcelas_dict = [p.dict() for p in body.parcelas]
    m = GestaoRepository(db).criar_movimento(
        body.tipo, body.numero_nf, body.data_nf, body.valor_total,
        body.descricao_produtos, body.pessoa_id, body.faturado_id,
        body.classificacao_ids, parcelas_dict)
    return detalhe_movimento(m.id, db)

@router.put("/movimentos/{id}")
def atualizar_movimento(id: int, body: MovimentoUpdate, db: Session = Depends(get_db)):
    parcelas_dict = [p.dict() for p in body.parcelas]
    m = GestaoRepository(db).atualizar_movimento(
        id, body.tipo, body.numero_nf, body.data_nf, body.valor_total,
        body.descricao_produtos, body.pessoa_id, body.faturado_id,
        body.classificacao_ids, parcelas_dict)
    if not m:
        raise HTTPException(404, "Movimento não encontrado.")
    return detalhe_movimento(m.id, db)

@router.delete("/movimentos/{id}")
def system_delete_movimento(id: int, db: Session = Depends(get_db)):
    m = GestaoRepository(db).system_delete_movimento(id)
    if not m:
        raise HTTPException(404, "Movimento não encontrado.")
    return {"id": m.id, "mensagem": "Registro marcado como SYSTEM_DELETED."}


# ── PARCELAS ────────────────────────────────────────────────────────────

@router.get("/parcelas")
def listar_parcelas(db: Session = Depends(get_db)):
    parcelas = GestaoRepository(db).listar_parcelas()
    return [{"id": p.id, "movimento_id": p.movimento_id, "numero_parcela": p.numero_parcela,
             "valor": p.valor, "data_vencimento": p.data_vencimento} for p in parcelas]
