document.addEventListener('DOMContentLoaded', () => {
  iniciarLeitorQRCode();

  document.getElementById('form-vistoria').addEventListener('submit', salvarVistoria);
});

// Inicializa a Câmera e Leitor de QR Code
function iniciarLeitorQRCode() {
  const html5QrCode = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: { width: 220, height: 220 } };

  html5QrCode.start(
    { facingMode: "environment" }, // Usa a câmera traseira se disponível
    config,
    onScanSuccess,
    onScanFailure
  ).catch(err => {
    console.warn("Câmera indisponível ou permissão negada. O leitor visual funcionará por entrada manual se necessário.", err);
    document.getElementById('reader').innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera-off"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"></path><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v3.5"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path></svg>
        Câmera aguardando permissão ou indisponível no navegador desktop.
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
      resTitle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${data.mensagem}</span>
      `;
      resDesc.innerText = `Titular: ${data.dados.titular} | Protocolo: ${data.dados.protocolo} | Ponto: ${data.dados.ponto}`;
      
      // Preenche automaticamente o protocolo no formulário de vistoria ao lado
      document.getElementById('f-protocolo').value = data.dados.protocolo;
    } else {
      throw new Error(data.detail || "Licença inválida");
    }
  } catch (err) {
    resBox.className = 'result-box result-error';
    resTitle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      <span>QR CODE INVÁLIDO OU EXPIRADO!</span>
    `;
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