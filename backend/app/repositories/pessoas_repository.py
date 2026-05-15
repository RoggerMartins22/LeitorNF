from sqlalchemy.orm import Session
from app.models.pessoas import Pessoas


class PessoasRepository:
    def __init__(self, db: Session):
        self.db = db

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
