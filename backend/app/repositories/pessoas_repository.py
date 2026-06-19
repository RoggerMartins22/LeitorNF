from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.pessoas import Pessoas


_ALLOWED_ORDER_BY = {"id", "razao_social", "nome_fantasia", "cnpj", "cpf", "tipo", "ativo", "criado_em"}
_ALLOWED_ORDER_DIR = {"asc", "desc"}


class PessoasRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar(
        self,
        q: Optional[str] = None,
        tipo: Optional[str] = None,
        ativo: Optional[bool] = None,
        documento: Optional[str] = None,
        order_by: str = "criado_em",
        order_dir: str = "desc",
    ):
        query = self.db.query(Pessoas)

        if q:
            like = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    Pessoas.razao_social.ilike(like),
                    Pessoas.nome_fantasia.ilike(like),
                    Pessoas.cnpj.ilike(like),
                    Pessoas.cpf.ilike(like),
                )
            )

        if documento:
            like_doc = f"%{documento.strip()}%"
            query = query.filter(
                or_(
                    Pessoas.cnpj.ilike(like_doc),
                    Pessoas.cpf.ilike(like_doc),
                )
            )

        if tipo is not None:
            query = query.filter(Pessoas.tipo == tipo)

        if ativo is not None:
            query = query.filter(Pessoas.ativo == ativo)

        if order_by not in _ALLOWED_ORDER_BY:
            order_by = "criado_em"
        if order_dir not in _ALLOWED_ORDER_DIR:
            order_dir = "desc"

        coluna = getattr(Pessoas, order_by)
        query = query.order_by(coluna.desc() if order_dir == "desc" else coluna.asc())

        return query.all()

    def listar_ativos(self):
        return (
            self.db.query(Pessoas)
            .filter(Pessoas.ativo == True)  # noqa: E712
            .order_by(Pessoas.criado_em.desc())
            .all()
        )

    def find_by_cnpj(self, cnpj: str) -> Pessoas | None:
        cnpj_limpo = self._limpar_documento(cnpj)
        return (
            self.db.query(Pessoas)
            .filter(
                Pessoas.tipo == "CLIENTE-FORNECEDOR",
                Pessoas.cnpj.ilike(f"%{cnpj_limpo}%"),
            )
            .first()
        )

    def find_by_cpf(self, cpf: str) -> Pessoas | None:
        cpf_limpo = self._limpar_documento(cpf)
        return (
            self.db.query(Pessoas)
            .filter(
                Pessoas.tipo == "FATURADO",
                Pessoas.cpf.ilike(f"%{cpf_limpo}%"),
            )
            .first()
        )

    def create_fornecedor(self, razao_social: str, nome_fantasia: str | None, cnpj: str) -> Pessoas:
        pessoa = Pessoas(
            tipo="CLIENTE-FORNECEDOR",
            razao_social=razao_social,
            nome_fantasia=nome_fantasia,
            cnpj=cnpj,
            ativo=True,
        )
        self.db.add(pessoa)
        self.db.commit()
        self.db.refresh(pessoa)
        return pessoa

    def create_faturado(self, nome_completo: str, cpf: str) -> Pessoas:
        pessoa = Pessoas(
            tipo="FATURADO",
            razao_social=nome_completo,
            cpf=cpf,
            ativo=True,
        )
        self.db.add(pessoa)
        self.db.commit()
        self.db.refresh(pessoa)
        return pessoa

    def _limpar_documento(self, doc: str) -> str:
        """Remove pontuação para busca flexível."""
        return doc.replace(".", "").replace("-", "").replace("/", "").strip()
