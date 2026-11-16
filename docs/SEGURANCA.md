# Relatório de testes de segurança

**Sistema:** Consulta Sorocaba (consulta de viabilidade urbanística)
**Data da avaliação:** 24/10/2026
**Versão avaliada:** API 1.5.0 (branch `main`)
**Responsáveis:** equipe do Projeto Integrador em Computação II (PJI240), UNIVESP

Este documento registra como a segurança do sistema foi testada, o que foi encontrado, o que foi corrigido e o que ainda precisa ser feito antes de um uso em produção pela prefeitura. Os testes estão no repositório (`tests/seguranca/`) e podem ser repetidos a qualquer momento.

---

## 1. Objetivo e escopo

O objetivo foi verificar se a API resiste aos abusos mais comuns em sistemas públicos na internet e mapear o que falta para uma implantação real.

**Dentro do escopo:**

- API em FastAPI (`backend/`): todas as rotas, validação de entrada, autenticação, sessão e regras de negócio do parecer.
- Dependências Python (`backend/requirements.txt`) e do build do frontend (`package.json`).
- Frontend (`frontend/`): fluxos de consulta, carteira digital e fiscalização, verificados no navegador.

**Fora do escopo:**

- Infraestrutura de hospedagem (servidor, rede, TLS, firewall), que ainda não existe.
- Serviços de terceiros usados pelo frontend (OpenStreetMap, Photon, Nominatim, IBGE, VLibras).
- Ataques de negação de serviço em volume (DDoS), engenharia social e acesso físico.

---

## 2. Metodologia

A avaliação combinou cinco técnicas. Cada uma cobre o que a outra não enxerga.

| Etapa | Técnica | Ferramenta | O que procura |
| --- | --- | --- | --- |
| 1 | Revisão manual de código | leitura guiada pelo OWASP Top 10 (2021) | falhas de lógica, confiança indevida no navegador, controle de acesso |
| 2 | Análise estática (SAST) | `bandit` 1.9 | padrões perigosos no código Python (`eval`, SQL montado com texto, criptografia fraca, segredos no código) |
| 3 | Análise de dependências (SCA) | `pip-audit` 2.10 e `npm audit` | bibliotecas com vulnerabilidades públicas (CVE/GHSA) |
| 4 | Testes dinâmicos (DAST) | `tests/seguranca/regressao_api.py` e `tests/seguranca/ataques.py` | o comportamento real da API sob ataque, com o servidor rodando |
| 5 | Teste funcional | navegador automatizado (Playwright) | confirmar que as proteções não quebraram o uso normal das telas |

**Princípio adotado:** o servidor não confia em nada que vem do navegador. Todo dado recebido é tratado como potencialmente manipulado, porque qualquer pessoa pode enviar requisições à API sem usar as telas do sistema.

**Como os testes dinâmicos funcionam:** cada script sobe uma cópia isolada da API na porta 8010, com banco de dados temporário, para não interferir no ambiente de desenvolvimento. Na simulação de ataques, a API é reiniciada antes de cada caso e o teste confere três momentos: um navegador comum é atendido antes, o ataque é recusado, e depois disso o mesmo endereço IP continua bloqueado mesmo usando um navegador comum.

---

## 3. Resultados

| Etapa | Resultado |
| --- | --- |
| Revisão manual | 9 falhas encontradas, todas corrigidas (seção 4) |
| Análise estática (`bandit`) | nenhum problema encontrado em 1.067 linhas |
| Dependências Python (`pip-audit`) | 22 vulnerabilidades conhecidas (15 no PyJWT 2.8.0 e 7 no Starlette 0.36.3); corrigidas atualizando as versões; nova verificação sem nenhuma pendência |
| Dependências npm (`npm audit`) | 1 vulnerabilidade moderada (`fast-uri`); corrigida com `npm audit fix` |
| Regressão de segurança da API | 31 de 31 verificações passaram |
| Simulação de ataques | 27 de 27 verificações passaram |
| Teste funcional das telas | consulta, link compartilhado, área do fiscal (busca, QR, vistoria) e carteira funcionando, sem erros no console |

