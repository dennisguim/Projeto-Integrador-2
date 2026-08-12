from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import models
from database import engine, get_db
from sqlalchemy.orm import Session
import jwt
import datetime
import json
import os
from shapely.geometry import shape, Point

# Inicializar Tabelas no Banco de Dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema de Viabilidade Comercial - Consulta Sorocaba")

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

# Injeção Automática de Dados Iniciais no SQLite para Testes (Seeding)
@app.on_event("startup")
def startup_populate_db():
    db = Session(bind=engine)
    try:
        # Garantir a remoção completa de dados antigos de produção/reais
        db.query(models.Ambulante).delete()
        db.commit()

        # Inserção dos 10 Ambulantes Fictícios
        ambulantes_ficticios = [
            models.Ambulante(
                nome="Carlos Augusto Pereira",
                cpf="12345678901",
                data_nascimento="12/04/1978",
                cnpj="45.123.789/0001-90",
                numero_autorizacao="012/2024",
                local_autorizado="Av. Antônio Carlos Comitre, 1200 - Campolim",
                categoria="A (Veículos Adaptados)",
                produtos="Hambúrgueres artesanais, batatas fritas e refrigerantes",
                observacao_produtos="Fica expressamente proibida a venda de bebidas alcoólicas no local. Equipamento deve ser removido ao fim do expediente.",
                dias_autorizados="Quinta a Domingo",
                horario="18:00 às 23:30",
                inicio="10/01/2024",
                termino="10/01/2027",
                processo_administrativo="4562/2023",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Ana Maria de Souza",
                cpf="23456789012",
                data_nascimento="25/09/1982",
                cnpj="N/A",
                numero_autorizacao="045/2025",
                local_autorizado="Praça Coronel Fernando Prestes - Centro",
                categoria="B (Carrinhos e Tabuleiros)",
                produtos="Pipoca doce e salgada, algodão doce e água mineral",
                observacao_produtos="Uso obrigatório de sachês individuais. Proibido obstruir rampas e acessos PCD.",
                dias_autorizados="Segunda a Sábado",
                horario="09:00 às 19:00",
                inicio="15/02/2025",
                termino="15/02/2027",
                processo_administrativo="1202/2024",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Marcos Vinícius Santos",
                cpf="34567890123",
                data_nascimento="05/11/1990",
                cnpj="N/A",
                numero_autorizacao="089/2024",
                local_autorizado="Rua Álvaro Soares, 150 - Terminal Santo Antônio",
                categoria="C (Barracas Desmontáveis)",
                produtos="Pastel de feira, salgados fritos e caldo de cana",
                observacao_produtos="Proibida venda de álcool. Certificado de manipulação de alimentos da Vigilância Sanitária em dia.",
                dias_autorizados="Terça, Quinta e Sábado",
                horario="07:00 às 14:00",
                inicio="01/03/2024",
                termino="01/03/2027",
                processo_administrativo="8933/2023",
                status="Ativo"
            ),
            models.Ambulante(
                nome="José Geraldo Lima",
                cpf="45678901234",
                data_nascimento="30/08/1965",
                cnpj="N/A",
                numero_autorizacao="102/2024",
                local_autorizado="Itinerante (Porta a Porta) - Wanel Ville e Jd. Júlio de Mesquita",
                categoria="B (Itinerante)",
                produtos="Sorvetes, picolés e geladinhos embalados",
                observacao_produtos="Fica vedada a permanência estacionária por mais de 15 minutos no mesmo ponto.",
                dias_autorizados="Todos os dias",
                horario="10:00 às 18:00",
                inicio="12/04/2024",
                termino="12/04/2027",
                processo_administrativo="2311/2024",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Sandra Helena Gomes",
                cpf="56789012345",
                data_nascimento="17/02/1974",
                cnpj="51.987.654/0001-32",
                numero_autorizacao="156/2023",
                local_autorizado="Parque das Águas - Jardim Abaeté",
                categoria="B (Carrinhos e Tabuleiros)",
                produtos="Água de coco natural e sucos engarrafados",
                observacao_produtos="Responsável por recolher o lixo gerado pelo consumo. Proibido álcool.",
                dias_autorizados="Sábado, Domingo e Feriados",
                horario="08:00 às 18:00",
                inicio="20/09/2023",
                termino="20/09/2027",
                processo_administrativo="7422/2023",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Ricardo Dias Barbosa",
                cpf="67890123456",
                data_nascimento="02/07/1987",
                cnpj="N/A",
                numero_autorizacao="210/2024",
                local_autorizado="Av. Ipanema, 500 - Vila Nova Sorocaba",
                categoria="C (Barracas Desmontáveis)",
                produtos="Milho verde cozido, pamonha e curau",
                observacao_produtos="Manter distância mínima de 5 metros de esquinas e pontos de ônibus.",
                dias_autorizados="Segunda a Sexta",
                horario="14:00 às 21:00",
                inicio="05/06/2024",
                termino="05/06/2027",
                processo_administrativo="3051/2024",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Patrícia Alessandra Vieira",
                cpf="78901234567",
                data_nascimento="21/10/1983",
                cnpj="48.332.112/0001-09",
                numero_autorizacao="033/2025",
                local_autorizado="Rua Lituânia, 300 - Jardim Europa",
                categoria="A (Veículos Adaptados)",
                produtos="Churros gourmet, waffles e sucos rápidos",
                observacao_produtos="Proibido estacionar sobre a calçada. Desmobilização obrigatória do reboque pós expediente.",
                dias_autorizados="Sexta, Sábado e Domingo",
                horario="16:00 às 22:00",
                inicio="01/02/2025",
                termino="01/02/2027",
                processo_administrativo="5012/2024",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Antônio Luiz Gonzaga",
                cpf="89012345678",
                data_nascimento="14/01/1959",
                cnpj="N/A",
                numero_autorizacao="112/2023",
                local_autorizado="Av. Dom Aguirre - Marginal (Próximo à Praça da PM)",
                categoria="B (Carrinhos e Tabuleiros)",
                produtos="Açaí no copo, salada de frutas e garrafas de água",
                observacao_produtos="Obrigatoriedade de preservar a faixa livre contínua de 1,20m na calçada para pedestres.",
                dias_autorizados="Sábado e Domingo",
                horario="09:00 às 17:00",
                inicio="10/05/2023",
                termino="10/05/2027",
                processo_administrativo="9088/2022",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Juliana Faria Mendes",
                cpf="90123456789",
                data_nascimento="30/03/1995",
                cnpj="N/A",
                numero_autorizacao="028/2025",
                local_autorizado="Praça Nove de Julho - Centro",
                categoria="C (Barracas Desmontáveis)",
                produtos="Artesanatos de crochê, bijuterias e panos de prato",
                observacao_produtos="Instalação exclusiva na demarcação reservada para a feira de artesanato regional.",
                dias_autorizados="Quinta e Sexta",
                horario="09:00 às 18:00",
                inicio="20/01/2025",
                termino="20/01/2027",
                processo_administrativo="0055/2025",
                status="Ativo"
            ),
            models.Ambulante(
                nome="Cláudio Roberto Almeida",
                cpf="01234567890",
                data_nascimento="08/08/1971",
                cnpj="N/A",
                numero_autorizacao="077/2024",
                local_autorizado="Rua Doutor Braguinha - Calçadão do Centro",
                categoria="B (Carrinhos e Tabuleiros)",
                produtos="Cachorro-quente simples e latas de refrigerante",
                observacao_produtos="Sachês de condimentos individuais obrigatórios. Proibido som mecânico no entorno.",
                dias_autorizados="Segunda a Sábado",
                horario="11:00 às 20:00",
                inicio="15/08/2024",
                termino="15/08/2027",
                processo_administrativo="6099/2023",
                status="Ativo"
            )
        ]

        db.add_all(ambulantes_ficticios)
        db.commit()
        print("🌱 Banco SQLite limpo e populado com 10 ambulantes fictícios de Sorocaba com sucesso!")
    except Exception as e:
        print(f"⚠️ Erro ao popular banco de dados: {e}")
    finally:
        db.close()

