from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.nota_fiscal import NotaFiscalExtraida
from app.schemas.lancamento import AnaliseResponse, LancamentoResponse, StatusEntidade
from app.repositories.pessoas_repository import PessoasRepository
from app.repositories.classificacao_repository import ClassificacaoRepository
from app.repositories.movimento_repository import MovimentoRepository


class LancamentoService:
    def __init__(self, db: Session):
        self.db = db
        self.pessoas_repo = PessoasRepository(db)
        self.classificacao_repo = ClassificacaoRepository(db)
        self.movimento_repo = MovimentoRepository(db)

    def analisar_e_lancar(self, nota: NotaFiscalExtraida) -> dict:

        # ── 0. VERIFICAR DUPLICATA ─────────────────────────────────────
        if nota.numero_nota_fiscal:
            existente = self.movimento_repo.find_by_numero_nf(nota.numero_nota_fiscal)
            if existente:
                raise HTTPException(
                    status_code=409,
                    detail=f"A Nota Fiscal nº {nota.numero_nota_fiscal} já foi lançada anteriormente (Movimento #{existente.id})."
                )

        # ── 1. FORNECEDOR ──────────────────────────────────────────────
        fornecedor_db = None
        fornecedor_existe = False

        if nota.fornecedor and nota.fornecedor.cnpj:
            fornecedor_db = self.pessoas_repo.find_by_cnpj(nota.fornecedor.cnpj)
            fornecedor_existe = fornecedor_db is not None

        status_fornecedor = StatusEntidade(
            nome=nota.fornecedor.razao_social if nota.fornecedor else "Não informado",
            documento=nota.fornecedor.cnpj if nota.fornecedor else None,
            existe=fornecedor_existe,
            id=fornecedor_db.id if fornecedor_db else None,
        )

        if not fornecedor_existe and nota.fornecedor and nota.fornecedor.razao_social:
            fornecedor_db = self.pessoas_repo.create_fornecedor(
                razao_social=nota.fornecedor.razao_social,
                nome_fantasia=nota.fornecedor.fantasia,
                cnpj=nota.fornecedor.cnpj or "",
            )
            status_fornecedor.id = fornecedor_db.id

        # ── 2. FATURADO ────────────────────────────────────────────────
        faturado_db = None
        faturado_existe = False

        if nota.faturado and nota.faturado.cpf:
            faturado_db = self.pessoas_repo.find_by_cpf(nota.faturado.cpf)
            faturado_existe = faturado_db is not None

        status_faturado = StatusEntidade(
            nome=nota.faturado.nome_completo if nota.faturado else "Não informado",
            documento=nota.faturado.cpf if nota.faturado else None,
            existe=faturado_existe,
            id=faturado_db.id if faturado_db else None,
        )

        if not faturado_existe and nota.faturado and nota.faturado.nome_completo:
            faturado_db = self.pessoas_repo.create_faturado(
                nome_completo=nota.faturado.nome_completo,
                cpf=nota.faturado.cpf or "",
            )
            status_faturado.id = faturado_db.id

        # ── 3. CLASSIFICAÇÃO ───────────────────────────────────────────
        classificacao_db = None
        classificacao_existe = False
        descricao_despesa = "Não informado"

        if nota.classificacoes_despesa and len(nota.classificacoes_despesa) > 0:
            primeira = nota.classificacoes_despesa[0]
            descricao_despesa = primeira.descricao or primeira.categoria or "Não informado"
            classificacao_db = self.classificacao_repo.find_by_descricao(descricao_despesa)
            classificacao_existe = classificacao_db is not None

        status_despesa = StatusEntidade(
            nome=descricao_despesa,
            existe=classificacao_existe,
            id=classificacao_db.id if classificacao_db else None,
        )

        if not classificacao_existe and descricao_despesa != "Não informado":
            classificacao_db = self.classificacao_repo.create(descricao=descricao_despesa)
            status_despesa.id = classificacao_db.id

        # ── 4. LANÇAR MOVIMENTO ────────────────────────────────────────
        movimento = self.movimento_repo.create_movimento(
            pessoa_id=fornecedor_db.id if fornecedor_db else None,
            faturado_id=faturado_db.id if faturado_db else None,
            numero_nf=nota.numero_nota_fiscal,
            data_nf=nota.data_emissao,
            valor_total=nota.valor_total,
            descricao_produtos=nota.descricao_produtos,
        )

        # ── 5. VINCULAR CLASSIFICAÇÕES ─────────────────────────────────
        for clf in (nota.classificacoes_despesa or []):
            desc = clf.descricao or clf.categoria or ""
            if not desc:
                continue
            clf_db = self.classificacao_repo.find_by_descricao(desc)
            if not clf_db:
                clf_db = self.classificacao_repo.create(descricao=desc)
            self.movimento_repo.vincular_classificacao(movimento.id, clf_db.id)

        # ── 6. CRIAR PARCELAS ──────────────────────────────────────────
        if nota.parcelas:
            self.movimento_repo.create_parcelas(movimento.id, nota.parcelas)

        # ── 7. RETORNO ─────────────────────────────────────────────────
        analise = AnaliseResponse(
            fornecedor=status_fornecedor,
            faturado=status_faturado,
            despesa=status_despesa,
        )

        lancamento = LancamentoResponse(
            sucesso=True,
            mensagem="Registro lançado com sucesso.",
            movimento_id=movimento.id,
        )

        return {
            "analise": analise.model_dump(),
            "lancamento": lancamento.model_dump(),
        }
