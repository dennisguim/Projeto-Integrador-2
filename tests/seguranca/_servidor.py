"""Sobe uma cópia isolada da API para os testes de segurança.

A cópia roda na porta 8010, com o banco SQLite numa pasta temporária, para não
interferir no servidor de desenvolvimento (porta 8000) nem nos dados locais.
Os bloqueios da API ficam em memória, então reiniciar a cópia zera o estado.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND = os.path.join(RAIZ, "backend")
PORTA = 8010
API = f"http://127.0.0.1:{PORTA}"
ORIGEM = "http://localhost:5500"
NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126"


class Servidor:
    def __init__(self):
        self.pasta = None
        self.processo = None

    @property
    def banco(self):
        return os.path.join(self.pasta, "ambulante.db")

    def iniciar(self):
        self.pasta = tempfile.mkdtemp(prefix="consulta_teste_")
        self.processo = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--app-dir", BACKEND,
             "--host", "127.0.0.1", "--port", str(PORTA), "--log-level", "warning"],
            cwd=self.pasta, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        limite = time.time() + 30
        while time.time() < limite:
            try:
                if requisitar("GET", "/status")[0] == 200:
                    return self
            except OSError:
                pass
            time.sleep(0.3)
        self.parar()
        raise RuntimeError("A API de teste não subiu em 30 s. Rode com o Python do .venv do projeto.")

    def parar(self):
        if self.processo:
            self.processo.terminate()
            try:
                self.processo.wait(10)
            except subprocess.TimeoutExpired:
                self.processo.kill()
            self.processo = None
        if self.pasta:
            shutil.rmtree(self.pasta, ignore_errors=True)
            self.pasta = None

    def reiniciar(self):
        self.parar()
        return self.iniciar()

    def __enter__(self):
        return self.iniciar()

    def __exit__(self, *_):
        self.parar()


def requisitar(metodo, caminho, dados=None, cabecalhos=None, corpo_cru=None, agente=NAVEGADOR):
    """Devolve (status, corpo decodificado, cabeçalhos). Erros HTTP não levantam exceção."""
    cab = {"User-Agent": agente, **(cabecalhos or {})}
    corpo = corpo_cru
    if dados is not None:
        corpo = json.dumps(dados).encode()
        cab["Content-Type"] = "application/json"
    pedido = urllib.request.Request(API + caminho, data=corpo, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(pedido, timeout=15) as resp:
            return resp.status, _decodificar(resp.read()), dict(resp.headers)
    except urllib.error.HTTPError as erro:
        return erro.code, _decodificar(erro.read()), dict(erro.headers)


def _decodificar(bruto):
    try:
        return json.loads(bruto or b"null")
    except ValueError:
        return bruto.decode("utf-8", "replace")


def cabecalhos_escrita():
    """Origem liberada + token CSRF, como o navegador envia."""
    _, dados, _ = requisitar("GET", "/api/csrf")
    return {"Origin": ORIGEM, "X-CSRF-Token": dados["token"]}


class Placar:
    def __init__(self, titulo):
        self.falhas = 0
        self.total = 0
        print(f"\n== {titulo}")

    def conferir(self, nome, condicao, detalhe=""):
        self.total += 1
        if not condicao:
            self.falhas += 1
        print(f"  {'PASSOU' if condicao else 'FALHOU'}  {nome}" + (f"  ({detalhe})" if detalhe != "" else ""), flush=True)

    def encerrar(self):
        print(f"\n{self.total - self.falhas} de {self.total} verificações passaram.")
        return 1 if self.falhas else 0
