"""Testes de regressão de segurança da API.

Cada verificação simula uma tentativa de abuso e confere se a API recusa.
Uso (na raiz do projeto, com o .venv ativo):  python tests/seguranca/regressao_api.py
"""
import json
import sqlite3
import sys

from _servidor import ORIGEM, Placar, Servidor, cabecalhos_escrita, requisitar

ZR1 = {"latitude": -23.525688, "longitude": -47.46016}
CORREDOR = {"latitude": -23.5306, "longitude": -47.4654}


def consulta(**extra):
    return {**CORREDOR, "logradouro": "Av. Antônio Carlos Comitre", "tipo_comercio": "fixo", "cnae": "4721-1/02", **extra}


def main():
    p = Placar("Regressão de segurança da API")
    with Servidor() as srv:
        H = cabecalhos_escrita()

        print("\n-- CSRF e origem")
        p.conferir("escrita sem token CSRF é recusada", requisitar("POST", "/api/viabilidade", consulta(), {"Origin": ORIGEM})[0] == 403)
        p.conferir("escrita vinda de outro site é recusada", requisitar("POST", "/api/viabilidade", consulta(), {**H, "Origin": "http://site-malicioso.example"})[0] == 403)
        token_adulterado = H["X-CSRF-Token"][:-2] + "00"
        p.conferir("token CSRF adulterado é recusado", requisitar("POST", "/api/viabilidade", consulta(), {**H, "X-CSRF-Token": token_adulterado})[0] == 403)
        status, dados, cab = requisitar("POST", "/api/viabilidade", consulta(), H)
        p.conferir("consulta legítima funciona", status == 200, dados.get("parecer") if isinstance(dados, dict) else dados)
        p.conferir("CORS libera só a origem do frontend", cab.get("access-control-allow-origin") == ORIGEM)

        print("\n-- O servidor não confia nos dados do navegador")
        _, d, _ = requisitar("POST", "/api/viabilidade", {**ZR1, "logradouro": "Avenida Itavuvu", "tipo_comercio": "fixo"}, H)
        p.conferir("nome de corredor no endereço não muda a zona do ponto", d.get("zona", "").startswith("ZR1"), d.get("zona"))
        p.conferir("ponto fora de Sorocaba é recusado",
                   requisitar("POST", "/api/viabilidade", consulta(latitude=-22.9, longitude=-43.2), H)[0] == 422)
        p.conferir("campo desconhecido no corpo é recusado", requisitar("POST", "/api/viabilidade", consulta(parecer="Apto"), H)[0] == 422)
        p.conferir("tipo de comércio fora da lista é recusado", requisitar("POST", "/api/viabilidade", consulta(tipo_comercio="x"), H)[0] == 422)
        corpo_nan = json.dumps(consulta()).replace("-23.5306", "NaN").encode()
        status, d, _ = requisitar("POST", "/api/viabilidade", None, {**H, "Content-Type": "application/json"}, corpo_cru=corpo_nan)
        p.conferir("coordenada NaN é recusada sem derrubar a API", status == 422, status)
        p.conferir("erro de validação não devolve o valor enviado", "input" not in json.dumps(d))
        status, d, _ = requisitar("POST", "/api/viabilidade", consulta(logradouro="Rua\x00\x1b  Teste​  10"), H)
        _, salvo, _ = requisitar("GET", f"/api/consulta/{d['codigo_consulta']}")
        p.conferir("caracteres de controle são removidos antes de gravar", salvo["logradouro"] == "Rua Teste 10", repr(salvo["logradouro"]))
        p.conferir("requisição acima de 16 KB é recusada", requisitar("POST", "/api/viabilidade", consulta(logradouro="a" * 20000), H)[0] == 413)

        print("\n-- Protocolo da consulta")
        codigo = d["codigo_consulta"]
        sufixo = codigo.rsplit("-", 1)[-1]
        p.conferir("código tem sufixo aleatório de 64 bits", len(sufixo) == 16 and not sufixo.isdigit(), codigo)
        p.conferir("código em formato inválido é recusado", requisitar("GET", "/api/consulta/CNS-1%27%20OR%20%271%27%3D%271")[0] == 422)

        print("\n-- Autenticação do fiscal")
        p.conferir("dados de ambulante por CPF exigem login", requisitar("GET", "/api/carteira/12345678901")[0] == 401)
        p.conferir("busca de permissionários exige login", requisitar("GET", "/api/fiscal/busca?query=Carlos")[0] == 401)
        p.conferir("token de sessão falso é recusado", requisitar("GET", "/api/fiscal/busca?query=Carlos", cabecalhos={"Authorization": "Bearer abc.def.ghi"})[0] == 401)
        p.conferir("senha errada é recusada", requisitar("POST", "/api/fiscal/login", {"usuario": "fiscal", "senha": "errada"}, H)[0] == 401)
        status, d, _ = requisitar("POST", "/api/fiscal/login", {"usuario": "fiscal", "senha": "sorocaba2026"}, H)
        p.conferir("login correto funciona", status == 200)
        A = {"Authorization": "Bearer " + d["token"]}
        _, d, _ = requisitar("GET", "/api/fiscal/busca?query=%25%25", cabecalhos=A)
        p.conferir("curinga % na busca não lista todo o cadastro", d["resultados"] == [], len(d["resultados"]))

        print("\n-- QR Code da carteira digital")
        p.conferir("CPF com letras é recusado",
                   requisitar("POST", "/api/carteira/acesso", {"cpf": "1234567890a", "data_nascimento": "12/04/1978"}, H)[0] == 422)
        _, d, _ = requisitar("POST", "/api/carteira/acesso", {"cpf": "123.456.789-01", "data_nascimento": "12/04/1978"}, H)
        qr = d["dados"]["qr_token"]
        status, d, _ = requisitar("POST", "/api/fiscal/validar-qr", {"token": qr}, {**H, **A})
        p.conferir("QR legítimo é aceito e traz o CPF mascarado", status == 200 and d["dados"]["cpf"].startswith("***"), d.get("dados", {}).get("cpf"))
        p.conferir("token de sessão não vale como QR", requisitar("POST", "/api/fiscal/validar-qr", {"token": A["Authorization"][7:]}, {**H, **A})[0] == 400)
        p.conferir("QR não vale como sessão de fiscal", requisitar("GET", "/api/fiscal/busca?query=Carlos", cabecalhos={"Authorization": "Bearer " + qr})[0] == 401)

        banco = sqlite3.connect(srv.banco)
        banco.execute("update ambulantes set status='Cassado' where numero_autorizacao='012/2024'")
        banco.commit()
        p.conferir("QR de autorização cassada é recusado", requisitar("POST", "/api/fiscal/validar-qr", {"token": qr}, {**H, **A})[0] == 400)
        banco.execute("update ambulantes set status='Ativo', termino='01/01/2025' where numero_autorizacao='012/2024'")
        banco.commit()
        banco.close()
        p.conferir("QR de autorização vencida é recusado", requisitar("POST", "/api/fiscal/validar-qr", {"token": qr}, {**H, **A})[0] == 400)

        print("\n-- Vistoria")
        vistoria = {"protocolo": "012/2024", "fiscal_nome": "Outra Pessoa", "largura_calcada": 3.5,
                    "faixa_livre_ok": True, "equipamento_ok": True, "observacoes": ""}
        _, d, _ = requisitar("POST", "/api/fiscal/vistoria", vistoria, {**H, **A})
        p.conferir("nome do fiscal vem do login, não do formulário", d.get("fiscal") == "Carlos Eduardo", d.get("fiscal"))

        print("\n-- Exposição de informações")
        status, _, cab = requisitar("GET", "/status")
        p.conferir("cabeçalhos de segurança presentes",
                   cab.get("x-content-type-options") == "nosniff" and cab.get("x-frame-options") == "DENY" and "noindex" in cab.get("x-robots-tag", ""))
        p.conferir("documentação automática (/docs) desligada", requisitar("GET", "/docs")[0] == 404)
        p.conferir("robots.txt da API bloqueia indexação", requisitar("GET", "/robots.txt")[1] == "User-agent: *\nDisallow: /\n")

    return p.encerrar()


if __name__ == "__main__":
    sys.exit(main())