### 3.1 O que a simulação de ataques cobre

| Categoria | Casos testados | Reação esperada e obtida |
| --- | --- | --- |
| Ferramentas de varredura | sqlmap, Nikto, Nuclei, ffuf, Nmap, WPScan, gobuster, masscan e requisição sem User-Agent | recusa (403) e bloqueio do IP por 15 min |
| Sondagem de arquivos sensíveis | `/.env`, `/.git/config`, `/wp-login.php`, `/phpmyadmin/`, `/backup.zip`, `/actuator/health`, travessia `../../etc/passwd` | recusa (403) e bloqueio do IP |
| Injeção na URL | SQL injection (UNION e por tempo), XSS refletido, Log4Shell (`${jndi:}`), travessia de diretório | recusa (403) e bloqueio do IP |
| Varredura de diretórios | 15 rotas inexistentes em sequência | bloqueio do IP a partir da seguinte |
| Força bruta de senha | 5 senhas erradas no login do fiscal; 5 datas de nascimento erradas na carteira | trava de 15 min (429), inclusive para a senha correta |
| Excesso de requisições | 125 requisições em menos de 1 min | 429 a partir da 121ª |

### 3.2 O que a regressão de segurança cobre

| Tema | Verificações |
| --- | --- |
| CSRF e origem | escrita sem token, com token adulterado e vinda de outro site são recusadas; CORS liberado só para o frontend |
| Confiança no navegador | o nome da rua não altera a zona; ponto fora de Sorocaba, campo desconhecido, valor fora da lista e coordenada `NaN` são recusados; caracteres de controle são removidos; corpo acima de 16 KB é recusado |
| Protocolo da consulta | código com 64 bits aleatórios; formato inválido recusado |
| Autenticação | rotas do fiscal exigem login; token falso recusado; curinga `%` na busca não expõe o cadastro |
| QR Code | QR legítimo aceito com CPF mascarado; QR de autorização cassada ou vencida recusado; token de sessão e token de QR não se confundem |
| Exposição de informação | cabeçalhos de segurança presentes; `/docs` desligado; `robots.txt` bloqueando indexação da API |

---

## 4. Falhas encontradas e corrigidas

| # | Falha | Gravidade | Correção |
| --- | --- | --- | --- |
| 1 | O endereço digitado no navegador decidia a zona. Clicando num ponto de zona residencial (ZR1) e enviando "Avenida Itavuvu", a API respondia **Apto**, com protocolo válido. | Alta | A zona é decidida pela coordenada. O nome da via só é usado quando o ponto fica fora dos polígonos e a menos de ~450 m de um corredor da mesma sigla. |
| 2 | Pontos fora do município recebiam "Zona Central / Apto". | Alta | Pontos fora da área de Sorocaba são recusados; ponto sem zona mapeada recebe "Necessita de Vistoria". |
| 3 | Dependências com vulnerabilidades públicas (PyJWT 2.8.0, Starlette 0.36.3). | Alta | Atualização para FastAPI 0.162, Starlette 1.10 e PyJWT 2.15. |
| 4 | QR Code continuava válido por 1 ano mesmo com a autorização vencida ou cassada. | Média | Validade limitada ao término da autorização; a validação consulta a situação atual no cadastro. |
| 5 | Código da consulta sequencial (0001, 0002…), permitindo ler endereços consultados por outras pessoas. | Média | Sufixo aleatório de 64 bits. |
| 6 | Coordenada `NaN` derrubava a resposta de erro (500), e as mensagens de erro devolviam o valor enviado. | Média | Tratamento próprio de erros de validação, sem repetir os dados recebidos. |
| 7 | Campos desconhecidos eram ignorados em silêncio; caracteres de controle e invisíveis eram gravados no banco. | Baixa | Campos extras recusados; texto limpo antes de gravar; CPF validado no formato. |
| 8 | Nome do fiscal na vistoria vinha do formulário. | Baixa | O nome vem do token de login. |
| 9 | Token de sessão do fiscal e token do QR assinados com a mesma chave, sem distinção. | Baixa | Cada token tem seu próprio público (`aud`) e não serve no lugar do outro. |

