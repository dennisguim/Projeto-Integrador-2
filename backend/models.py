from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Solicitacao(Base):
    __tablename__ = "solicitacoes_viabilidade"

    id = Column(Integer, primary_key=True, index=True)
    logradouro = Column(String, index=True)
    numero = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    parecer_automatico = Column(String) # Apto, Inapto, Vistoria
    status_analise = Column(String, default="Pendente")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)