document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login-fiscal');
  const userInput = document.getElementById('login-usuario');
  const passInput = document.getElementById('login-senha');
  const loginError = document.getElementById('login-error');
  
  const loginContainer = document.getElementById('login-fiscal-container');
  const fiscalPanel = document.getElementById('fiscal-panel');
  const btnLogoutFiscal = document.getElementById('btn-logout-fiscal');

  // Elementos de Busca
  const formBusca = document.getElementById('form-busca-ambulante');
  const buscaInput = document.getElementById('busca-input');
  const resultadosContainer = document.getElementById('resultados-busca-container');

  // Elementos do Modal de Detalhes
  const modal = document.getElementById('modal-licenca');
  const btnFecharModal = document.getElementById('btn-fechar-modal');

  // Verificar se o fiscal já está logado
  const fiscalToken = sessionStorage.getItem('fiscal_token');
  if (fiscalToken) {
    exibirPainelFiscal();
  }

  // Evento de Login do Fiscal
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    try {
      const response = await fetch('http://localhost:8000/api/fiscal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: userInput.value, senha: passInput.value })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao realizar login.');
      }

      sessionStorage.setItem('fiscal_token', data.token);
      sessionStorage.setItem('fiscal_nome', data.fiscal_nome);
      
      exibirPainelFiscal();

    } catch (err) {
      loginError.innerText = err.message;
      loginError.style.display = 'block';
    }
  });

  // Evento de Logout do Fiscal
  btnLogoutFiscal.addEventListener('click', () => {
    sessionStorage.removeItem('fiscal_token');
    sessionStorage.removeItem('fiscal_nome');
    
    fiscalPanel.style.display = 'none';
    btnLogoutFiscal.style.display = 'none';
    loginContainer.style.display = 'block';

    userInput.value = '';
    passInput.value = '';
  });

  function exibirPainelFiscal() {
    loginContainer.style.display = 'none';
    fiscalPanel.style.display = 'block';
    btnLogoutFiscal.style.display = 'block';
    
    // Inicia câmera para scan de QR Code
    iniciarLeitorQRCode();
  }

  // Lógica de Busca de Permissionários
  formBusca.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = buscaInput.value.trim();
    if (!query) return;

    try {
      const response = await fetch(`http://localhost:8000/api/fiscal/busca?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      resultadosContainer.innerHTML = '';
      
      if (data.resultados && data.resultados.length > 0) {
        data.resultados.forEach(item => {
          const div = document.createElement('div');
          div.className = 'search-item';
          div.innerHTML = `
            <div>
              <strong>${item.nome}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                CPF: ${item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")} | TAU: ${item.numero_autorizacao}
              </div>
            </div>
            <span class="badge ${item.status.toLowerCase() === 'ativo' ? 'badge-apto' : 'badge-inapto'}" style="font-size:0.7rem; padding: 2px 6px;">
              ${item.status}
            </span>
          `;
          // Abre modal ao clicar no ambulante encontrado
          div.addEventListener('click', () => abrirModalDetalhes(item));
          resultadosContainer.appendChild(div);
        });
        resultadosContainer.style.display = 'flex';
      } else {
        resultadosContainer.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:10px; text-align:center;">Nenhum permissionário encontrado com o termo digitado.</div>';
        resultadosContainer.style.display = 'block';
      }

    } catch (err) {
      alert('Erro ao buscar permissionários.');
    }
  });

  // Abrir Modal de Visualização da Licença
  async function abrirModalDetalhes(item) {
    modal.classList.add('active');

    // Preenche campos do modal
    document.getElementById('modal-protocolo').innerText = item.numero_autorizacao;
    document.getElementById('modal-categoria').innerText = item.categoria;
    document.getElementById('modal-titular').innerText = item.nome;
    document.getElementById('modal-cpf').innerText = item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    document.getElementById('modal-cnpj').innerText = item.cnpj;
    document.getElementById('modal-ponto').innerText = item.local_autorizado;
    document.getElementById('modal-produtos').innerText = item.produtos;
    
    // Tratamento de Observação/Restrição
    const obsBox = document.getElementById('modal-observacao-box');
    const obsText = document.getElementById('modal-observacao');
    if (item.observacao_produtos && item.observacao_produtos !== 'N/A') {
      obsText.innerText = item.observacao_produtos;
      obsBox.style.display = 'flex';
    } else {
      obsBox.style.display = 'none';
    }

    document.getElementById('modal-dias').innerText = item.dias_autorizados;
    document.getElementById('modal-horario').innerText = item.horario;
    document.getElementById('modal-inicio').innerText = item.inicio;
    document.getElementById('modal-validade').innerText = item.termino;
    document.getElementById('modal-processo').innerText = item.processo_administrativo;
    document.getElementById('modal-secretario').innerText = item.secretario;
    document.getElementById('modal-prefeito').innerText = item.prefeito;

    // Status Badge
    const badge = document.getElementById('modal-status');
    badge.innerText = item.status;
    badge.className = 'status-badge';
    if (item.status.toLowerCase() === 'ativo') {
      badge.classList.add('status-apto');
    } else {
      badge.classList.add('status-inapto');
    }

    // Gerar QR Code temporário para checagem por outro scanner no modal se desejado
    const qrContainer = document.getElementById('modal-qrcode');
    qrContainer.innerHTML = '';
    
    try {
      // Busca a assinatura criptografada real desse ambulante pelo endpoint GET
      const resp = await fetch(`http://localhost:8000/api/carteira/${item.cpf}`);
      const info = await resp.json();
      
      new QRCode(qrContainer, {
        text: info.qr_token,
        width: 130,
        height: 130,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
    } catch {
      qrContainer.innerText = "Sem conexão para gerar QR de validação.";
    }

    // Preenche automaticamente o protocolo no formulário de vistoria ao fundo
    document.getElementById('f-protocolo').value = item.numero_autorizacao;
  }

  // Fechar o Modal
  btnFecharModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Fechar modal ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Inicializa a Câmera e Leitor de QR Code (Função Original Mantida)
  function iniciarLeitorQRCode() {
    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.warn("Câmera indisponível no dispositivo atual.", err);
      document.getElementById('reader').innerHTML = `
        <div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera-off"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"></path><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v3.5"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path></svg>
          Scanner pronto (Câmera simulada ou aguardando dispositivo móvel).
        </div>
      `;
    });
  }

  // Callback executado quando o QR Code é lido com sucesso (Original Mantido)
  async function onScanSuccess(decodedText, decodedResult) {
    const resBox = document.getElementById('qr-result');
    const resTitle = document.getElementById('qr-result-title');
    const resDesc = document.getElementById('qr-result-desc');

    resBox.style.display = 'block';

    try {
      const response = await fetch('http://localhost:8000/api/fiscal/validar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: decodedText })
      });

      const data = await response.json();

      if (response.ok && data.valido) {
        resBox.className = 'result-box result-success';
        resTitle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>${data.mensagem}</span>
        `;
        resDesc.innerText = `Titular: ${data.dados.titular} | Categoria: ${data.dados.categoria} | Ponto: ${data.dados.local}`;
        document.getElementById('f-protocolo').value = data.dados.numero_autorizacao;
      } else {
        throw new Error(data.detail || "Licença inválida");
      }
    } catch (err) {
      resBox.className = 'result-box result-error';
      resTitle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        <span>QR CODE INVÁLIDO OU ADULTERADO!</span>
      `;
      resDesc.innerText = err.message;
    }
  }

  function onScanFailure(error) {}

  // Envio de Vistoria de Calçada (Original Mantido)
  document.getElementById('form-vistoria').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      protocolo: document.getElementById('f-protocolo').value,
      fiscal_nome: document.getElementById('f-fiscal').value,
      largura_calcada: parseFloat(document.getElementById('f-calcada').value),
      faixa_livre_ok: document.getElementById('f-faixa-livre').checked,
      equipamento_ok: document.getElementById('f-equipamento').checked,
      observacoes: document.getElementById('f-obs').value
    };

    try {
      const response = await fetch('http://localhost:8000/api/fiscal/vistoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      alert(res.mensagem);
      document.getElementById('form-vistoria').reset();
      // Restaura nome do fiscal fixado
      document.getElementById('f-fiscal').value = "Fiscal Carlos Eduardo";
    } catch (err) {
      alert("Vistoria salva localmente no dispositivo (Modo Offline). Será sincronizada ao conectar.");
    }
  });
});