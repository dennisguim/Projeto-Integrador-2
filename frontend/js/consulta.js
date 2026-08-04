let map;
let marker;
let tipoComercioSelecionado = "ambulante";
let debounceTimeout;

// Dicionário de descrições completas dos usos (exibidos no tooltip/hover)
const DESCRICOES_USO = {
  CSI: "Comércio, Serviços e Indústria de Pequeno Porte (padarias, farmácias, mercados locais, lojas)",
  SEAP: "Serviço e Atividade de Apoio (escritórios administrativos, clínicas médicas, odontológicas, salões de beleza)",
  EVC: "Escritório Virtual e de Contato (Coworkings e sedes fiscais sem movimentação de estoque)",
  PGTI: "Polo Gerador de Tráfego de Veículos (Supermercados, shoppings, agências bancárias, grandes academias)",
  PGTP: "Polo Gerador de Tráfego Pesado (Transportadoras, depósitos de materiais pesados, frotas de caminhões)",
  GRN: "Gerador de Ruído Noturno (Funcionamento das 22h às 06h: bares, casas de eventos, buffets)",
  GRD: "Gerador de Ruído Diurno (Oficinas mecânicas, serralherias, indústrias barulhentas)",
  TL: "Turismo e Lazer (Hotéis-fazenda, clubes de campo, parques temáticos)",
  UAI: "Uso de Alta Incomodidade (Depósito de GLP/gás, postos de combustíveis, indústrias químicas)",
  UE: "Uso Especial (Reservatórios, cemitérios, museus, escolas, hospitais, órgãos públicos)",
  AAP: "Atividades Agropastoris (Cultivos agrícolas, criação de animais, agronegócio e feiras de produtores)"
};

// Matriz de permissão do Art. 118 do Plano Diretor de Sorocaba
const MAPEAMENTO_USOS = {
  ZC: ["CSI", "SEAP", "EVC", "PGTI", "GRN", "GRD", "TL", "UE"],
  ZPI: ["CSI", "SEAP", "EVC", "PGTI", "GRN", "GRD", "TL", "UE"],
  ZR1: ["SEAP", "EVC", "UE"],
  ZR2: ["CSI", "SEAP", "EVC", "TL", "UE"],
  ZR3: ["CSI", "SEAP", "EVC", "TL", "UE"],
  ZR3EXP: ["CSI", "SEAP", "EVC", "TL", "UE"],
  ZRDS: ["SEAP", "EVC", "UE"],
  ZI1: ["CSI", "EVC", "PGTP", "PGTI", "GRN", "GRD", "UAI", "UE"],
  ZI2: ["CSI", "EVC", "PGTP", "PGTI", "GRN", "GRD", "UE"],
  ZAE: ["CSI", "SEAP", "EVC", "PGTP", "PGTI", "GRN", "GRD", "UE"],
  ZCH: ["EVC", "TL", "UE"],
  ZCA: ["EVC", "TL", "UE"],
  CCS1: ["CSI", "SEAP", "EVC", "TL", "UE"],
  CCS2: ["CSI", "SEAP", "EVC", "PGTI", "GRN", "GRD", "TL", "UE"],
  CCI: ["CSI", "SEAP", "EVC", "PGTP", "PGTI", "GRN", "GRD", "UE"],
  CCR: ["CSI", "SEAP", "EVC", "PGTP", "PGTI", "GRD", "GRN", "TL", "UE"],
  ZRURAL: ["CSI", "EVC", "PGTI", "PGTP", "TL", "UAI", "UE", "AAP"],
  AEIP: ["CSI", "SEAP", "EVC", "UE"]
};

document.addEventListener("DOMContentLoaded", () => {
  tipoComercioSelecionado = localStorage.getItem("last_tipo_comercio") || "ambulante";
  setTipoComercio(tipoComercioSelecionado);

  map = L.map("map").setView([-23.5015, -47.4581], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors | Prefeitura de Sorocaba'
  }).addTo(map);

  map.on("click", (e) => {
    validarPonto(e.latlng.lat, e.latlng.lng, "Ponto selecionado via mapa");
  });

  const addressInput = document.getElementById("address-input");
  const suggestionsList = document.getElementById("suggestions-list");

  if (addressInput && suggestionsList) {
    addressInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        suggestionsList.classList.add("hidden");
        buscarEndereco();
      }
    });

    addressInput.addEventListener("input", () => {
      clearTimeout(debounceTimeout);
      const query = addressInput.value.trim();

      if (query.length < 3) {
        suggestionsList.innerHTML = "";
        suggestionsList.classList.add("hidden");
        return;
      }

      debounceTimeout = setTimeout(() => {
        carregarSugestoes(query);
      }, 400);
    });

    document.addEventListener("click", (e) => {
      if (e.target !== addressInput && e.target !== suggestionsList && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add("hidden");
      }
    });
  }
});

