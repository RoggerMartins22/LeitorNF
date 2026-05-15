from sqlalchemy.orm import Session
from app.models.classificacao import Classificacao


class ClassificacaoRepository:
    def __init__(self, db: Session):
        self.db = db

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
