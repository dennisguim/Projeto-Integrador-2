document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login-fiscal');
  const userInput = document.getElementById('login-usuario');
  const passInput = document.getElementById('login-senha');
  const loginError = document.getElementById('login-error');

  const loginContainer = document.getElementById('login-fiscal-container');
  const fiscalPanel = document.getElementById('fiscal-panel');
  const btnLogoutFiscal = document.getElementById('btn-logout-fiscal');

  const formBusca = document.getElementById('form-busca-ambulante');
  const buscaInput = document.getElementById('busca-input');
  const resultadosContainer = document.getElementById('resultados-busca-container');

  const modal = document.getElementById('modal-licenca');
  const formVistoria = document.getElementById('form-vistoria');
  const vistoriaMsg = document.getElementById('vistoria-msg');

  const ICONE_OK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  const ICONE_ERRO = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  const ICONE_SEM_CAMERA = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"></path><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v3.5"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path></svg>`;

  let leitor = null;

  const formatarCpf = (cpf) => String(cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  if (sessionStorage.getItem('fiscal_token')) {
    exibirPainelFiscal();
  }

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    try {
      const response = await apiFetch('/api/fiscal/login', {
        method: 'POST',
        dados: { usuario: userInput.value, senha: passInput.value }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(mensagemErro(response, data, 'Erro ao realizar login.'));
      }

      sessionStorage.setItem('fiscal_token', data.token);
      sessionStorage.setItem('fiscal_nome', data.fiscal_nome);
      passInput.value = '';

      exibirPainelFiscal();
    } catch (err) {
      loginError.textContent = err instanceof TypeError ? 'Servidor indisponível no momento.' : err.message;
      loginError.style.display = 'block';
    }
  });

  btnLogoutFiscal.addEventListener('click', encerrarSessao);

  function encerrarSessao() {
    sessionStorage.removeItem('fiscal_token');
    sessionStorage.removeItem('fiscal_nome');

    if (leitor) {
      leitor.stop().catch(() => {});
      leitor = null;
    }

    modal.classList.remove('active');
    fiscalPanel.classList.add('hidden');
    btnLogoutFiscal.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    resultadosContainer.style.display = 'none';
    resultadosContainer.innerHTML = '';

    userInput.value = '';
    passInput.value = '';
  }

  // token vencido ou inválido derruba a sessão e volta para o login
  function sessaoExpirada(response) {
    if (response.status !== 401) return false;
    encerrarSessao();
    loginError.textContent = 'Sessão expirada. Entre novamente.';
    loginError.style.display = 'block';
    return true;
  }

  function exibirPainelFiscal() {
    loginContainer.classList.add('hidden');
    fiscalPanel.classList.remove('hidden');
    btnLogoutFiscal.classList.remove('hidden');
    document.getElementById('f-fiscal').value = sessionStorage.getItem('fiscal_nome') || '';

    iniciarLeitorQRCode();
  }

  formBusca.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = buscaInput.value.trim();
    if (query.length < 2) return;

    try {
      const response = await apiFetch(`/api/fiscal/busca?query=${encodeURIComponent(query)}`, { fiscal: true });
      if (sessaoExpirada(response)) return;
      const data = await response.json();

      resultadosContainer.innerHTML = '';
      resultadosContainer.style.display = 'flex';

      if (!response.ok || !data.resultados || data.resultados.length === 0) {
        const vazio = document.createElement('div');
        vazio.className = 'search-vazio';
        vazio.textContent = response.ok
          ? 'Nenhum permissionário encontrado com o termo digitado.'
          : mensagemErro(response, data, 'Não foi possível concluir a busca.');
        resultadosContainer.appendChild(vazio);
        return;
      }

      data.resultados.forEach((item) => {
        const ativo = String(item.status).toLowerCase() === 'ativo';
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
          <div>
            <strong>${esc(item.nome)}</strong>
            <small>CPF: ${esc(formatarCpf(item.cpf))} | TAU: ${esc(item.numero_autorizacao)}</small>
          </div>
          <span class="badge badge-mini ${ativo ? 'badge-apto' : 'badge-inapto'}">${esc(item.status)}</span>
        `;
        div.addEventListener('click', () => abrirModalDetalhes(item));
        resultadosContainer.appendChild(div);
      });
    } catch (err) {
      resultadosContainer.innerHTML = '<div class="search-vazio">Servidor indisponível no momento.</div>';
      resultadosContainer.style.display = 'flex';
    }
  });

  function preencher(id, valor) {
    document.getElementById(id).textContent = valor || '-';
  }

  async function abrirModalDetalhes(item) {
    modal.classList.add('active');

    preencher('modal-protocolo', item.numero_autorizacao);
    preencher('modal-categoria', item.categoria);
    preencher('modal-titular', item.nome);
    preencher('modal-cpf', formatarCpf(item.cpf));
    preencher('modal-cnpj', item.cnpj);
    preencher('modal-ponto', item.local_autorizado);
    preencher('modal-produtos', item.produtos);

    const obsBox = document.getElementById('modal-observacao-box');
    if (item.observacao_produtos && item.observacao_produtos !== 'N/A') {
      preencher('modal-observacao', item.observacao_produtos);
      obsBox.style.display = 'flex';
    } else {
      obsBox.style.display = 'none';
    }

    preencher('modal-dias', item.dias_autorizados);
    preencher('modal-horario', item.horario);
    preencher('modal-inicio', item.inicio);
    preencher('modal-validade', item.termino);
    preencher('modal-processo', item.processo_administrativo);
    preencher('modal-secretario', item.secretario);
    preencher('modal-prefeito', item.prefeito);

    const badge = document.getElementById('modal-status');
    const ativo = String(item.status).toLowerCase() === 'ativo';
    badge.textContent = item.status;
    badge.className = 'status-badge ' + (ativo ? 'status-apto' : 'status-inapto');

    document.getElementById('f-protocolo').value = item.numero_autorizacao;

    const qrContainer = document.getElementById('modal-qrcode');
    qrContainer.innerHTML = '';

    try {
      const resp = await apiFetch(`/api/carteira/${encodeURIComponent(item.cpf)}`, { fiscal: true });
      if (sessaoExpirada(resp)) return;
      if (!resp.ok) throw new Error('falha');
      const info = await resp.json();

      new QRCode(qrContainer, {
        text: info.qr_token,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch (err) {
      qrContainer.textContent = 'Não foi possível gerar o QR Code de validação.';
    }
  }

  document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.classList.remove('active'));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });

  function iniciarLeitorQRCode() {
    if (leitor) return;
    try {
      if (typeof Html5Qrcode === 'undefined') {
        throw new Error('Biblioteca de leitura de QR Code não carregada.');
      }

      leitor = new Html5Qrcode('reader');
      leitor.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        onScanSuccess,
        () => {}
      ).catch((err) => {
        console.warn('Câmera indisponível neste dispositivo.', err);
        leitor = null;
        exibirMensagemSemCamera();
      });
    } catch (err) {
      console.warn('Erro ao iniciar o leitor de QR Code:', err);
      leitor = null;
      exibirMensagemSemCamera();
    }
  }

  function exibirMensagemSemCamera() {
    document.getElementById('reader').innerHTML = `<div class="reader-vazio">${ICONE_SEM_CAMERA} Câmera indisponível. Abra esta página no celular para ler o QR Code.</div>`;
  }

  let ultimoQr = '';

  async function onScanSuccess(decodedText) {
    // a câmera dispara o mesmo código várias vezes por segundo
    if (decodedText === ultimoQr) return;
    ultimoQr = decodedText;
    setTimeout(() => { ultimoQr = ''; }, 5000);

    const resBox = document.getElementById('qr-result');
    const resTitle = document.getElementById('qr-result-title');
    const resDesc = document.getElementById('qr-result-desc');

    resBox.style.display = 'block';

    try {
      const response = await apiFetch('/api/fiscal/validar-qr', {
        method: 'POST',
        fiscal: true,
        dados: { token: decodedText }
      });
      if (sessaoExpirada(response)) return;
      const data = await response.json();

      if (!response.ok || !data.valido) {
        throw new Error(mensagemErro(response, data, 'Licença inválida.'));
      }

      resBox.className = 'result-box result-success';
      resTitle.innerHTML = `${ICONE_OK}<span>${esc(data.mensagem)}</span>`;
      resDesc.textContent = `Titular: ${data.dados.titular} | Categoria: ${data.dados.categoria} | Ponto: ${data.dados.local}`;
      document.getElementById('f-protocolo').value = data.dados.numero_autorizacao;
    } catch (err) {
      resBox.className = 'result-box result-error';
      resTitle.innerHTML = `${ICONE_ERRO}<span>QR Code inválido ou adulterado</span>`;
      resDesc.textContent = err instanceof TypeError ? 'Servidor indisponível no momento.' : err.message;
    }
  }

  function avisoVistoria(ok, texto) {
    vistoriaMsg.className = 'result-box ' + (ok ? 'result-success' : 'result-error');
    vistoriaMsg.querySelector('p').textContent = texto;
    vistoriaMsg.style.display = 'block';
  }

  formVistoria.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      protocolo: document.getElementById('f-protocolo').value.trim(),
      fiscal_nome: document.getElementById('f-fiscal').value,
      largura_calcada: parseFloat(document.getElementById('f-calcada').value),
      faixa_livre_ok: document.getElementById('f-faixa-livre').checked,
      equipamento_ok: document.getElementById('f-equipamento').checked,
      observacoes: document.getElementById('f-obs').value
    };

    try {
      const response = await apiFetch('/api/fiscal/vistoria', { method: 'POST', fiscal: true, dados: payload });
      if (sessaoExpirada(response)) return;
      const res = await response.json();

      if (!response.ok) {
        avisoVistoria(false, mensagemErro(response, res, 'Não foi possível salvar a vistoria.'));
        return;
      }

      avisoVistoria(true, res.mensagem);
      formVistoria.reset();
      document.getElementById('f-fiscal').value = sessionStorage.getItem('fiscal_nome') || '';
    } catch (err) {
      avisoVistoria(false, 'Servidor indisponível. A vistoria não foi salva; tente novamente.');
    }
  });
});