async function carregarSugestoes(query) {
  const suggestionsList = document.getElementById("suggestions-list");
  if (!suggestionsList) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query + ", Sorocaba, SP")}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept-Language": "pt-BR" }
    });
    if (!response.ok) return;

    const data = await response.json();
    suggestionsList.innerHTML = "";

    if (data && data.length > 0) {
      data.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        
        const parts = item.display_name.split(",");
        const mainTitle = parts[0].trim();
        const details = parts.slice(1).map(p => p.trim()).filter(p => !p.includes("Brasil") && !p.includes("Estado de São Paulo") && !p.includes("Região Metropolitana")).join(", ");

        div.innerHTML = `<strong>${mainTitle}</strong><span>${details}</span>`;
        
        div.addEventListener("click", () => {
          document.getElementById("address-input").value = item.display_name;
          suggestionsList.classList.add("hidden");
          
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          map.setView([lat, lon], 17);
          validarPonto(lat, lon, item.display_name);
        });

        suggestionsList.appendChild(div);
      });
      suggestionsList.classList.remove("hidden");
    } else {
      suggestionsList.classList.add("hidden");
    }
  } catch (error) {
    console.error("Erro ao obter sugestões de busca:", error);
  }
}

function setTipoComercio(tipo) {
  tipoComercioSelecionado = tipo;
  localStorage.setItem("last_tipo_comercio", tipo);
  
  const optAmbulante = document.getElementById("opt-ambulante");
  const optFixo = document.getElementById("opt-fixo");

  if (optAmbulante && optFixo) {
    optAmbulante.classList.toggle("active", tipo === "ambulante");
    optFixo.classList.toggle("active", tipo === "fixo");
  }

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
      alert("Endereço não localizado em Sorocaba. Tente detalhar melhor (ex: incluir número ou bairro).");
    }
  } catch (error) {
    console.error("Erro na geocodificação:", error);
    alert("Erro ao buscar endereço no servidor geocodificador.");
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
  const usesContainer = document.getElementById("res-usos-permitidos");

  resultCard.classList.remove("hidden");
  document.getElementById("res-tipo").textContent = data.tipo || (tipoComercioSelecionado === "ambulante" ? "Comércio Ambulante" : "Comércio Fixo");

  // Extrai e separa o código do zoneamento
  let zonaCodigo = "ZM";
  let zonaDesc = data.zona || "Zona Mista";

  if (data.zona) {
    if (data.zona.includes(" - ")) {
      const parts = data.zona.split(" - ");
      zonaCodigo = parts[0].trim();
      zonaDesc = parts[1].trim();
    } else {
      if (data.zona.toLowerCase().includes("mista")) {
        zonaCodigo = "ZM";
      } else if (data.zona.toLowerCase().includes("central")) {
        zonaCodigo = "ZC";
      } else if (data.zona.toLowerCase().includes("residencial 1") || data.zona.toLowerCase().includes("zr1")) {
        zonaCodigo = "ZR1";
      } else if (data.zona.toLowerCase().includes("preservação") || data.zona.toLowerCase().includes("zca")) {
        zonaCodigo = "ZCA";
      } else {
        zonaCodigo = data.zona.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
      }
    }
  }

  // Preenche os campos separados no parecer
  document.getElementById("res-zona-codigo").textContent = zonaCodigo;
  document.getElementById("res-zona").textContent = zonaDesc;
  document.getElementById("res-justificativa").textContent = data.justificativa;

  // Injeta as tags de usos permitidos de forma minimalista
  if (usesContainer) {
    usesContainer.innerHTML = "";
    // Recupera a lista de categorias de uso da zona (código sanitizado em uppercase)
    const normalizedKey = zonaCodigo.toUpperCase().replace("-E", "EXP");
    const usosPermitidos = MAPEAMENTO_USOS[normalizedKey] || ["CSI", "SEAP", "EVC", "UE"];

    usosPermitidos.forEach(uso => {
      const span = document.createElement("span");
      span.className = "use-tag";
      span.textContent = uso;
      span.title = DESCRICOES_USO[uso] || "Uso Urbano";
      usesContainer.appendChild(span);
    });
  }

  // Preenche a lista de requisitos municipais
  reqList.innerHTML = "";
  if (data.requisitos_legais && data.requisitos_legais.length > 0) {
    data.requisitos_legais.forEach(req => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "flex-start";
      li.style.gap = "6px";
      li.style.marginBottom = "6px";
      
      li.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" style="flex-shrink:0; margin-top:2px; color:var(--primary-gold);"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <span>${req}</span>
      `;
      reqList.appendChild(li);
    });
  }

  // Estiliza o Badge do Parecer
  badge.className = "badge";
  if (data.parecer === "Apto") {
    badge.classList.add("badge-apto");
    badge.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      Apto
    `;
  } else if (data.parecer === "Inapto") {
    badge.classList.add("badge-inapto");
    badge.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      Inapto
    `;
  } else {
    badge.classList.add("badge-vistoria");
    badge.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      Necessita Vistoria
    `;
  }
}