from typing import Optional
from sqlalchemy.orm import Session
from app.models.classificacao import Classificacao


_ALLOWED_ORDER_BY = {"id", "descricao", "tipo", "ativo", "criado_em"}
_ALLOWED_ORDER_DIR = {"asc", "desc"}


class ClassificacaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar(
        self,
        q: Optional[str] = None,
        tipo: Optional[str] = None,
        ativo: Optional[bool] = None,
        order_by: str = "criado_em",
        order_dir: str = "desc",
    ):
        query = self.db.query(Classificacao)

        if q:
            like = f"%{q.strip()}%"
            query = query.filter(Classificacao.descricao.ilike(like))

        if tipo is not None:
            query = query.filter(Classificacao.tipo == tipo)

        if ativo is not None:
            query = query.filter(Classificacao.ativo == ativo)

        if order_by not in _ALLOWED_ORDER_BY:
            order_by = "criado_em"
        if order_dir not in _ALLOWED_ORDER_DIR:
            order_dir = "desc"

        coluna = getattr(Classificacao, order_by)
        query = query.order_by(coluna.desc() if order_dir == "desc" else coluna.asc())

        return query.all()

    def listar_ativos(self):
        return (
            self.db.query(Classificacao)
            .filter(Classificacao.ativo == True)  # noqa: E712
            .order_by(Classificacao.criado_em.desc())
            .all()
        )

    def find_by_descricao(self, descricao: str) -> Classificacao | None:
        return (
            self.db.query(Classificacao)
            .filter(
                Classificacao.tipo == "DESPESA",
                Classificacao.descricao.ilike(f"%{descricao.strip()}%"),
            )
            .first()
        )

    def create(self, descricao: str) -> Classificacao:
        classificacao = Classificacao(
            tipo="DESPESA",
            descricao=descricao,
            ativo=True,
        )
        self.db.add(classificacao)
        self.db.commit()
        self.db.refresh(classificacao)
        return classificacao
