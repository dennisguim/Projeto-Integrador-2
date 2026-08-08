document.addEventListener('DOMContentLoaded', () => {
  carregarCarteiraDigital();
});

async function carregarCarteiraDigital() {
  const PROTOCOLO_DEMO = "AMB-2026/0482";
  
  try {
    // Tenta buscar dados atualizados do backend
    const response = await fetch(`http://localhost:8000/api/carteira/${PROTOCOLO_DEMO}`);
    if (!response.ok) throw new Error("Falha ao buscar dados do servidor");

    const dados = await response.json();

    // Atualiza a tela
    renderizarDados(dados);

    // Salva no Cache Local (Offline-First)
    localStorage.setItem("carteira_cache", JSON.stringify(dados));

  } catch (error) {
    console.warn("Sem conexão com o servidor. Carregando dados do Cache Offline...", error);

    // Busca do Cache Local se estiver Offline
    const dadosSalvos = localStorage.getItem("carteira_cache");
    if (dadosSalvos) {
      const dadosCache = JSON.parse(dadosSalvos);
      renderizarDados(dadosCache);
      alert("Você está visualizando sua carteira salva em modo Offline.");
    } else {
      // Fallback inicial padrão
      const fallback = {
        status: "Autorização Definitiva Ativa",
        protocolo: "AMB-2026/0482",
        titular: "João Carlos da Silva",
        cpf: "123.456.789-00",
        ponto_autorizado: "Praça Coronel Fernando Prestes - Centro",
        equipamento: "Carrinho de Pipoca (2,00m x 2,00m)",
        validade: "31/12/2026",
        qr_token: "SOROCABA_OFFLINE_TOKEN_DEMO_2026"
      };
      renderizarDados(fallback);
    }
  }
}

function renderizarDados(dados) {
  document.getElementById('cnh-protocolo').innerText = dados.protocolo;
  document.getElementById('cnh-titular').innerText = dados.titular;
  document.getElementById('cnh-cpf').innerText = dados.cpf;
  document.getElementById('cnh-ponto').innerText = dados.ponto_autorizado;
  document.getElementById('cnh-equipamento').innerText = dados.equipamento;
  document.getElementById('cnh-validade').innerText = dados.validade;

  // Limpa e gera novo QR Code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';

  new QRCode(qrContainer, {
    text: dados.qr_token,
    width: 160,
    height: 160,
    colorDark : "#0f172a",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}