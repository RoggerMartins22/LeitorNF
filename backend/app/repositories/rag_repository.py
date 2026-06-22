from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.movimento import MovimentoContas, MovimentoClassificacao, ParcelaContas
from app.models.pessoas import Pessoas
from app.models.classificacao import Classificacao


class RagRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_movimentos_completos(self) -> list:
        movimentos = (
            self.db.query(MovimentoContas)
            .filter(MovimentoContas.ativo == True)
            .all()
        )
        return self._enriquecer_movimentos(movimentos)

    def buscar_por_numeros_nf(self, numeros: list) -> list:
        """Busca movimentos ativos pelos números de NF informados."""
        if not numeros:
            return []
        movimentos = (
            self.db.query(MovimentoContas)
            .filter(
                MovimentoContas.ativo == True,
                MovimentoContas.numero_nf.in_(numeros),
            )
            .all()
        )
        return self._enriquecer_movimentos(movimentos)

    def buscar_por_termos(self, termos: list) -> list:
        if not termos:
            movimentos = (
                self.db.query(MovimentoContas)
                .filter(MovimentoContas.ativo == True)
                .order_by(MovimentoContas.criado_em.desc())
                .limit(20)
                .all()
            )
            return self._enriquecer_movimentos(movimentos)

        conditions = []
        for termo in termos:
            like = f"%{termo}%"
            conditions.append(MovimentoContas.descricao_produtos.ilike(like))
            conditions.append(MovimentoContas.numero_nf.ilike(like))
            conditions.append(Pessoas.razao_social.ilike(like))
            conditions.append(Pessoas.nome_fantasia.ilike(like))
            conditions.append(Classificacao.descricao.ilike(like))

        movimentos = (
            self.db.query(MovimentoContas)
            .outerjoin(Pessoas, Pessoas.id == MovimentoContas.pessoa_id)
            .outerjoin(MovimentoClassificacao, MovimentoClassificacao.movimento_id == MovimentoContas.id)
            .outerjoin(Classificacao, Classificacao.id == MovimentoClassificacao.classificacao_id)
            .filter(MovimentoContas.ativo == True)
            .filter(or_(*conditions))
            .distinct()
            .limit(20)
            .all()
        )

        if not movimentos:
            movimentos = (
                self.db.query(MovimentoContas)
                .filter(MovimentoContas.ativo == True)
                .order_by(MovimentoContas.criado_em.desc())
                .limit(20)
                .all()
            )

        return self._enriquecer_movimentos(movimentos)

    def _enriquecer_movimentos(self, movimentos: list) -> list:
        result = []
        for mov in movimentos:
            fornecedor = (
                self.db.query(Pessoas).filter(Pessoas.id == mov.pessoa_id).first()
                if mov.pessoa_id else None
            )
            faturado = (
                self.db.query(Pessoas).filter(Pessoas.id == mov.faturado_id).first()
                if mov.faturado_id else None
            )
            parcelas = (
                self.db.query(ParcelaContas)
                .filter(ParcelaContas.movimento_id == mov.id)
                .order_by(ParcelaContas.numero_parcela)
                .all()
            )
            classificacoes = (
                self.db.query(Classificacao)
                .join(MovimentoClassificacao,
                      MovimentoClassificacao.classificacao_id == Classificacao.id)
                .filter(MovimentoClassificacao.movimento_id == mov.id)
                .all()
            )
            result.append({
                "movimento": mov,
                "fornecedor": fornecedor,
                "faturado": faturado,
                "parcelas": parcelas,
                "classificacoes": classificacoes,
            })
        return result
