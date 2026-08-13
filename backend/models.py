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

class Ambulante(Base):
    __tablename__ = "ambulantes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    cpf = Column(String, unique=True, index=True) # Apenas números
    data_nascimento = Column(String) # Formato DD/MM/AAAA
    cnpj = Column(String, default="N/A")
    numero_autorizacao = Column(String) # Ex: 176/2023
    local_autorizado = Column(String)
    categoria = Column(String) # Ex: A
    produtos = Column(String)
    observacao_produtos = Column(String) # Restrição e avisos
    dias_autorizados = Column(String)
    horario = Column(String)
    inicio = Column(String)
    termino = Column(String)
    processo_administrativo = Column(String)
    status = Column(String, default="Ativo")
    secretario = Column(String, default="Paulo Henrique Marcelo")
    prefeito = Column(String, default="Rodrigo Maganhato")

class Consulta(Base):
    __tablename__ = "consultas_viabilidade"

    id = Column(Integer, primary_key=True, index=True)
    codigo_consulta = Column(String, unique=True, index=True) # Ex: CNS-20260813-1104-0042
    logradouro = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    tipo_comercio = Column(String)
    cnae = Column(String, default="")
    zona_codigo = Column(String)
    zona_nome = Column(String)
    parecer = Column(String)
    justificativa = Column(String)
    requisitos_json = Column(String)
    data_hora = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)