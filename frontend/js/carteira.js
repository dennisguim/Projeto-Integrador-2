document.addEventListener('DOMContentLoaded', () => {
  const formAcesso = document.getElementById('form-acesso');
  const cpfInput = document.getElementById('acesso-cpf');
  const nascInput = document.getElementById('acesso-nascimento');
  const btnLogout = document.getElementById('btn-logout');
  
  const acessoContainer = document.getElementById('acesso-container');
  const carteiraContainer = document.getElementById('carteira-card-container');
  const errorDiv = document.getElementById('acesso-error');

  // Máscara de Formatação do CPF (000.000.000-00)
  cpfInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    e.target.value = value;
  });

  // Máscara de Formatação da Data de Nascimento (DD/MM/AAAA)
  nascInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    e.target.value = value;
  });

  // Verificar se já possui uma sessão ativa
  const dadosSalvos = sessionStorage.getItem('carteira_dados') || localStorage.getItem('carteira_cache');
  if (dadosSalvos) {
    exibirCarteira(JSON.parse(dadosSalvos));
  }

  // Evento de Login/Acesso
  formAcesso.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    
    const cpf = cpfInput.value;
    const nascimento = nascInput.value;

    try {
      const response = await fetch('http://localhost:8000/api/carteira/acesso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf, data_nascimento: nascimento })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Falha ao autenticar.');
      }

      // Salva os dados na sessão ativa e no cache offline
      sessionStorage.setItem('carteira_dados', JSON.stringify(result.dados));
      localStorage.setItem('carteira_cache', JSON.stringify(result.dados));

      exibirCarteira(result.dados);

    } catch (err) {
      errorDiv.innerText = err.message;
      errorDiv.style.display = 'block';
    }
  });

  // Evento de Logout (Sair)
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('carteira_dados');
    localStorage.removeItem('carteira_cache');
    
    // Reseta tela
    carteiraContainer.style.display = 'none';
    btnLogout.style.display = 'none';
    acessoContainer.style.display = 'block';
    
    // Limpa campos
    cpfInput.value = '';
    nascInput.value = '';
  });

  // Renderizar e Mostrar a Carteira Digital
  function exibirCarteira(dados) {
    // Esconde o Login e exibe o cartão e o logout
    acessoContainer.style.display = 'none';
    carteiraContainer.style.display = 'block';
    btnLogout.style.display = 'block';

    // Popula campos textuais
    document.getElementById('cnh-protocolo').innerText = dados.numero_autorizacao;
    document.getElementById('cnh-categoria').innerText = dados.categoria;
    document.getElementById('cnh-titular').innerText = dados.nome;
    
    // Formata o CPF para exibição
    const cpfFormatado = dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    document.getElementById('cnh-cpf').innerText = cpfFormatado;
    
    document.getElementById('cnh-cnpj').innerText = dados.cnpj;
    document.getElementById('cnh-ponto').innerText = dados.local_autorizado;
    document.getElementById('cnh-produtos').innerText = dados.produtos;
    
    // Trata e exibe Restrição/Observação
    const obsBox = document.getElementById('cnh-observacao-box');
    const obsSpan = document.getElementById('cnh-observacao');
    if (dados.observacao_produtos && dados.observacao_produtos !== 'N/A') {
      obsSpan.innerText = dados.observacao_produtos;
      obsBox.style.display = 'flex';
    } else {
      obsBox.style.display = 'none';
    }

    document.getElementById('cnh-dias').innerText = dados.dias_autorizados;
    document.getElementById('cnh-horario').innerText = dados.horario;
    document.getElementById('cnh-inicio').innerText = dados.inicio;
    document.getElementById('cnh-validade').innerText = dados.termino;
    document.getElementById('cnh-processo').innerText = dados.processo_administrativo;
    document.getElementById('cnh-secretario').innerText = dados.secretario;
    document.getElementById('cnh-prefeito').innerText = dados.prefeito;

    // Trata o Badge de Status
    const badge = document.getElementById('cnh-status');
    badge.innerText = dados.status;
    badge.className = 'status-badge'; // Reset classes
    if (dados.status.toLowerCase() === 'ativo') {
      badge.classList.add('status-apto');
    } else {
      badge.classList.add('status-inapto');
    }

    // Limpa e gera novo QR Code baseado no token criptográfico assinado
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';

    new QRCode(qrContainer, {
      text: dados.qr_token,
      width: 160,
      height: 160,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
});