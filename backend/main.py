from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import models
from database import engine
import jwt
import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema Ambulante - SEMEPP Sorocaba")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY_SEMEPP = "sorocaba_secret_key_2025_lei_13123"

class ConsultaRequest(BaseModel):
    latitude: float
    longitude: float
    logradouro: str

@app.get("/")
def read_root():
    return {"message": "API SEMEPP Sorocaba online!"}

@app.get("/status")
def status_check():
    return {"status": "ok", "versao": "1.0.0"}

@app.post("/api/viabilidade")
def avaliar_viabilidade(req: ConsultaRequest):
    lat, lng = req.latitude, req.longitude
    
    if -23.4800 <= lat <= -23.4700 and -47.4600 <= lng <= -47.4500:
        return {
            "zona": "ZR1 - Zona Residencial 1",
            "parecer": "Inapto",
            "justificativa": "Conforme o Art. 120 da Lei 13.123/2025, a Zona ZR1 é estritamente residencial."
        }
    else:
        return {
            "zona": "ZC - Zona Central",
            "parecer": "Apto",
            "justificativa": "Zona Central permissível para atividade ambulante (máx. 2,00m x 2,00m)."
        }

# Rota para Emissão da Carteira Digital com Token Assinado
@app.get("/api/carteira/{cpf_ou_protocolo}")
def obter_carteira_digital(cpf_ou_protocolo: str):
    # Dados de exemplo do permissionário cadastrado na SEMEPP
    payload_qr = {
        "protocolo": "AMB-2026/0482",
        "titular": "João Carlos da Silva",
        "cpf": "123.456.789-00",
        "ponto": "Praça Coronel Fernando Prestes - Centro",
        "equipamento": "Carrinho de Pipoca (2,00m x 2,00m)",
        "validade": "31/12/2026",
        "iss": "SEMEPP Sorocaba",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=365)
    }

    # Assinatura digital do token JWT para o QR Code
    token_assinado = jwt.encode(payload_qr, SECRET_KEY_SEMEPP, algorithm="HS256")

    return {
        "status": "Autorização Definitiva Ativa",
        "protocolo": payload_qr["protocolo"],
        "titular": payload_qr["titular"],
        "cpf": payload_qr["cpf"],
        "ponto_autorizado": payload_qr["ponto"],
        "equipamento": payload_qr["equipamento"],
        "validade": payload_qr["validade"],
        "qr_token": token_assinado
    }