from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema Ambulante - SEMEPP Sorocaba")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Algoritmo de Triagem Urbanística (Lei nº 13.123/2025)
@app.post("/api/viabilidade")
def avaliar_viabilidade(req: ConsultaRequest):
    lat, lng = req.latitude, req.longitude
    
    # Exemplo de Regras baseadas em Coordenadas / Zoneamento de Sorocaba
    # (No Passo 5 integraremos o GeoJSON completo exportado via QGIS)
    
    # Zonas Estritamente Residencial (ZR1) ou Conservação Ambiental (ZCA)
    if -23.4800 <= lat <= -23.4700 and -47.4600 <= lng <= -47.4500:
        return {
            "zona": "ZR1 - Zona Residencial 1",
            "parecer": "Inapto",
            "justificativa": "Conforme o Art. 120 da Lei 13.123/2025, a Zona ZR1 é estritamente residencial. O comércio ambulante é vedado para preservação do sossego público."
        }
    elif -23.5100 <= lat <= -23.5000 and -47.4700 <= lng <= -47.4600:
        return {
            "zona": "ZCA - Zona de Conservação Ambiental",
            "parecer": "Inapto",
            "justificativa": "Área de preservação ambiental com restricão total de ocupação comercial sem licença especial de impacto ambiental."
        }
    elif -23.5050 <= lat <= -23.4950 and -47.4650 <= lng <= -47.4500:
        return {
            "zona": "ZC - Zona Central",
            "parecer": "Apto",
            "justificativa": "Zona Central permissível para atividade ambulante. Equipamento sujeito ao limite máximo de 2,00m x 2,00m e livre trânsito na calçada."
        }
    else:
        return {
            "zona": "CCS1 / Corredor Comercial",
            "parecer": "Necessita de Vistoria",
            "justificativa": "Ponto localizado em corredor misto. Requer vistoria prévia da fiscalização da SEMEPP para medição da largura da calçada."
        }