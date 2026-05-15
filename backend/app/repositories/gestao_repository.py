from sqlalchemy.orm import Session
from app.models.pessoas import Pessoas
from app.models.classificacao import Classificacao
from app.models.movimento import MovimentoContas, MovimentoClassificacao, ParcelaContas


class GestaoRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── PESSOAS ────────────────────────────────────────────────────────

    def listar_pessoas(self):
        return self.db.query(Pessoas).order_by(Pessoas.criado_em.desc()).all()

    def get_pessoa(self, id: int):
        return self.db.query(Pessoas).filter(Pessoas.id == id).first()

    def criar_pessoa(self, tipo, razao_social, nome_fantasia, cnpj, cpf):
        pessoa = Pessoas(tipo=tipo, razao_social=razao_social, nome_fantasia=nome_fantasia,
                         cnpj=cnpj, cpf=cpf, ativo=True)
        self.db.add(pessoa)
        self.db.commit()
        self.db.refresh(pessoa)
        return pessoa

    def atualizar_pessoa(self, id, razao_social, nome_fantasia, cnpj, cpf):
        pessoa = self.get_pessoa(id)
        if not pessoa:
            return None
        pessoa.razao_social = razao_social
        pessoa.nome_fantasia = nome_fantasia
        pessoa.cnpj = cnpj
        pessoa.cpf = cpf
        self.db.commit()
        self.db.refresh(pessoa)
        return pessoa

    def inativar_pessoa(self, id):
        pessoa = self.get_pessoa(id)
        if pessoa:
            pessoa.ativo = False
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa

    def reativar_pessoa(self, id):
        pessoa = self.get_pessoa(id)
        if pessoa:
            pessoa.ativo = True
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa

    def system_delete_pessoa(self, id):
        pessoa = self.get_pessoa(id)
        if pessoa:
            pessoa.ativo = False
            if not (pessoa.razao_social or "").startswith("[SYSTEM_DELETED]"):
                pessoa.razao_social = f"[SYSTEM_DELETED] {pessoa.razao_social or ''}"
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa

    # ── CLASSIFICAÇÕES ─────────────────────────────────────────────────

    def listar_classificacoes(self):
        return self.db.query(Classificacao).order_by(Classificacao.criado_em.desc()).all()

    def get_classificacao(self, id):
        return self.db.query(Classificacao).filter(Classificacao.id == id).first()

    def criar_classificacao(self, tipo, descricao):
        clf = Classificacao(tipo=tipo, descricao=descricao, ativo=True)
        self.db.add(clf)
        self.db.commit()
        self.db.refresh(clf)
        return clf

    def atualizar_classificacao(self, id, tipo, descricao):
        clf = self.get_classificacao(id)
        if not clf:
            return None
        clf.tipo = tipo
        clf.descricao = descricao
        self.db.commit()
        self.db.refresh(clf)
        return clf

    def inativar_classificacao(self, id):
        clf = self.get_classificacao(id)
        if clf:
            clf.ativo = False
            self.db.commit()
            self.db.refresh(clf)
        return clf

    def reativar_classificacao(self, id):
        clf = self.get_classificacao(id)
        if clf:
            clf.ativo = True
            self.db.commit()
            self.db.refresh(clf)
        return clf

    def system_delete_classificacao(self, id):
        clf = self.get_classificacao(id)
        if clf:
            clf.ativo = False
            if not clf.descricao.startswith("[SYSTEM_DELETED]"):
                clf.descricao = f"[SYSTEM_DELETED] {clf.descricao}"
            self.db.commit()
            self.db.refresh(clf)
        return clf

    # ── MOVIMENTOS ─────────────────────────────────────────────────────

    def listar_movimentos(self):
        return self.db.query(MovimentoContas).order_by(MovimentoContas.criado_em.desc()).all()

    def get_movimento(self, id):
        return self.db.query(MovimentoContas).filter(MovimentoContas.id == id).first()

    def get_movimento_completo(self, id):
        movimento = self.get_movimento(id)
        if not movimento:
            return None
        parcelas = (self.db.query(ParcelaContas)
                    .filter(ParcelaContas.movimento_id == id)
                    .order_by(ParcelaContas.numero_parcela).all())
        classificacoes = (self.db.query(Classificacao)
                          .join(MovimentoClassificacao,
                                MovimentoClassificacao.classificacao_id == Classificacao.id)
                          .filter(MovimentoClassificacao.movimento_id == id).all())
        fornecedor = self.db.query(Pessoas).filter(Pessoas.id == movimento.pessoa_id).first()
        faturado = self.db.query(Pessoas).filter(Pessoas.id == movimento.faturado_id).first()
        return {"movimento": movimento, "fornecedor": fornecedor, "faturado": faturado,
                "parcelas": parcelas, "classificacoes": classificacoes}

    def criar_movimento(self, tipo, numero_nf, data_nf, valor_total, descricao_produtos,
                        pessoa_id, faturado_id, classificacao_ids, parcelas):
        mov = MovimentoContas(tipo=tipo, numero_nf=numero_nf, data_nf=data_nf,
                              valor_total=valor_total, descricao_produtos=descricao_produtos,
                              pessoa_id=pessoa_id, faturado_id=faturado_id)
        self.db.add(mov)
        self.db.flush()
        for clf_id in classificacao_ids:
            self.db.add(MovimentoClassificacao(movimento_id=mov.id, classificacao_id=clf_id))
        for i, p in enumerate(parcelas, start=1):
            self.db.add(ParcelaContas(movimento_id=mov.id, numero_parcela=i,
                                      valor=p.get("valor"), data_vencimento=p.get("data_vencimento")))
        self.db.commit()
        self.db.refresh(mov)
        return mov

    def atualizar_movimento(self, id, tipo, numero_nf, data_nf, valor_total, descricao_produtos,
                            pessoa_id, faturado_id, classificacao_ids, parcelas):
        mov = self.get_movimento(id)
        if not mov:
            return None
        mov.tipo = tipo
        mov.numero_nf = numero_nf
        mov.data_nf = data_nf
        mov.valor_total = valor_total
        mov.descricao_produtos = descricao_produtos
        mov.pessoa_id = pessoa_id
        mov.faturado_id = faturado_id
        self.db.query(MovimentoClassificacao).filter(MovimentoClassificacao.movimento_id == id).delete()
        self.db.query(ParcelaContas).filter(ParcelaContas.movimento_id == id).delete()
        for clf_id in classificacao_ids:
            self.db.add(MovimentoClassificacao(movimento_id=id, classificacao_id=clf_id))
        for i, p in enumerate(parcelas, start=1):
            self.db.add(ParcelaContas(movimento_id=id, numero_parcela=i,
                                      valor=p.get("valor"), data_vencimento=p.get("data_vencimento")))
        self.db.commit()
        self.db.refresh(mov)
        return mov

    def system_delete_movimento(self, id):
        mov = self.get_movimento(id)
        if mov:
            desc = mov.descricao_produtos or ""
            if not desc.startswith("[SYSTEM_DELETED]"):
                mov.descricao_produtos = f"[SYSTEM_DELETED] {desc}"
            self.db.commit()
            self.db.refresh(mov)
        return mov

    # ── PARCELAS ────────────────────────────────────────────────────────

    def listar_parcelas(self):
        return (self.db.query(ParcelaContas)
                .order_by(ParcelaContas.movimento_id, ParcelaContas.numero_parcela).all())
