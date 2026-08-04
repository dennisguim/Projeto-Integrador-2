// Inicialização do Mapa Leaflet centralizado em Sorocaba/SP
const SOROCABA_LAT = -23.5015;
const SOROCABA_LNG = -47.4581;

const map = L.map('map').setView([SOROCABA_LAT, SOROCABA_LNG], 13);

// Adiciona camada do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap | SEMEPP Sorocaba'
}).addTo(map);

let currentMarker = null;

// Evento de Clique no Mapa para consultar ponto arbitrário
map.on('click', function(e) {
  const { lat, lng } = e.latlng;
  processarConsulta(lat, lng, `Ponto Marcado (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
});

// Evento do Botão de Busca por Nome de Rua
document.getElementById('btn-consultar').addEventListener('click', async () => {
  const logradouro = document.getElementById('logradouro-input').value.trim();
  if (!logradouro) {
    alert('Por favor, digite o nome de uma rua ou avenida em Sorocaba.');
    return;
  }

  // Busca Coordenadas na API Nominatim (OpenStreetMap)
  try {
    const query = encodeURIComponent(`${logradouro}, Sorocaba, SP, Brazil`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      processarConsulta(lat, lng, data[0].display_name);
    } else {
      alert('Endereço não localizado em Sorocaba. Tente detalhar o nome da rua.');
    }
  } catch (error) {
    console.error('Erro na geocodificação:', error);
    alert('Falha ao pesquisar endereço. Verifique sua conexão.');
  }
});

// Função para Atualizar o Marcador e Enviar para o Backend
async function processarConsulta(lat, lng, label) {
  // Ajusta visão do mapa e atualiza marcador
  map.setView([lat, lng], 16);

  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  currentMarker = L.marker([lat, lng]).addTo(map)
    .bindPopup(`<b>${label}</b>`).openPopup();

  // Comunicação com o Backend Python para Análise da Zona
  try {
    const response = await fetch('http://localhost:8000/api/viabilidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng, logradouro: label })
    });

    if (!response.ok) throw new Error('Erro na API');

    const resultado = await response.json();
    exibirParecer(resultado);
  } catch (err) {
    console.warn('Backend indisponível, aplicando fallback local:', err);
    // Simulação caso o backend esteja temporariamente offline
    exibirParecer({
      zona: "ZC - Zona Central (Simulação)",
      parecer: "Apto",
      justificativa: "Local em zona comercial com permissão para equipamentos de até 2,00m x 2,00m."
    });
  }
}

// Atualiza o Card de Parecer na Interface
function exibirParecer(dados) {
  document.getElementById('parecer-resultado').style.display = 'block';
  document.getElementById('zona-nome').innerText = dados.zona;
  
  const badge = document.getElementById('status-badge');
  badge.innerText = dados.parecer;
  badge.className = 'status-badge';

  if (dados.parecer === 'Apto') {
    badge.classList.add('status-apto');
  } else if (dados.parecer === 'Inapto') {
    badge.classList.add('status-inapto');
  } else {
    badge.classList.add('status-vistoria');
  }

  document.getElementById('justificativa-texto').innerText = dados.justificativa;
}