# Pydantic Schemas
class ConsultaRequest(BaseModel):
    latitude: float
    longitude: float
    logradouro: str
    tipo_comercio: str = "ambulante"

class ValidarQRRequest(BaseModel):
    token: str

class VistoriaRequest(BaseModel):
    protocolo: str
    fiscal_nome: str
    largura_calcada: float
    faixa_livre_ok: bool
    equipamento_ok: bool
    observacoes: str

class AcessoCarteiraRequest(BaseModel):
    cpf: str
    data_nascimento: str

class FiscalLoginRequest(BaseModel):
    usuario: str
    senha: str

# Endpoints
@app.get("/")
def read_root():
    return {"message": "API Consulta Sorocaba online!"}

@app.get("/status")
def status_check():
    return {"status": "ok", "versao": "1.3.0", "poligonos_carregados": len(camada_zoneamento)}

# Endpoint de Viabilidade Espacial Cruzando Plano Diretor + Leis Municipais
@app.post("/api/viabilidade")
def avaliar_viabilidade(req: ConsultaRequest):
    ponto = Point(req.longitude, req.latitude)
    zona_encontrada = None

    for item in camada_zoneamento:
        if item["geometria"].contains(ponto):
            props = item["propriedades"]
            zona_encontrada = props.get("Name") or props.get("name") or props.get("ZONA") or props.get("zona") or "Zona Mista"
            break

    if not zona_encontrada:
        if -23.4800 <= req.latitude <= -23.4700:
            zona_encontrada = "ZR1 - Zona Residencial 1"
        else:
            zona_encontrada = "ZC - Zona Central"

    if req.tipo_comercio == "ambulante":
        if any(z in zona_encontrada for z in ["ZCA", "Ambiental"]):
            return {
                "zona": zona_enacted,
                "parecer": "Inapto",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona de Conservação Ambiental ({zona_encontrada}). Proibida a instalação de equipamentos comerciais informais em vias públicas de preservação.",
                "requisitos_legais": [
                    "Proteção Ambiental Municipal (Lei 13.123/2025)",
                    "Vedada ocupação de área verde protegida"
                ]
            }
        elif any(z in zona_encontrada for z in ["ZR1", "ZER"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona Residencial 1 ({zona_encontrada}). Pp. permissível apenas para Atividades de Apoio, Prestação de Serviços sem incômodo ou Eventos Especiais (Art. 118: SEAP, EVC, UE).",
                "requisitos_legais": [
                    "Verificação de não incômodo ao sossego público",
                    "Análise especial para ponto fixo/ambulante"
                ]
            }
        elif any(z in zona_encontrada for z in ["ZC", "Central", "ZAE", "ZI1", "ZI2", "ZPI", "CCS", "CCI", "CCR"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Apto",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona Comercial / Industrial ({zona_encontrada}) permissível para ambulantes cadastrados.",
                "requisitos_legais": [
                    "Equipamento limitado às dimensões máximas de 2,00m x 2,00m",
                    "Manutenção de no mínimo 2,00m de faixa livre para pedestres na calçada",
                    "Cadastro ativo e exibição de QR Code de Autorização Digital"
                ]
            }
        else:
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Ambulante",
                "justificativa": f"Zona residencial predominantemente mista ou de expansão ({zona_encontrada}). Requer medição presencial da calçada por fiscal.",
                "requisitos_legais": [
                    "Vistoria presencial obrigatória para medição da calçada (mínimo 2 metros livres)",
                    "Verificação de não interferência em garagens, pontos de ônibus e esquinas"
                ]
            }
    else:
        if any(z in zona_encontrada for z in ["ZC", "Central", "ZAE", "ZI1", "ZI2", "ZPI", "CCS", "CCI", "CCR", "ZR-C"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Apto",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona Comercial / Industrial ({zona_encontrada}). Instalação comercial de comércio fixo permitida pelo Plano Diretor (Art. 118).",
                "requisitos_legais": [
                    "Alvará de Funcionamento visível na entrada principal (Lei 11.367/2016)",
                    "Uso de Calçada para Mesas/Cadeiras (Bares/Restaurantes): Requer faixa livre mínima de 1,20m (Lei Municipal 13.217/2025)",
                    "Funcionamento após 23h00 exige Alvará Especial Noturno (Lei Municipal 10.052/2012)",
                    "Atividades de baixo risco possuem dispensa nos termos da Liberdade Econômica (Lei 12.346/2021)"
                ]
            }
        elif any(z in zona_encontrada for z in ["ZCA", "Ambiental"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona de Conservação Ambiental ({zona_encontrada}). Art. 118 admite EVC (Escritório Virtual), TL (Turismo e Lazer) e UE (Uso Especial), mediante licenciamento ambiental e vistoria prévia.",
                "requisitos_legais": [
                    "Licenciamento Ambiental Municipal / SEMA",
                    "Enquadramento estrito nas categorias EVC, TL ou UE"
                ]
            }
        elif any(z in zona_encontrada for z in ["ZR1", "ZER"]):
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona Residencial 1 ({zona_encontrada}). O Art. 118 admite SEAP (Serviços/Apoio), EVC (Escritórios Virtuais) e UE (Uso Especial). Comércios varejistas de alto impacto são vedados.",
                "requisitos_legais": [
                    "Análise de enquadramento da atividade (CNAE em SEAP, EVC ou UE)",
                    "Ausência de incomodidade sonora ou de tráfego de carga"
                ]
            }
        else:
            return {
                "zona": zona_encontrada,
                "parecer": "Necessita de Vistoria",
                "tipo": "Comércio Fixo",
                "justificativa": f"Zona mista ou de requalificação ({zona_encontrada}). Permite comércio local/bairro após análise de enquadramento de uso (Art. 118).",
                "requisitos_legais": [
                    "Análise de Ruído e Incomodidade (Lei 8.345/2007 e NBR-10151)",
                    "Vistoria de Habite-se, Acessibilidade e Vagas de Estacionamento"
                ]
            }

# Endpoint POST para validar acesso do ambulante sem senha
@app.post("/api/carteira/acesso")
def acessar_carteira(req: AcessoCarteiraRequest, db: Session = Depends(get_db)):
    cpf_limpo = "".join(filter(str.isdigit, req.cpf))
    
    ambulante = db.query(models.Ambulante).filter(
        models.Ambulante.cpf == cpf_limpo,
        models.Ambulante.data_nascimento == req.data_nascimento
    ).first()
    
    if not ambulante:
        raise HTTPException(
            status_code=404, 
            detail="Ambulante não localizado. Verifique se o CPF e a Data de Nascimento foram digitados corretamente."
        )
        
    payload_qr = {
        "numero_autorizacao": ambulante.numero_autorizacao,
        "titular": ambulante.nome,
        "cpf": ambulante.cpf,
        "cnpj": ambulante.cnpj,
        "local": ambulante.local_autorizado,
        "categoria": ambulante.categoria,
        "produtos": ambulante.produtos,
        "observacao": ambulante.observacao_produtos,
        "dias": ambulante.dias_autorizados,
        "horario": ambulante.horario,
        "inicio": ambulante.inicio,
        "termino": ambulante.termino,
        "processo": ambulante.processo_administrativo,
        "status": ambulante.status,
        "secretario": ambulante.secretario,
        "prefeito": ambulante.prefeito,
        "exp": (datetime.datetime.utcnow() + datetime.timedelta(days=365)).timestamp()
    }
    
    token_assinado = jwt.encode(payload_qr, SECRET_KEY_SEMEPP, algorithm="HS256")
    
    return {
        "status": "sucesso",
        "dados": {
            "id": ambulante.id,
            "nome": ambulante.nome,
            "cpf": ambulante.cpf,
            "cnpj": ambulante.cnpj,
            "numero_autorizacao": ambulante.numero_autorizacao,
            "local_autorizado": ambulante.local_autorizado,
            "categoria": ambulante.categoria,
            "produtos": ambulante.produtos,
            "observacao_produtos": ambulante.observacao_produtos,
            "dias_autorizados": ambulante.dias_autorizados,
            "horario": ambulante.horario,
            "inicio": ambulante.inicio,
            "termino": ambulante.termino,
            "processo_administrativo": ambulante.processo_administrativo,
            "status": ambulante.status,
            "secretario": ambulante.secretario,
            "prefeito": ambulante.prefeito,
            "qr_token": token_assinado
        }
    }

# Endpoint GET para retornar dados de carteira por CPF ou nº de Autorização
@app.get("/api/carteira/{cpf_ou_protocolo}")
def obter_carteira_digital(cpf_ou_protocolo: str, db: Session = Depends(get_db)):
    cpf_limpo = "".join(filter(str.isdigit, cpf_ou_protocolo))
    
    ambulante = db.query(models.Ambulante).filter(
        (models.Ambulante.cpf == cpf_limpo) | 
        (models.Ambulante.numero_autorizacao == cpf_ou_protocolo)
    ).first()
    
    if not ambulante:
        raise HTTPException(status_code=404, detail="Autorização não localizada.")
        
    payload_qr = {
        "numero_autorizacao": ambulante.numero_autorizacao,
        "titular": ambulante.nome,
        "cpf": ambulante.cpf,
        "cnpj": ambulante.cnpj,
        "local": ambulante.local_autorizado,
        "categoria": ambulante.categoria,
        "produtos": ambulante.produtos,
        "observacao": ambulante.observacao_produtos,
        "dias": ambulante.dias_autorizados,
        "horario": ambulante.horario,
        "inicio": ambulante.inicio,
        "termino": ambulante.termino,
        "processo": ambulante.processo_administrativo,
        "status": ambulante.status,
        "secretario": ambulante.secretario,
        "prefeito": ambulante.prefeito,
        "exp": (datetime.datetime.utcnow() + datetime.timedelta(days=365)).timestamp()
    }
    
    token_assinado = jwt.encode(payload_qr, SECRET_KEY_SEMEPP, algorithm="HS256")
    
    return {
        "status": ambulante.status,
        "protocolo": ambulante.numero_autorizacao,
        "titular": ambulante.nome,
        "cpf": ambulante.cpf,
        "cnpj": ambulante.cnpj,
        "ponto_autorizado": ambulante.local_autorizado,
        "categoria": ambulante.categoria,
        "produtos": ambulante.produtos,
        "observacao": ambulante.observacao_produtos,
        "dias_autorizados": ambulante.dias_autorizados,
        "horario": ambulante.horario,
        "inicio": ambulante.inicio,
        "validade": ambulante.termino,
        "processo_administrativo": ambulante.processo_administrativo,
        "secretario": ambulante.secretario,
        "prefeito": ambulante.prefeito,
        "qr_token": token_assinado
    }

# Endpoint POST para Login de Fiscal de Posturas
@app.post("/api/fiscal/login")
def fiscal_login(req: FiscalLoginRequest):
    if req.usuario == "fiscal" and req.senha == "sorocaba2026":
        return {
            "status": "sucesso",
            "token": "SOROCABA_FISCAL_SECURE_TOKEN_2026",
            "fiscal_nome": "Carlos Eduardo"
        }
    raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")

# Endpoint GET para busca de permissionários cadastrados no SQLite
@app.get("/api/fiscal/busca")
def fiscal_busca(query: str = "", db: Session = Depends(get_db)):
    query_limpa = "".join(filter(str.isdigit, query))
    
    if query_limpa:
        # Se contiver números, busca por CPF ou número de Autorização (TAU)
        resultados = db.query(models.Ambulante).filter(
            (models.Ambulante.cpf.like(f"%{query_limpa}%")) |
            (models.Ambulante.numero_autorizacao.like(f"%{query}%"))
        ).all()
    else:
        # Senão, busca por correspondência aproximada no Nome
        resultados = db.query(models.Ambulante).filter(
            models.Ambulante.nome.like(f"%{query}%")
        ).all()
        
    return {
        "resultados": [
            {
                "id": a.id,
                "nome": a.nome,
                "cpf": a.cpf,
                "cnpj": a.cnpj,
                "numero_autorizacao": a.numero_autorizacao,
                "local_autorizado": a.local_autorizado,
                "categoria": a.categoria,
                "produtos": a.produtos,
                "observacao_produtos": a.observacao_produtos,
                "dias_autorizados": a.dias_autorizados,
                "horario": a.horario,
                "inicio": a.inicio,
                "termino": a.termino,
                "processo_administrativo": a.processo_administrativo,
                "status": a.status,
                "secretario": a.secretario,
                "prefeito": a.prefeito
            }
            for a in resultados
        ]
    }

# Validação do Token do QR Code do Permissionário
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