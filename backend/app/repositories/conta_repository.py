from typing import Optional
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.conta import Conta


_ALLOWED_ORDER_BY = {"id", "nome", "tipo", "banco", "saldo_inicial", "ativo", "criado_em"}
_ALLOWED_ORDER_DIR = {"asc", "desc"}


class ContaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar(
        self,
        q: Optional[str] = None,
        tipo: Optional[str] = None,
        ativo: Optional[bool] = None,
        banco: Optional[str] = None,
        order_by: str = "criado_em",
        order_dir: str = "desc",
    ):
        query = self.db.query(Conta)

        if q:
            like = f"%{q.strip()}%"
            query = query.filter(or_(Conta.nome.ilike(like), Conta.banco.ilike(like)))

        if banco:
            like_banco = f"%{banco.strip()}%"
            query = query.filter(Conta.banco.ilike(like_banco))

        if tipo is not None:
            query = query.filter(Conta.tipo == tipo)

        if ativo is not None:
            query = query.filter(Conta.ativo == ativo)

        if order_by not in _ALLOWED_ORDER_BY:
            order_by = "criado_em"
        if order_dir not in _ALLOWED_ORDER_DIR:
            order_dir = "desc"

        coluna = getattr(Conta, order_by)
        query = query.order_by(coluna.desc() if order_dir == "desc" else coluna.asc())

        return query.all()

    def listar_ativos(self):
        return (
            self.db.query(Conta)
            .filter(Conta.ativo == True)  # noqa: E712
            .order_by(Conta.criado_em.desc())
            .all()
        )

    def buscar_por_id(self, id: int) -> Conta:
        conta = self.db.query(Conta).filter(Conta.id == id).first()
        if not conta:
            raise HTTPException(status_code=404, detail="Conta não encontrada.")
        return conta

    def criar(self, dados: dict) -> Conta:
        payload = dict(dados or {})
        payload.pop("ativo", None)
        conta = Conta(**payload, ativo=True)
        self.db.add(conta)
        self.db.commit()
        self.db.refresh(conta)
        return conta

    def atualizar(self, id: int, dados: dict) -> Conta:
        conta = self.buscar_por_id(id)
        payload = dict(dados or {})
        payload.pop("ativo", None)
        for campo, valor in payload.items():
            if hasattr(conta, campo):
                setattr(conta, campo, valor)
        self.db.commit()
        self.db.refresh(conta)
        return conta

    def inativar(self, id: int) -> Conta:
        conta = self.buscar_por_id(id)
        conta.ativo = False
        self.db.commit()
        self.db.refresh(conta)
        return conta

    def reativar(self, id: int) -> Conta:
        conta = self.buscar_por_id(id)
        conta.ativo = True
        self.db.commit()
        self.db.refresh(conta)
        return conta
