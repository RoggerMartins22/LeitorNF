from sqlalchemy.orm import Session
from app.models.movimento import MovimentoContas, MovimentoClassificacao, ParcelaContas
from app.schemas.nota_fiscal import Parcela


class MovimentoRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_numero_nf(self, numero_nf: str) -> MovimentoContas | None:
        """Verifica se uma NF já foi lançada para evitar duplicatas."""
        if not numero_nf:
            return None
        return (
            self.db.query(MovimentoContas)
            .filter(MovimentoContas.numero_nf == numero_nf)
            .first()
        )

    def create_movimento(
        self,
        pessoa_id: int | None,
        faturado_id: int | None,
        numero_nf: str | None,
        data_nf: str | None,
        valor_total: float | None,
        descricao_produtos: str | None,
    ) -> MovimentoContas:
        movimento = MovimentoContas(
            tipo="APAGAR",
            numero_nf=numero_nf,
            data_nf=data_nf,
            valor_total=valor_total,
            descricao_produtos=descricao_produtos,
            pessoa_id=pessoa_id,
            faturado_id=faturado_id,
        )
        self.db.add(movimento)
        self.db.commit()
        self.db.refresh(movimento)
        return movimento

    def vincular_classificacao(self, movimento_id: int, classificacao_id: int) -> None:
        vinculo = MovimentoClassificacao(
            movimento_id=movimento_id,
            classificacao_id=classificacao_id,
        )
        self.db.add(vinculo)
        self.db.commit()

    def create_parcelas(self, movimento_id: int, parcelas: list[Parcela]) -> None:
        for p in parcelas:
            parcela = ParcelaContas(
                movimento_id=movimento_id,
                numero_parcela=p.numero_parcela,
                valor=p.valor,
                data_vencimento=p.data_vencimento,
            )
            self.db.add(parcela)
        self.db.commit()
