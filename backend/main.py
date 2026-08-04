from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Cria as tabelas no banco de dados (SQLite)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema Ambulante - SEMEPP Sorocaba")

# Configuração de CORS para permitir que o Frontend (HTML) comunique com o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API SEMEPP Sorocaba online!"}

@app.get("/status")
def status_check():
    return {"status": "ok", "versao": "1.0.0"}