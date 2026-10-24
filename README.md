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

- Backend: Python 3.11, FastAPI, Shapely, SQLAlchemy e Uvicorn.
- Frontend: HTML5, CSS3 e JavaScript.
- Mapas e geocodificação: Leaflet.js e Photon API (OpenStreetMap).

---

## Como rodar o projeto localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/dennisguim/Projeto-Integrador-2.git
cd Projeto-Integrador-2
```

### 2. Configurar e rodar o backend (FastAPI)

Criar o ambiente virtual e instalar as dependências:

```bash
python3 -m venv .venv
source .venv/bin/activate          # Linux/macOS
.venv\Scripts\Activate.ps1         # Windows (PowerShell)
pip install -r backend/requirements.txt
```

Iniciar o servidor da API:

```bash
cd backend
uvicorn main:app --reload --port 8000 --no-server-header
```

O backend estará ativo em `http://localhost:8000`.

### 3. Rodar o frontend

Em outro terminal, inicie um servidor web simples para a pasta do frontend:

```bash
python3 -m http.server 5500 --directory frontend
```

Abra o navegador no endereço `http://localhost:5500`. Abrir os arquivos direto pelo disco (`file://`) não funciona: a API só aceita requisições vindas das origens liberadas.

### 4. Gerar a versão de publicação (opcional)

```bash
npm install
npm run build
```

O comando cria a pasta `dist/` com o JavaScript ofuscado e o CSS minificado. Em produção publica-se apenas essa pasta.

---

## Segurança

- **CORS e origem**: a API só responde às origens listadas em `ALLOWED_ORIGINS` (padrão: `http://localhost:5500,http://127.0.0.1:5500`).
- **CSRF**: toda requisição de escrita precisa do cabeçalho `X-CSRF-Token`, obtido em `GET /api/csrf` e válido por 2 horas.
- **Limite de requisições**: 120 por minuto por IP; 8 por minuto nas rotas de login.
- **Fiscalização**: o login devolve um token assinado com validade de 8 horas, exigido nas rotas `/api/fiscal/*` e na consulta de carteira por CPF.
- **Varreduras**: ferramentas de scan conhecidas (pelo User-Agent), caminhos típicos de sondagem (`/.env`, `/wp-admin`, `*.php`...) e tentativas de injeção na URL recebem 403 e o IP fica bloqueado por 15 minutos. O `robots.txt` orienta os rastreadores legítimos; quem ignora o arquivo cai nesse bloqueio.
- **Documentação da API** (`/docs`): desligada por padrão. Para ligar em desenvolvimento, `API_DOCS=1`.

Variáveis de ambiente para produção:

| Variável | Uso |
| --- | --- |
| `SECRET_KEY` | Chave de assinatura dos tokens. Sem ela, uma chave é gerada em `backend/.secret_key`. |
| `ALLOWED_ORIGINS` | Endereços do frontend autorizados, separados por vírgula. |
| `FISCAL_USUARIO`, `FISCAL_SENHA_HASH` | Credencial do fiscal. O hash é gerado com `python -c "import security; print(security.gerar_hash_senha('senha'))"` dentro de `backend/`. |

O bloqueio por IP e o limite de requisições ficam em memória, o que atende um único processo. Atrás de proxy reverso ou com vários processos, essa parte deve ir para o proxy/WAF.

### Testes de segurança

A API passou por revisão de código, análise estática, verificação de dependências e simulação de ataques. A metodologia, os resultados, as falhas corrigidas e os riscos que ainda precisam ser tratados antes de uma implantação na prefeitura estão em [`docs/SEGURANCA.md`](docs/SEGURANCA.md).

Para repetir os testes (com o ambiente virtual ativo):

```bash
python tests/seguranca/regressao_api.py   # 31 verificações de validação, autenticação e CSRF
python tests/seguranca/ataques.py         # 27 ataques simulados: scanners, injeção, força bruta
```

Cada script sobe uma cópia isolada da API na porta 8010, com banco temporário, e não interfere no servidor de desenvolvimento.

---

## Estrutura de arquivos

- `backend/main.py`: Código da API REST e cálculo de viabilidade espacial.
- `backend/security.py`: CSRF, limite de requisições, bloqueio de varreduras e autenticação do fiscal.
- `data/sorocaba_zoneamento.geojson`: Polígonos de zoneamento urbano de Sorocaba.
- `data/cnae_decreto_30529.json`: Base de dados com os 1.334 CNAEs do Decreto 30.529/2025.
- `frontend/index.html`: Página inicial da plataforma.
- `frontend/consulta.html`: Tela de consulta no mapa.
- `frontend/carteira.html`: Tela da carteira digital.
- `frontend/Fiscal.html`: Área de fiscalização e leitura de QR Code.
- `frontend/glossario.html`: Tela com os termos legais e decretos.
- `tests/seguranca/`: Testes automatizados de segurança da API.
- `tools/build.js`: Geração da versão de publicação (`dist/`).
- `docs/SEGURANCA.md`: Relatório dos testes de segurança.

---

## Projeto Integrador

Trabalho desenvolvido em grupo para a disciplina de Projeto Integrador em Computação II (PJI240) do Eixo de Computação da Universidade Virtual do Estado de São Paulo (UNIVESP), com foco na Secretaria de Planejamento e Desenvolvimento Urbano de Sorocaba (SEPLAN).

**Orientadora:** Profª. Mayla de Almeida
**Polos:** Sorocaba, Tietê e Itapetininga - SP

### Equipe

O sistema é obra coletiva do grupo. Todos os integrantes participaram do desenvolvimento e são coautores do projeto:

- Anderson Dias Machado
- Dennis Rinaldim Barbosa Guimarães
- Mateus Kenji Sakashita
- Patricia Aparecida Saito Machado
- Roberta Luz Rabelo Pinheiro

O histórico de contribuições de cada integrante pode ser consultado nos commits do repositório.

### Licença

O uso do código segue os termos de [`LICENSE.md`](LICENSE.md). Os direitos autorais pertencem, em conjunto, aos integrantes da equipe listados acima.
