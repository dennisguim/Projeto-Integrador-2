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

app = FastAPI(title="API Sistema de Viabilidade Comercial - SEMEPP / Sorocaba")

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
    tipo_comercio: str = "ambulante"  # "ambulante" ou "fixo"

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
    return {"status": "ok", "versao": "1.3.0", "poligonos_carregados": len(camada_zoneamento)}

# Endpoint de Viabilidade Espacial Cruzando Plano Diretor + Leis Municipais de Comércio
@app.post("/api/viabilidade")
def avaliar_viabilidade(req: ConsultaRequest):
    ponto = Point(req.longitude, req.latitude)
    zona_encontrada = None

    # Percorre os polígonos da cidade buscando o cruzamento espacial
    for item in camada_zoneamento:
        if item["geometria"].contains(ponto):
            # Corrige a case sensitivity buscando qualquer variação de nome de propriedade gerada no QGIS/KML
            props = item["propriedades"]
            zona_encontrada = props.get("Name") or props.get("name") or props.get("ZONA") or props.get("zona") or "Zona Mista"
            break

    # Fallback genérico caso o ponto clicado esteja fora dos limites do arquivo GeoJSON
    if not zona_encontrada:
        if -23.4800 <= req.latitude <= -23.4700:
            zona_encontrada = "ZR1 - Zona Residencial 1"
        else:
            zona_encontrada = "ZC - Zona Central"

    # --- REGRAS PARA COMÉRCIO AMBULANTE ---
    if req.tipo_comercio == "ambulante":
        # Inapto: ZR1 (Estritamente Residencial) ou ZCA (Conservação Ambiental)
        if any(z in zona_encontrada for z in ["ZR1", "ZER", "ZCA", "Ambiental"]):
            if "ZCA" in zona_encontrada or "Ambiental" in zona_encontrada:
                return {
                    "zona": zona_encontrada,
                    "parecer": "Inapto",
                    "tipo": "Comércio Ambulante",
                    "justificativa": f"Zona de Conservação Ambiental ({zona_encontrada}). Proibida a instalação de equipamentos comerciais em logradouros públicos.",
                    "requisitos_legais": [
                        "Proteção Ambiental Municipal",
                        "Proibido equipamento temporário ou fixo"
                    ]
                }
            else:
                return {
                    "zona": zona_encontrada,
                    "parecer": "Inapto",
                    "tipo": "Comércio Ambulante",
                    "justificativa": f"Art. 120 da Lei 13.123/2025 (Plano Diretor): Proibida atividade ambulante em Zonas Estritamente Residenciais ({zona_encontrada}).",
                    "requisitos_legais": [
                        "Atividade Vedada em Zona Residencial ZR1/ZER",
                        "Sem permissão para emissão de licença SEMEPP"
                    ]
                }
        # Apto: ZC, ZAE, ZI1, ZI2, ZPI e Corredores de Comércio
        elif any(z in zona_encontrada for z in ["ZC", "Central", "ZAE", "ZI1", "ZI2", "ZPI", "CCS", "CCI", "CCR"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Apto",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona Comercial / Industrial ({zona_encontrada}) permissível para ambulantes cadastrados.",
                "requisitos_legais": [
                    "Equipamento limitado às dimensões máximas de 2,00m x 2,00m",
                    "Manutenção de no mínimo 2,00m de faixa livre para pedestres na calçada",
                    "Cadastro ativo na SEMEPP e exibição de QR Code de Autorização Digital"
                ]
            }
        # Necessita de Vistoria: ZR2, ZR3, ZR3exp, ZRDS, ZCH, ZRURAL, AEIP, etc.
        else:
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona residencial predominantemente mista ou de expansão ({zona_encontrada}). Requer medição presencial da calçada por fiscal da SEMEPP.",
                "requisitos_legais": [
                    "Vistoria presencial obrigatória para medição da calçada (mínimo 2 metros livres)",
                    "Verificação de não interferência em garagens, pontos de ônibus e esquinas"
                ]
            }

    # --- REGRAS PARA COMÉRCIO FIXO ---
    else:
        # Inapto: ZR1 (Estritamente Residencial) ou ZCA (Conservação Ambiental)
        if any(z in zona_encontrada for z in ["ZR1", "ZER", "ZCA", "Ambiental"]):
            if "ZCA" in zona_encontrada or "Ambiental" in zona_encontrada:
                return {
                    "zona": zona_encontrada,
                    "parecer": "Inapto",
                    "tipo": "Comércio Fixo",
                    "justificativa": f"Zona de Conservação Ambiental ({zona_encontrada}). Proibida a edificação ou instalação de comércio fixo.",
                    "requisitos_legais": [
                        "Área de conservação ambiental",
                        "Vedada emissão de habite-se comercial"
                    ]
                }
            else:
                return {
                    "zona": zona_encontrada,
                    "parecer": "Inapto",
                    "tipo": "Comércio Fixo",
                    "justificativa": f"Lei 13.123/2025: Zonas Estritamente Residenciais ({zona_encontrada}) proíbem a abertura de estabelecimentos comerciais ou prestação de serviços abertos ao público.",
                    "requisitos_legais": [
                        "Zoneamento estritamente residencial (ZER/ZR1)",
                        "Vedado licenciamento de alvará comercial"
                    ]
                }
        # Apto: ZC, ZAE, ZI1, ZI2, ZPI e Corredores de Comércio/Serviços
        elif any(z in zona_encontrada for z in ["ZC", "Central", "ZAE", "ZI1", "ZI2", "ZPI", "CCS", "CCI", "CCR", "ZR-C"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Apto",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona Comercial / Industrial ({zona_encontrada}). Instalação comercial de comércio fixo permitida pelo Plano Diretor.",
                "requisitos_legais": [
                    "Alvará de Funcionamento visível na entrada principal (Lei 11.367/2016)",
                    "Uso de Calçada para Mesas/Cadeiras (Bares/Restaurantes): Requer faixa livre mínima de 1,20m (Lei Municipal 13.217/2025)",
                    "Funcionamento após 23h00 exige Alvará Especial Noturno (Lei Municipal 10.052/2012)",
                    "Atividades de baixo risco possuem dispensa nos termos da Liberdade Econômica (Lei 12.346/2021)"
                ]
            }
        # Necessita de Vistoria: ZR2, ZR3, ZR3exp, ZRDS, ZCH, ZRURAL, AEIP, etc.
        else:
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona mista ou de requalificação ({zona_encontrada}). Permite comércio local/bairro após análise de incomodidade.",
                "requisitos_legais": [
                    "Análise de Ruído e Incomodidade (Lei 8.345/2007 e NBR-10151)",
                    "Vistoria de Habite-se, Acessibilidade e Vagas de Estacionamento"
                ]
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