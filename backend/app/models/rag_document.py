from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class RagDocument(Base):
    __tablename__ = "rag_documents"

    id = Column(Integer, primary_key=True, index=True)
    movimento_id = Column(Integer, ForeignKey("movimentocontas.id"), nullable=False, unique=True)
    conteudo = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)  # JSON array de floats
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
