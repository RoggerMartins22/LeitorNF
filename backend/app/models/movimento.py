from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class MovimentoContas(Base):
    __tablename__ = "movimentocontas"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # APAGAR | ARECEBER
    numero_nf = Column(String, nullable=True)
    data_nf = Column(String, nullable=True)
    valor_total = Column(Float, nullable=True)
    descricao_produtos = Column(String, nullable=True)
    pessoa_id = Column(Integer, ForeignKey("pessoas.id"), nullable=True)     # fornecedor/cliente
    faturado_id = Column(Integer, ForeignKey("pessoas.id"), nullable=True)   # faturado
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    parcelas = relationship("ParcelaContas", back_populates="movimento")
    classificacoes = relationship("MovimentoClassificacao", back_populates="movimento")


class MovimentoClassificacao(Base):
    __tablename__ = "movimentoclassificacao"

    id = Column(Integer, primary_key=True, index=True)
    movimento_id = Column(Integer, ForeignKey("movimentocontas.id"), nullable=False)
    classificacao_id = Column(Integer, ForeignKey("classificacao.id"), nullable=False)

    movimento = relationship("MovimentoContas", back_populates="classificacoes")


class ParcelaContas(Base):
    __tablename__ = "parcelacontas"

    id = Column(Integer, primary_key=True, index=True)
    movimento_id = Column(Integer, ForeignKey("movimentocontas.id"), nullable=False)
    numero_parcela = Column(Integer, nullable=False)
    valor = Column(Float, nullable=True)
    data_vencimento = Column(String, nullable=True)

    movimento = relationship("MovimentoContas", back_populates="parcelas")
