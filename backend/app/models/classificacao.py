from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Classificacao(Base):
    __tablename__ = "classificacao"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # DESPESA | RECEITA
    descricao = Column(String, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