Estas correções se somam às proteções já implantadas anteriormente: CSRF, limite de requisições, CORS restrito, login do fiscal com senha em hash (PBKDF2) e token assinado, bloqueio de varreduras, trava contra força bruta, escape de dados no frontend contra XSS e integridade (SRI) nas bibliotecas de CDN.

---

## 5. Riscos que permanecem

Os itens abaixo não são falhas de código. São limitações do protótipo acadêmico que precisam ser resolvidas antes de qualquer uso pela prefeitura.

| Risco | Por que importa | Recomendação |
| --- | --- | --- |
| Acesso à carteira só com CPF e data de nascimento | data de nascimento é fácil de descobrir; a trava de força bruta só reduz o abuso | senha própria ou código enviado por SMS/e-mail; integrar ao login do gov.br |
| Um único usuário de fiscal, configurado por variável de ambiente | não há como saber qual fiscal fez cada ação, nem desligar um fiscal sem afetar os outros | contas individuais em banco de dados, com perfil de acesso e autenticação em dois fatores |
| Sessão do fiscal não é revogável antes de 8 h | um token vazado continua valendo até expirar | lista de revogação ou sessões no servidor; prazo menor |
| Bloqueios e limites ficam na memória do processo | somem ao reiniciar e não funcionam com vários servidores ou atrás de proxy | mover para o proxy reverso/WAF ou para um Redis compartilhado; configurar o IP real do cliente vindo do proxy |
| Vistorias não são gravadas | não há trilha de auditoria da fiscalização | persistir vistorias com data, fiscal e IP |
| O banco é apagado e repovoado a cada inicialização | adequado para demonstração, inaceitável em produção | remover a carga de dados de teste e usar banco gerenciado (PostgreSQL) com backup |
| CPF e dados pessoais em SQLite sem criptografia | dados pessoais sujeitos à LGPD | criptografia em repouso, controle de acesso ao arquivo, política de retenção e registro de tratamento conforme a LGPD |
| Laudo em PDF é montado pela página | quem quiser pode editar o HTML antes de imprimir | a prova válida é o código do protocolo, conferido na API; considerar PDF assinado pelo servidor |
| Frontend servido sem cabeçalhos de segurança | o servidor estático de desenvolvimento não envia CSP, HSTS etc. | publicar `dist/` em servidor web (Nginx) com HTTPS, HSTS e Content-Security-Policy |
| Script do VLibras carregado sem verificação de integridade | o arquivo muda com frequência no servidor do governo | aceitar o risco (fonte oficial) ou hospedar uma cópia verificada |

---

## 6. Como repetir os testes

Na raiz do projeto, com o ambiente virtual ativo e as dependências instaladas (`pip install -r backend/requirements.txt`):

```bash
python tests/seguranca/regressao_api.py
python tests/seguranca/ataques.py
```

Os scripts usam só a biblioteca padrão do Python além das dependências do backend. Cada um sobe sua própria cópia da API (porta 8010) e devolve código de saída diferente de zero se alguma verificação falhar, o que permite usá-los em integração contínua.

Verificação de dependências (instalar as ferramentas à parte):

```bash
pip install pip-audit bandit
pip-audit -r backend/requirements.txt
bandit -r backend
npm audit
```

**Recomendação:** repetir os testes a cada alteração no backend e rodar o `pip-audit` pelo menos uma vez por mês, porque vulnerabilidades novas são publicadas em bibliotecas que hoje estão limpas.

---

## 7. Antes de colocar em produção

Lista mínima, em ordem de prioridade:

1. Resolver os riscos da seção 5 marcados como autenticação (carteira e fiscal).
2. HTTPS obrigatório, com HSTS, atrás de proxy reverso com WAF.
3. Definir `SECRET_KEY`, `ALLOWED_ORIGINS`, `FISCAL_USUARIO` e `FISCAL_SENHA_HASH` no ambiente, nunca no código.
4. Banco de produção com backup, sem a carga de dados de teste.
5. Adequação à LGPD: base legal, encarregado de dados e política de privacidade publicada.
6. Teste de invasão (pentest) por equipe independente antes da abertura ao público.
