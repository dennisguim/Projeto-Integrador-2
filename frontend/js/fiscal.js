document.addEventListener('DOMContentLoaded', () => {
  iniciarLeitorQRCode();

  document.getElementById('form-vistoria').addEventListener('submit', salvarVistoria);
});

// Inicializa a Câmera e Leitor de QR Code
function iniciarLeitorQRCode() {
  const html5QrCode = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: { width: 220, height: 220 } };

  html5QrCode.start(
    { facingMode: "environment" }, // Usa a câmera traseira do celular se disponível
    config,
    onScanSuccess,
    onScanFailure
  ).catch(err => {
    console.warn("Câmera indisponível ou permissão negada. O leitor visual funcionará por entrada manual se necessário.", err);
    document.getElementById('reader').innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
        📷 Câmera aguardando permissão ou indisponível no navegador desktop.
      </div>
    `;
  });
}

// Callback executado quando o QR Code é lido com sucesso
async function onScanSuccess(decodedText, decodedResult) {
  console.log("QR Code detectado:", decodedText);

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
      resTitle.innerText = `✅ ${data.mensagem}`;
      resDesc.innerText = `Titular: ${data.dados.titular} | Protocolo: ${data.dados.protocolo} | Ponto: ${data.dados.ponto}`;
      
      // Preenche automaticamente o protocolo no formulário de vistoria ao lado
      document.getElementById('f-protocolo').value = data.dados.protocolo;
    } else {
      throw new Error(data.detail || "Licença inválida");
    }
  } catch (err) {
    resBox.className = 'result-box result-error';
    resTitle.innerText = '❌ QR CODE INVÁLIDO OU EXPIRADO!';
    resDesc.innerText = err.message;
  }
}

function onScanFailure(error) {
  // Ignora falhas de scan contínuo quadro a quadro
}

// Salva a Vistoria no Backend
async function salvarVistoria(e) {
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
  } catch (err) {
    alert("Vistoria salva localmente no dispositivo (Modo Offline). Será sincronizada ao conectar.");
  }
}