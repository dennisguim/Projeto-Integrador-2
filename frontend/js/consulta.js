let map;
let marker;
let tipoComercioSelecionado = "ambulante";

document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o mapa centralizado em Sorocaba
  map = L.map("map").setView([-23.5015, -47.4581], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors | Prefeitura de Sorocaba'
  }).addTo(map);

  // Clique direto no mapa
  map.on("click", (e) => {
    validarPonto(e.latlng.lat, e.latlng.lng, "Ponto selecionado via mapa");
  });
});

function setTipoComercio(tipo) {
  tipoComercioSelecionado = tipo;
  
  document.getElementById("opt-ambulante").classList.toggle("active", tipo === "ambulante");
  document.getElementById("opt-fixo").classList.toggle("active", tipo === "fixo");

  // Se já houver um marcador no mapa, reavalia a viabilidade para a nova modalidade
  if (marker) {
    const latlng = marker.getLatLng();
    validarPonto(latlng.lat, latlng.lng, "Reavaliação de modalidade");
  }
}

async function buscarEndereco() {
  const query = document.getElementById("address-input").value;
  if (!query) {
    alert("Por favor, digite um endereço.");
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Sorocaba, SP")}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      map.setView([lat, lon], 17);
      validarPonto(lat, lon, data[0].display_name);
    } else {
      alert("Endereço não localizado em Sorocaba. Tente com mais detalhes.");
    }
  } catch (error) {
    console.error("Erro na geocodificação:", error);
    alert("Erro ao buscar endereço.");
  }
}

async function validarPonto(lat, lng, logradouro) {
  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([lat, lng]).addTo(map);

  try {
    const response = await fetch("http://localhost:8000/api/viabilidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        logradouro: logradouro,
        tipo_comercio: tipoComercioSelecionado
      })
    });

    const data = await response.json();
    exibirResultado(data);
  } catch (error) {
    console.error("Erro ao consultar viabilidade:", error);
    alert("Não foi possível conectar ao servidor backend (http://localhost:8000). Verifique se o FastAPI está rodando.");
  }
}

function exibirResultado(data) {
  const resultCard = document.getElementById("result-card");
  const badge = document.getElementById("parecer-badge");
  const reqList = document.getElementById("res-requisitos");

  resultCard.classList.remove("hidden");
  document.getElementById("res-tipo").textContent = data.tipo || (tipoComercioSelecionado === "ambulante" ? "Comércio Ambulante" : "Comércio Fixo");
  document.getElementById("res-zona").textContent = data.zona;
  document.getElementById("res-justificativa").textContent = data.justificativa;

  // Preenche a lista de requisitos municipais trazidos da legislação
  reqList.innerHTML = "";
  if (data.requisitos_legais && data.requisitos_legais.length > 0) {
    data.requisitos_legais.forEach(req => {
      const li = document.createElement("li");
      li.textContent = req;
      reqList.appendChild(li);
    });
  }

  // Estiliza o Badge do Parecer
  badge.className = "badge";
  if (data.parecer === "Apto") {
    badge.classList.add("badge-apto");
    badge.textContent = "✅ APTO";
  } else if (data.parecer === "Inapto") {
    badge.classList.add("badge-inapto");
    badge.textContent = "❌ INAPTO";
  } else {
    badge.classList.add("badge-vistoria");
    badge.textContent = "⚠️ NECESSITA VISTORIA";
  }
}