document.addEventListener('DOMContentLoaded', () => {
  const formAcesso = document.getElementById('form-acesso');
  const cpfInput = document.getElementById('acesso-cpf');
  const nascInput = document.getElementById('acesso-nascimento');
  const btnLogout = document.getElementById('btn-logout');

  const acessoContainer = document.getElementById('acesso-container');
  const carteiraContainer = document.getElementById('carteira-card-container');
  const errorDiv = document.getElementById('acesso-error');

  cpfInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    e.target.value = value;
  });

  nascInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    e.target.value = value;
  });

  // a carteira fica só na sessão da aba: ao fechar o navegador os dados pessoais somem do aparelho
  localStorage.removeItem('carteira_cache');
  const dadosSalvos = sessionStorage.getItem('carteira_dados');
  if (dadosSalvos) {
    try {
      exibirCarteira(JSON.parse(dadosSalvos));
    } catch (e) {
      sessionStorage.removeItem('carteira_dados');
    }
  }

  formAcesso.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    try {
      const response = await apiFetch('/api/carteira/acesso', {
        method: 'POST',
        dados: { cpf: cpfInput.value, data_nascimento: nascInput.value }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(mensagemErro(response, result, 'Não foi possível acessar a carteira.'));
      }

      sessionStorage.setItem('carteira_dados', JSON.stringify(result.dados));
      exibirCarteira(result.dados);
    } catch (err) {
      errorDiv.textContent = err instanceof TypeError ? 'Servidor indisponível no momento.' : err.message;
      errorDiv.style.display = 'block';
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('carteira_dados');

    carteiraContainer.classList.add('hidden');
    btnLogout.classList.add('hidden');
    acessoContainer.classList.remove('hidden');

    cpfInput.value = '';
    nascInput.value = '';
    document.getElementById('qrcode').innerHTML = '';
  });

  function preencher(id, valor) {
    document.getElementById(id).textContent = valor || '-';
  }

  function exibirCarteira(dados) {
    acessoContainer.classList.add('hidden');
    carteiraContainer.classList.remove('hidden');
    btnLogout.classList.remove('hidden');

    preencher('cnh-protocolo', dados.numero_autorizacao);
    preencher('cnh-categoria', dados.categoria);
    preencher('cnh-titular', dados.nome);
    preencher('cnh-cpf', String(dados.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
    preencher('cnh-cnpj', dados.cnpj);
    preencher('cnh-ponto', dados.local_autorizado);
    preencher('cnh-produtos', dados.produtos);

    const obsBox = document.getElementById('cnh-observacao-box');
    if (dados.observacao_produtos && dados.observacao_produtos !== 'N/A') {
      preencher('cnh-observacao', dados.observacao_produtos);
      obsBox.style.display = 'flex';
    } else {
      obsBox.style.display = 'none';
    }

    preencher('cnh-dias', dados.dias_autorizados);
    preencher('cnh-horario', dados.horario);
    preencher('cnh-inicio', dados.inicio);
    preencher('cnh-validade', dados.termino);
    preencher('cnh-processo', dados.processo_administrativo);
    preencher('cnh-secretario', dados.secretario);
    preencher('cnh-prefeito', dados.prefeito);

    const badge = document.getElementById('cnh-status');
    const ativo = String(dados.status).toLowerCase() === 'ativo';
    badge.textContent = dados.status;
    badge.className = 'status-badge ' + (ativo ? 'status-apto' : 'status-inapto');

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';

    new QRCode(qrContainer, {
      text: dados.qr_token,
      width: 180,
      height: 180,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.L
    });
  }
});
