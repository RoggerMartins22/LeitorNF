from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.conta_repository import ContaRepository
from app.schemas.conta import ContaCreate, ContaUpdate, ContaResponse
from app.services.auth_service import get_current_user

_TIPOS_VALIDOS = {"CORRENTE", "POUPANCA", "CAIXA", "CARTAO_CREDITO"}


router = APIRouter(
    prefix="/api/gestao/contas",
    tags=["contas"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=List[ContaResponse])
def listar_contas(
    q: Optional[str] = None,
    tipo: Optional[str] = None,
    ativo: Optional[bool] = None,
    banco: Optional[str] = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
    db: Session = Depends(get_db),
):
    return ContaRepository(db).listar(
        q=q, tipo=tipo, ativo=ativo, banco=banco,
        order_by=order_by, order_dir=order_dir,
    )


@router.get("/todos", response_model=List[ContaResponse])
def listar_contas_ativas(db: Session = Depends(get_db)):
    return ContaRepository(db).listar_ativos()


@router.post("", response_model=ContaResponse, status_code=201)
def criar_conta(body: ContaCreate, db: Session = Depends(get_db)):
    if body.tipo not in _TIPOS_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail="tipo deve ser CORRENTE, POUPANCA, CAIXA ou CARTAO_CREDITO.",
        )
    return ContaRepository(db).criar(body.model_dump())


@router.put("/{conta_id}", response_model=ContaResponse)
def atualizar_conta(conta_id: int, body: ContaUpdate, db: Session = Depends(get_db)):
    dados = body.model_dump(exclude_unset=True)
    if "tipo" in dados and dados["tipo"] not in _TIPOS_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail="tipo deve ser CORRENTE, POUPANCA, CAIXA ou CARTAO_CREDITO.",
        )
    return ContaRepository(db).atualizar(conta_id, dados)


@router.patch("/{conta_id}/inativar")
def inativar_conta(conta_id: int, db: Session = Depends(get_db)):
    conta = ContaRepository(db).inativar(conta_id)
    return {"id": conta.id, "ativo": False, "mensagem": "Conta inativada com sucesso."}


@router.patch("/{conta_id}/reativar")
def reativar_conta(conta_id: int, db: Session = Depends(get_db)):
    conta = ContaRepository(db).reativar(conta_id)
    return {"id": conta.id, "ativo": True, "mensagem": "Conta reativada com sucesso."}


@router.delete("/{conta_id}")
def excluir_conta(conta_id: int, db: Session = Depends(get_db)):
    conta = ContaRepository(db).inativar(conta_id)
    return {"id": conta.id, "mensagem": "Conta excluída (delete lógico)."}
