# Sistema de Consulta de Viabilidade Urbanistica de Sorocaba

Plataforma web para verificar a viabilidade de instalação de comércio ambulante e estabelecimentos fixos no município de Sorocaba/SP, com base no Plano Diretor (Lei Municipal nº 13.123/2025) e na tabela de atividades do Decreto Municipal nº 30.529/2025.

---

## O que o projeto faz

Este sistema permite consultar se determinado endereço ou local no mapa de Sorocaba permite o funcionamento de uma atividade comercial (CNAE), informando se o ponto é Apto, Inapto ou se necessita de Vistoria Técnica.

Principais recursos:

- Consulta por endereço ou por clique direto no mapa de Sorocaba.
- Busca por código CNAE ou pelo nome da atividade comercial.
- Sugestão automática de ruas e locais da cidade com tolerância a erros de digitação.
- Alternância entre tema claro e escuro.
- Módulo de carteira digital do ambulante com validação de QR Code.
- Glossário com os termos e regras das leis municipais.

---

## Como o sistema funciona

1. O usuário seleciona a atividade comercial (CNAE) e informa o endereço ou clica no mapa.
2. O sistema envia a coordenada de latitude e longitude para a API em Python.
3. A API cruza a coordenada com o mapa georreferenciado de zoneamento urbano da cidade (arquivo GeoJSON).
4. O sistema verifica as regras do Decreto 30.529/2025 para a zona e a atividade selecionada e exibe o parecer final na tela.

---

## Tecnologias utilizadas

- Backend: Python 3.10, FastAPI, Shapely e Uvicorn.
- Frontend: HTML5, CSS3 e JavaScript.
- Mapas e geocodificação: Leaflet.js e Photon API (OpenStreetMap).

---

## Como rodar o projeto localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/Projeto-Integrador-2.git
cd Projeto-Integrador-2
```

### 2. Configurar e rodar o backend (FastAPI)

Criar o ambiente virtual e instalar as dependências:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Iniciar o servidor da API:

```bash
uvicorn backend.main:app --reload --port 8000
```

O backend estará ativo em `http://localhost:8000`.

### 3. Rodar o frontend

Em outro terminal, inicie um servidor web simples para a pasta do frontend:

```bash
python3 -m http.server 5500 --directory frontend
```

Abra o navegador no endereço `http://localhost:5500`.

---

## Estrutura de arquivos

- `backend/main.py`: Código da API REST e cálculo de viabilidade espacial.
- `data/sorocaba_zoneamento.geojson`: Polígonos de zoneamento urbano de Sorocaba.
- `data/cnae_decreto_30529.json`: Base de dados com os 1.334 CNAEs do Decreto 30.529/2025.
- `frontend/index.html`: Página inicial da plataforma.
- `frontend/consulta.html`: Tela de consulta no mapa.
- `frontend/carteira.html`: Tela da carteira digital.
- `frontend/Fiscal.html`: Área de fiscalização e leitura de QR Code.
- `frontend/glossario.html`: Tela com os termos legais e decretos.

---

## Projeto Integrador

Trabalho desenvolvido para a disciplina de Projeto Integrador em Computação II do curso de Engenharia / Bacharelado em Computação da Universidade Virtual do Estado de São Paulo (UNIVESP).
