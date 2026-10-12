import datetime
import hashlib
import hmac
import logging
import os
import re
import secrets
import time
from collections import defaultdict, deque

import jwt
from fastapi import Header, HTTPException, Request
from fastapi.responses import JSONResponse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
log = logging.getLogger("uvicorn.error")


def _carregar_chave():
    chave = os.environ.get("SECRET_KEY")
    if chave:
        return chave
    caminho = os.path.join(BASE_DIR, ".secret_key")
    if os.path.exists(caminho):
        if os.name != "nt" and os.stat(caminho).st_mode & 0o077:
            os.chmod(caminho, 0o600)
        with open(caminho, "r", encoding="utf-8") as f:
            return f.read().strip()
    chave = secrets.token_hex(32)
    # arquivo criado só para o dono; em produção o certo é definir SECRET_KEY no ambiente
    fd = os.open(caminho, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(chave)
    return chave


SECRET_KEY = _carregar_chave()

ORIGENS_PERMITIDAS = [
    o.strip().rstrip("/")
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")
    if o.strip()
]

# usuário de demonstração; em produção definir FISCAL_USUARIO e FISCAL_SENHA_HASH (salt$hash, pbkdf2-sha256)
FISCAL_USUARIO = os.environ.get("FISCAL_USUARIO", "fiscal")
FISCAL_SENHA_HASH = os.environ.get(
    "FISCAL_SENHA_HASH",
    "867c636573f13d2dd4d8ee2b66f24f93$917cadec34be953fe4c12145c3973156580e71bff085736bdd9682f2eee1ef4d",
)
FISCAL_NOME = os.environ.get("FISCAL_NOME", "Carlos Eduardo")
PBKDF2_ITERACOES = 200_000
SESSAO_FISCAL_HORAS = 8

CSRF_VALIDADE = 2 * 60 * 60
METODOS_SEGUROS = {"GET", "HEAD", "OPTIONS"}

JANELA = 60
LIMITE_GERAL = 120
LIMITE_LOGIN = 8
ROTAS_LOGIN = ("/api/fiscal/login", "/api/carteira/acesso")

_acessos = defaultdict(deque)

# ferramentas de varredura e coletores automáticos, identificados pelo User-Agent
AGENTES_BLOQUEADOS = re.compile(
    r"sqlmap|nikto|nmap|masscan|zmap|zgrab|nuclei|wpscan|dirbuster|dirb/|gobuster|feroxbuster|ffuf|fuzz faster|wfuzz|"
    r"acunetix|nessus|openvas|qualys|netsparker|invicti|burp|owasp|zap/|arachni|w3af|skipfish|havij|"
    r"hydra|medusa|metasploit|whatweb|wapiti|jaeles|httpx|commix|joomscan|droopescan|fimap|"
    r"censys|shodan|binaryedge|expanse|internet-measurement|netsystemsresearch|l9explore|leakix|"
    r"ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|ccbot|claudebot|scrapy|httrack|"
    r"libwww-perl|lwp::|winhttp|morfeus|zmeu|pycurl",
    re.IGNORECASE,
)

# caminhos que o sistema não tem e que só aparecem em varreduras
CAMINHOS_ISCA = re.compile(
    r"\.(php\d?|phtml|aspx?|jsp|cgi|env|git|svn|sql|bak|old|ini|log|conf|ya?ml|pem|key|zip|tar|gz|rar|7z|swp)(/|$)|"
    r"/\.(env|git|svn|hg|aws|ssh|docker|vscode|idea|ds_store|htaccess|htpasswd)|"
    r"/(wp-|wordpress|xmlrpc|phpmyadmin|pma|adminer|mysql|cgi-bin|vendor/|actuator|console|solr|jenkins|"
    r"manager/html|server-status|server-info|telescope|_profiler|debug|config\.|backup|shell|webshell|"
    r"boaform|hnap1|owa/|ecp/|autodiscover|remote/login|sdk|setup\.|install|administrator)|"
    r"etc/passwd|win\.ini|\.\./|%2e%2e",
    re.IGNORECASE,
)

# tentativas de injeção na URL
CARGAS_SUSPEITAS = re.compile(
    r"union(\s|\+|%20|/\*)+select|select.+from|sleep\(|benchmark\(|waitfor(\s|\+|%20)+delay|information_schema|"
    r"<script|%3cscript|javascript:|onerror\s*=|\.\.(/|%2f)|%2e%2e|etc/passwd|\$\{jndi:|\{\{.*\}\}|"
    r"cmd=|exec\(|base64_decode|/bin/(ba)?sh|;\s*(cat|ls|id|wget|curl)\b",
    re.IGNORECASE,
)

BLOQUEIO_SEGUNDOS = 15 * 60
LIMITE_404 = 15
_bloqueados = {}
_nao_encontrados = defaultdict(deque)


def _bloquear(ip: str, motivo: str):
    _bloqueados[ip] = time.monotonic() + BLOQUEIO_SEGUNDOS
    log.warning("IP %s bloqueado por %d min: %s", ip, BLOQUEIO_SEGUNDOS // 60, motivo)


def _esta_bloqueado(ip: str) -> bool:
    ate = _bloqueados.get(ip)
    if ate is None:
        return False
    if time.monotonic() > ate:
        del _bloqueados[ip]
        return False
    return True


def _varredura(request: Request):
    agente = request.headers.get("user-agent", "")
    if not agente.strip():
        return "requisição sem User-Agent"
    if AGENTES_BLOQUEADOS.search(agente):
        return f"agente {agente[:60]!r}"
    caminho = request.url.path
    if CAMINHOS_ISCA.search(caminho):
        return f"caminho {caminho[:80]!r}"
    consulta = request.url.query
    if consulta and CARGAS_SUSPEITAS.search(consulta):
        return f"carga na URL {consulta[:80]!r}"
    if request.method not in ("GET", "POST", "OPTIONS", "HEAD"):
        return f"método {request.method}"
    return None


def _registrar_404(ip: str):
    fila = _nao_encontrados[ip]
    agora = time.monotonic()
    while fila and agora - fila[0] > JANELA:
        fila.popleft()
    fila.append(agora)
    if len(fila) >= LIMITE_404:
        fila.clear()
        _bloquear(ip, "muitas rotas inexistentes em sequência")


# força bruta: erros de autenticação contam por IP e por alvo (usuário ou CPF)
TENTATIVAS_JANELA = 15 * 60
TENTATIVAS_IP = 5
TENTATIVAS_ALVO = 10
TRAVA_SEGUNDOS = 15 * 60
_falhas = defaultdict(deque)
_travas = {}


def _chaves_login(request: Request, alvo: str):
    ip = request.client.host if request.client else "desconhecido"
    return (("ip", ip), TENTATIVAS_IP), (("alvo", alvo.strip().lower()[:60]), TENTATIVAS_ALVO)


def verificar_trava(request: Request, alvo: str):
    agora = time.monotonic()
    for chave, _ in _chaves_login(request, alvo):
        ate = _travas.get(chave)
        if ate and ate > agora:
            minutos = int((ate - agora) // 60) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Muitas tentativas incorretas. Tente novamente em {minutos} min.",
                headers={"Retry-After": str(int(ate - agora) + 1)},
            )
        _travas.pop(chave, None)


def registrar_falha(request: Request, alvo: str):
    agora = time.monotonic()
    for chave, limite in _chaves_login(request, alvo):
        fila = _falhas[chave]
        while fila and agora - fila[0] > TENTATIVAS_JANELA:
            fila.popleft()
        fila.append(agora)
        if len(fila) >= limite:
            fila.clear()
            _travas[chave] = agora + TRAVA_SEGUNDOS
            log.warning("Autenticação travada por %d min para %s", TRAVA_SEGUNDOS // 60, chave)


def registrar_sucesso(request: Request, alvo: str):
    for chave, _ in _chaves_login(request, alvo):
        _falhas.pop(chave, None)


def gerar_hash_senha(senha: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt, PBKDF2_ITERACOES)
    return f"{salt.hex()}${digest.hex()}"


def senha_confere(senha: str, armazenado: str) -> bool:
    try:
        salt_hex, hash_hex = armazenado.split("$", 1)
        digest = hashlib.pbkdf2_hmac("sha256", senha.encode(), bytes.fromhex(salt_hex), PBKDF2_ITERACOES)
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), hash_hex)


def autenticar_fiscal(usuario: str, senha: str) -> bool:
    usuario_ok = hmac.compare_digest(usuario.encode(), FISCAL_USUARIO.encode())
    senha_ok = senha_confere(senha, FISCAL_SENHA_HASH)
    return usuario_ok and senha_ok


def emitir_token_fiscal() -> str:
    agora = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": FISCAL_USUARIO,
        "nome": FISCAL_NOME,
        "papel": "fiscal",
        "iat": agora,
        "exp": agora + datetime.timedelta(hours=SESSAO_FISCAL_HORAS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def exigir_fiscal(authorization: str = Header(default="")):
    esquema, _, token = authorization.partition(" ")
    if esquema.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Sessão de fiscal não informada.")
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    if dados.get("papel") != "fiscal":
        raise HTTPException(status_code=403, detail="Acesso restrito à fiscalização.")
    return dados


def _assinar(corpo: str) -> str:
    return hmac.new(SECRET_KEY.encode(), corpo.encode(), hashlib.sha256).hexdigest()


def gerar_csrf() -> str:
    corpo = f"{int(time.time())}.{secrets.token_urlsafe(16)}"
    return f"{corpo}.{_assinar(corpo)}"


def csrf_valido(token: str) -> bool:
    partes = (token or "").split(".")
    if len(partes) != 3:
        return False
    emitido, nonce, assinatura = partes
    if not hmac.compare_digest(assinatura, _assinar(f"{emitido}.{nonce}")):
        return False
    try:
        return 0 <= time.time() - int(emitido) <= CSRF_VALIDADE
    except ValueError:
        return False


def _excedeu_limite(ip: str, caminho: str):
    login = caminho in ROTAS_LOGIN
    limite = LIMITE_LOGIN if login else LIMITE_GERAL
    fila = _acessos[(ip, "login" if login else "geral")]
    agora = time.monotonic()
    while fila and agora - fila[0] > JANELA:
        fila.popleft()
    if len(fila) >= limite:
        return int(JANELA - (agora - fila[0])) + 1
    fila.append(agora)
    if len(_acessos) > 5000:
        for chave in [k for k, v in _acessos.items() if not v or agora - v[-1] > JANELA]:
            del _acessos[chave]
    return 0


def _origem_permitida(request: Request) -> bool:
    origem = request.headers.get("origin")
    if origem:
        return origem.rstrip("/") in ORIGENS_PERMITIDAS
    referer = request.headers.get("referer")
    if referer:
        return any(referer.startswith(o + "/") or referer == o for o in ORIGENS_PERMITIDAS)
    return True


NEGADO = {"detail": "Acesso negado."}


async def protecao(request: Request, call_next):
    ip = request.client.host if request.client else "desconhecido"

    if _esta_bloqueado(ip):
        return JSONResponse(status_code=403, content=NEGADO)
    motivo = _varredura(request)
    if motivo:
        _bloquear(ip, motivo)
        return JSONResponse(status_code=403, content=NEGADO)

    if request.method != "OPTIONS":
        espera = _excedeu_limite(ip, request.url.path)
        if espera:
            return JSONResponse(
                status_code=429,
                content={"detail": "Muitas requisições. Aguarde alguns instantes e tente novamente."},
                headers={"Retry-After": str(espera)},
            )

        if request.method not in METODOS_SEGUROS:
            if not _origem_permitida(request):
                return JSONResponse(status_code=403, content={"detail": "Origem não autorizada."})
            if not csrf_valido(request.headers.get("x-csrf-token", "")):
                return JSONResponse(status_code=403, content={"detail": "Token CSRF ausente ou expirado."})

    response = await call_next(request)
    if response.status_code == 404 and not request.url.path.startswith("/api/"):
        _registrar_404(ip)
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response
