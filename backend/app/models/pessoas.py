from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Pessoas(Base):
    __tablename__ = "pessoas"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # CLIENTE-FORNECEDOR | FATURADO
    razao_social = Column(String, nullable=True)
    nome_fantasia = Column(String, nullable=True)
    cnpj = Column(String, nullable=True, index=True)
    cpf = Column(String, nullable=True, index=True)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
