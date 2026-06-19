from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Conta(Base):
    __tablename__ = "contas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # CORRENTE | POUPANCA | CAIXA | CARTAO_CREDITO
    banco = Column(String, nullable=True)
    agencia = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    saldo_inicial = Column(Float, nullable=False, default=0.0)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
