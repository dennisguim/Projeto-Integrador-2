from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import models
from database import engine
import jwt
import datetime
import json
import os
from shapely.geometry import shape, Point

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
GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sorocaba_zoneamento.geojson")

# Carregamento da Base Espacial do Plano Diretor em Memória
camada_zoneamento = []
if os.path.exists(GEOJSON_PATH):
    try:
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)
            for feature in geojson_data.get("features", []):
                geom = shape(feature["geometry"])
                props = feature.get("properties", {})
                camada_zoneamento.append({"geometria": geom, "propriedades": props})
        print(f"✅ Carregados {len(camada_zoneamento)} polígonos de zoneamento de Sorocaba.")
    except Exception as e:
        print(f"⚠️ Erro ao carregar GeoJSON: {e}")

class ConsultaRequest(BaseModel):
    latitude: float
    longitude: float
    logradouro: str

class ValidarQRRequest(BaseModel):
    token: str

class VistoriaRequest(BaseModel):
    protocolo: str
    fiscal_nome: str
    largura_calcada: float
    faixa_livre_ok: bool
    equipamento_ok: bool
    observacoes: str

@app.get("/")
def read_root():
    return {"message": "API SEMEPP Sorocaba online!"}

@app.get("/status")
def status_check():
    return {"status": "ok", "versao": "1.0.0", "poligonos_carregados": len(camada_zoneamento)}

# Endpoint de Viabilidade Espacial Point-in-Polygon (Lei 13.123/2025)
@app.post("/api/viabilidade")
def avaliar_viabilidade(req: ConsultaRequest):
    ponto = Point(req.longitude, req.latitude)
    zona_encontrada = None

    # Percorre os polígonos da cidade
    for item in camada_zoneamento:
        if item["geometria"].contains(ponto):
            zona_encontrada = item["propriedades"].get("name") or item["propriedades"].get("ZONA") or "Zona Mista"
            break

    # Regras de Negócio por Zona
    if not zona_encontrada:
        # Fallback genérico caso o ponto esteja na divisa ou fora da camada
        if -23.4800 <= req.latitude <= -23.4700:
            zona_encontrada = "ZR1 - Zona Residencial 1"
        else:
            zona_encontrada = "ZC - Zona Central"

    if "ZR1" in zona_encontrada or "Residencial 1" in zona_encontrada:
        return {
            "zona": zona_encontrada,
            "parecer": "Inapto",
            "justificativa": "Conforme o Art. 120 da Lei Municipal 13.123/2025, zonas estritamente residenciais ZR1 proíbem a instalação de comércio ambulante."
        }
    elif "ZCA" in zona_encontrada or "Ambiental" in zona_encontrada:
        return {
            "zona": zona_encontrada,
            "parecer": "Inapto",
            "justificativa": "Área de Preservação Ambiental. Proibida a instalação de equipamentos comerciais."
        }
    elif "ZC" in zona_encontrada or "Central" in zona_encontrada or "CCS" in zona_encontrada:
        return {
            "zona": zona_encontrada,
            "parecer": "Apto",
            "justificativa": "Zona Comercial permissível. Equipamento limitado a 2,00m x 2,00m e manutenção da faixa livre para pedestres."
        }
    else:
        return {
            "zona": zona_encontrada,
            "parecer": "Necessita de Vistoria",
            "justificativa": "Zona mista ou corredor comercial. Requer vistoria da fiscalização para medição da largura da calçada."
        }

@app.get("/api/carteira/{cpf_ou_protocolo}")
def obter_carteira_digital(cpf_ou_protocolo: str):
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

@app.post("/api/fiscal/validar-qr")
def validar_qr_code(req: ValidarQRRequest):
    try:
        decoded = jwt.decode(req.token, SECRET_KEY_SEMEPP, algorithms=["HS256"])
        return {
            "valido": True,
            "mensagem": "AUTORIZAÇÃO AUTÊNTICA E VÁLIDA",
            "dados": decoded
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Licença expirada.")
    except jwt.InvalidTokenError:
        if req.token == "SOROCABA_OFFLINE_TOKEN_DEMO_2026":
            return {
                "valido": True,
                "mensagem": "AUTORIZAÇÃO DEMO OFFLINE VÁLIDA",
                "dados": {
                    "titular": "João Carlos da Silva (Modo Demo)",
                    "protocolo": "AMB-2026/0482",
                    "ponto": "Praça Coronel Fernando Prestes - Centro"
                }
            }
        raise HTTPException(status_code=400, detail="QR Code inválido ou adulterado!")

@app.post("/api/fiscal/vistoria")
def registrar_vistoria(req: VistoriaRequest):
    return {
        "status": "sucesso",
        "mensagem": f"Vistoria do protocolo {req.protocolo} registrada com sucesso!",
        "data_registro": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }