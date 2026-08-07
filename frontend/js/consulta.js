let map;
let marker;
let tipoComercioSelecionado = "ambulante";
let debounceTimeout;

// Dicionário de descrições completas dos usos (exibidos no tooltip/hover)
const DESCRICOES_USO = {
  RU: "Residencial Unifamiliar (casas térreas/sobrados isolados)",
  RM: "Residencial Multifamiliar (apartamentos e condomínio de casas)",
  RT: "Residencial Transitório (hotéis, pousadas, pensões)",
  RSI: "Residencial com Serviço Integrado (trabalho em casa / home office com atendimento restrito)",
  CSI: "Comércio, Serviços e Indústria de Pequeno Porte (padarias, farmácias, mercados locais, lojas)",
  SEAP: "Serviço e Atividade de Apoio (escritórios administrativos, clínicas médicas, salões de beleza)",
  EVC: "Escritório Virtual e de Contato (Coworkings e sedes fiscais sem movimentação de estoque)",
  PGTI: "Polo Gerador de Tráfego de Veículos (Supermercados, shoppings, agências bancárias, grandes academias)",
  PGTP: "Polo Gerador de Tráfego Pesado (Transportadoras, depósitos de materiais pesados, frotas de caminhões)",
  GRN: "Gerador de Ruído Noturno (Funcionamento das 22h às 06h: bares, casas de eventos, buffets, shows)",
  GRD: "Gerador de Ruído Diurno (Oficinas mecânicas, serralherias, indústrias barulhentas, academias de grande porte)",
  TL: "Turismo e Lazer (Hotéis-fazenda, clubes de campo, parques temáticos)",
  UAI: "Uso de Alta Incomodidade (Depósito de GLP/gás, postos de combustíveis, indústrias químicas)",
  UE: "Uso Especial (escolas, hospitais, cemitérios, infraestrutura, órgãos públicos)",
  AAP: "Atividades Agropastoris (Cultivos agrícolas, criação de animais, agronegócio e feiras de produtores)"
};

// Matriz de permissão do Art. 118 (Quadro 01) do Plano Diretor de Sorocaba (Lei 13.123/2025)
const MAPEAMENTO_USOS = {
  ZC: ["RU", "RM", "RT", "RSI", "PGTI", "GRN", "GRD", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZPI: ["RU", "RM", "RT", "RSI", "PGTI", "GRN", "GRD", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZR1: ["RU", "RT", "RSI", "SEAP", "EVC", "UE"],
  ZR2: ["RU", "RM", "RT", "RSI", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZR3: ["RU", "RM", "RT", "RSI", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZR3EXP: ["RU", "RM", "RT", "RSI", "CSI", "SEAP", "EVC", "TL", "UE"],
  "ZR3-E": ["RU", "RM", "RT", "RSI", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZRDS: ["RU", "RT", "RSI", "SEAP", "EVC", "UE"],
  ZI1: ["PGTP", "PGTI", "GRN", "GRD", "CSI", "EVC", "UAI", "UE"],
  ZI2: ["PGTP", "PGTI", "GRN", "GRD", "CSI", "EVC", "UE"],
  ZAE: ["PGTP", "PGTI", "GRN", "GRD", "CSI", "SEAP", "EVC", "UE"],
  ZCH: ["RU", "RT", "RSI", "EVC", "TL", "UE"],
  ZCA: ["RU", "RT", "RSI", "EVC", "TL", "UE"],
  CCS1: ["RU", "RM", "RT", "RSI", "CSI", "SEAP", "EVC", "TL", "UE"],
  CCS2: ["RU", "RM", "RT", "RSI", "PGTI", "GRN", "GRD", "CSI", "SEAP", "EVC", "TL", "UE"],
  CCI: ["PGTP", "PGTI", "GRN", "GRD", "CSI", "SEAP", "EVC", "UE"],
  CCR: ["RU", "RM", "RT", "RSI", "PGTP", "PGTI", "GRD", "GRN", "CSI", "SEAP", "EVC", "TL", "UE"],
  ZRURAL: ["RU", "EVC", "PGTI", "PGTP", "CSI", "TL", "UAI", "UE", "AAP"],
  AEIP: ["CSI", "SEAP", "EVC", "UE"]
};

// Banco de dados local de CNAEs frequentes em Sorocaba (Decreto 30.529/2025) para correspondência rápida/offline
const BANCO_CNAE = {
  // Comércio Varejista (CSI / PGTI)
  "4781400": { desc: "Comércio varejista de artigos do vestuário e acessórios (Lojas de Roupas)", cat: "CSI" },
  "4711302": { desc: "Comércio varejista de mercadorias em geral (Supermercados)", cat: "PGTI" },
  "4721102": { desc: "Padaria e confeitaria com predominância de revenda", cat: "CSI" },
  "4722901": { desc: "Comércio varejista de carnes (Açougues)", cat: "CSI" },
  "4771701": { desc: "Comércio varejista de produtos farmacêuticos (Farmácias)", cat: "CSI" },
  "4789004": { desc: "Comércio varejista de animais vivos e de artigos para pet shop", cat: "CSI" },
  "4753900": { desc: "Comércio varejista especializado de eletrodomésticos e equipamentos de áudio e vídeo", cat: "CSI" },

  // Alimentação & Bares (CSI / GRN)
  "5611201": { desc: "Restaurantes e similares (Alimentação Silenciosa)", cat: "CSI" },
  "5611203": { desc: "Lanchonetes, casas de chá, de sucos e similares", cat: "CSI" },
  "5611204": { desc: "Bares e outros estabelecimentos especializados em servir bebidas, sem entretenimento", cat: "CSI" },
  "5611205": { desc: "Bares e outros estabelecimentos de bebidas com entretenimento/música (Ruído Noturno)", cat: "GRN" },
  "9001902": { desc: "Produção musical e casas de espetáculos com música ao vivo (Shows)", cat: "GRN" },

  // Serviços e Apoio (SEAP / EVC)
  "9602501": { desc: "Serviços de cabeleireiros, manicure, pedicure (Salões de Beleza)", cat: "SEAP" },
  "9602502": { desc: "Atividades de estética, barbearias e serviços de beleza", cat: "SEAP" },
  "8630503": { desc: "Atividade médica ambulatorial restrita a consultas (Clínicas Médicas)", cat: "SEAP" },
  "8630504": { desc: "Atividade odontológica (Clínicas Odontológicas)", cat: "SEAP" },
  "6911701": { desc: "Serviços advocatícios (Escritórios de Advocacia)", cat: "SEAP" },
  "6920601": { desc: "Atividades de contabilidade (Escritórios de Contabilidade)", cat: "SEAP" },
  "7020400": { desc: "Atividades de consultoria em gestão empresarial (Escritórios)", cat: "SEAP" },
  "6201500": { desc: "Desenvolvimento de programas de computador sob encomenda (TI / Coworking)", cat: "EVC" },

  // Ruído Diurno (GRD)
  "4520001": { desc: "Serviços de manutenção e reparação mecânica de veículos automotores (Oficinas)", cat: "GRD" },
  "4520002": { desc: "Serviços de lanternagem ou funilaria e pintura de veículos automotores", cat: "GRD" },
  "9313100": { desc: "Academias de ginástica e centros esportivos (Ruído Diurno)", cat: "GRD" },

  // Educação & Saúde (UE / SEAP)
  "8511200": { desc: "Educação infantil - creche (Creches e Berçários)", cat: "UE" },
  "8513900": { desc: "Ensino de idiomas e cursos livres", cat: "SEAP" },
  "8520100": { desc: "Ensino médio (Escolas Estaduais/Particulares)", cat: "UE" },
  "8610101": { desc: "Atividades de atendimento hospitalar (Hospitais)", cat: "UE" },

  // Logística & Alta Incomodidade (PGTP / UAI / CSI)
  "4921301": { desc: "Transporte rodoviário coletivo de passageiros, com itinerário fixo, municipal (Linhas de Ônibus / Passageiros)", cat: "CSI" },
  "4923001": { desc: "Serviço de táxi", cat: "CSI" },
  "4923002": { desc: "Serviço de transporte de passageiros - locação de automóveis com motorista (Aplicativos / Uber)", cat: "CSI" },
  "4930202": { desc: "Transporte rodoviário de carga (Transportadoras / Depósitos)", cat: "PGTP" },
  "4744099": { desc: "Comércio varejista de materiais de construção em geral (Depósito de Materiais)", cat: "PGTP" },
  "4784900": { desc: "Comércio varejista de gás liquefeito de petróleo (Depósito de Gás GLP)", cat: "UAI" },
  "4731800": { desc: "Comércio varejista de combustíveis para veículos automotores (Postos de Gasolina)", cat: "UAI" },

  // Turismo, Lazer & Agro (TL / AAP)
  "5510801": { desc: "Hotéis e pousadas (Hospedagem e Lazer)", cat: "TL" },
  "9321800": { desc: "Parques de diversão e parques temáticos (Recreação ao ar livre)", cat: "TL" },
  "0111301": { desc: "Cultivo de arroz (Atividade Agrícola)", cat: "AAP" },
  "0151201": { desc: "Criação de bovinos para corte (Atividade Pecuária)", cat: "AAP" }
};

document.addEventListener("DOMContentLoaded", () => {
  tipoComercioSelecionado = localStorage.getItem("last_tipo_comercio") || "ambulante";
  setTipoComercio(tipoComercioSelecionado);

  map = L.map("map").setView([-23.5015, -47.4581], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors | Prefeitura de Sorocaba'
  }).addTo(map);

  map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    let logradouro = "Ponto selecionado via mapa";
    try {
      const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const geoData = await resp.json();
        if (geoData && geoData.features && geoData.features.length > 0) {
          const p = geoData.features[0].properties;
          const streetName = p.name || p.street;
          const number = p.housenumber ? `, ${p.housenumber}` : "";
          const district = p.district || p.suburb ? ` - ${p.district || p.suburb}` : "";
          if (streetName) {
            logradouro = `${streetName}${number}${district}, Sorocaba - SP`;
            const addrInput = document.getElementById("address-input");
            if (addrInput) addrInput.value = logradouro;
          }
        }
      }
    } catch (err) {
      console.warn("Geocodificação reversa indisponível no momento.");
    }

    validarPonto(lat, lng, logradouro);
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
      }, 180);
    });

    document.addEventListener("click", (e) => {
      if (e.target !== addressInput && e.target !== suggestionsList && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add("hidden");
      }
    });
  }

  // --- AUTOCOMPLETE DE CNAE POR CÓDIGO E POR NOME DA ATIVIDADE ---
  const cnaeInput = document.getElementById("cnae-input");
  const cnaeSuggestionsList = document.getElementById("cnae-suggestions-list");
  let debounceCnaeTimeout;

  if (cnaeInput && cnaeSuggestionsList) {
    cnaeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        cnaeSuggestionsList.classList.add("hidden");
        if (window.ultimoPontoConsultado) {
          validarPonto(window.ultimoPontoConsultado.lat, window.ultimoPontoConsultado.lng, window.ultimoPontoConsultado.logradouro);
        }
      }
    });

    cnaeInput.addEventListener("input", () => {
      clearTimeout(debounceCnaeTimeout);
      const query = cnaeInput.value.trim();

      if (query.length < 2) {
        cnaeSuggestionsList.innerHTML = "";
        cnaeSuggestionsList.classList.add("hidden");
        return;
      }

      debounceCnaeTimeout = setTimeout(() => {
        carregarSugestoesCNAE(query);
      }, 250);
    });

    document.addEventListener("click", (e) => {
      if (e.target !== cnaeInput && e.target !== cnaeSuggestionsList && !cnaeSuggestionsList.contains(e.target)) {
        cnaeSuggestionsList.classList.add("hidden");
      }
    });
  }
});

function carregarSugestoesCNAE(query) {
  const cnaeSuggestionsList = document.getElementById("cnae-suggestions-list");
  const cnaeInput = document.getElementById("cnae-input");
  if (!cnaeSuggestionsList || typeof BANCO_DECRETO_30529 === "undefined") return;

  const normalize = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const qClean = normalize(query);
  const qCleanNum = query.replace(/[^0-9]/g, "");

  const matches = [];
  for (const key in BANCO_DECRETO_30529) {
    const item = BANCO_DECRETO_30529[key];
    const fmtMatch = item.fmt && normalize(item.fmt).includes(qClean);
    const keyMatch = qCleanNum && key.includes(qCleanNum);
    const descMatch = item.desc && normalize(item.desc).includes(qClean);

    if (fmtMatch || keyMatch || descMatch) {
      matches.push(item);
    }
    if (matches.length >= 15) break;
  }

  if (matches.length === 0) {
    cnaeSuggestionsList.innerHTML = `<div class="suggestion-item" style="font-size:0.83rem; color:var(--text-muted); cursor:default;">Nenhum CNAE ou atividade encontrada para "${query}"</div>`;
    cnaeSuggestionsList.classList.remove("hidden");
    return;
  }

  cnaeSuggestionsList.innerHTML = "";
  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <strong style="font-size:0.85rem; color:var(--primary-gold);">${item.fmt}</strong>
        <span style="font-size:0.75rem; padding:2px 6px; background:rgba(255,255,255,0.1); border-radius:4px; color:var(--text-muted); font-weight:600;">${item.cat || 'CSI'}</span>
      </div>
      <div style="font-size:0.8rem; color:var(--text-main); margin-top:2px; line-height:1.2;">${item.desc}</div>
    `;

    div.addEventListener("click", () => {
      cnaeInput.value = item.fmt;
      cnaeSuggestionsList.classList.add("hidden");
      if (window.ultimoPontoConsultado) {
        validarPonto(window.ultimoPontoConsultado.lat, window.ultimoPontoConsultado.lng, window.ultimoPontoConsultado.logradouro);
      }
    });

    cnaeSuggestionsList.appendChild(div);
  });

  cnaeSuggestionsList.classList.remove("hidden");
}

// Algoritmo de distância de Levenshtein para tolerância a erros de digitação (Fuzzy Search)
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeAddressStr(str) {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

async function carregarSugestoes(query) {
  const suggestionsList = document.getElementById("suggestions-list");
  if (!suggestionsList) return;

  const qClean = normalizeAddressStr(query);
  const results = [];

  // 1. Busca Local Fuzzy Instantânea (0ms) no banco de Sorocaba (LOCAIS_SOROCABA)
  if (typeof LOCAIS_SOROCABA !== "undefined") {
    LOCAIS_SOROCABA.forEach(item => {
      const nameNorm = normalizeAddressStr(item.nome);
      const bairroNorm = normalizeAddressStr(item.bairro);
      const aliasNorm = (item.aliases || []).map(a => normalizeAddressStr(a));

      let matched = nameNorm.includes(qClean) || bairroNorm.includes(qClean) || aliasNorm.some(a => a.includes(qClean));

      if (!matched && qClean.length >= 3) {
        const qWords = qClean.split(/\s+/).filter(w => w.length >= 3);
        const targetWords = (nameNorm + " " + bairroNorm + " " + aliasNorm.join(" ")).split(/\s+/);
        
        matched = qWords.every(qw => 
          targetWords.some(tw => tw.includes(qw) || levenshteinDistance(tw, qw) <= (qw.length > 5 ? 2 : 1))
        );
      }

      if (matched) {
        results.push({
          display_name: `${item.nome}, ${item.bairro}, Sorocaba - SP`,
          title: item.nome,
          details: `${item.bairro}, Sorocaba - SP`,
          lat: item.lat,
          lon: item.lng
        });
      }
    });
  }

  // Renderiza sugestões locais imediatamente (0ms de atraso visual)
  renderizarSugestoesEnderecos(results.slice(0, 6));

  // 2. Busca remota em paralelo via Photon API (Fuzzy OSM geocoder super rápido e sem bloqueio 403)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " Sorocaba")}&lat=-23.5015&lon=-47.4581&limit=5`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.features) {
        data.features.forEach(feat => {
          const p = feat.properties;
          if (p.city === "Sorocaba" || p.county === "Sorocaba" || p.state === "São Paulo" || !p.city) {
            const title = p.name || p.street || query;
            const details = [p.street, p.suburb, p.district, "Sorocaba - SP"].filter(Boolean).join(", ");
            const coords = feat.geometry.coordinates; // [lon, lat]
            
            if (!results.some(r => Math.abs(r.lat - coords[1]) < 0.001 && Math.abs(r.lon - coords[0]) < 0.001)) {
              results.push({
                display_name: `${title}, ${details}`,
                title: title,
                details: details,
                lat: coords[1],
                lon: coords[0]
              });
            }
          }
        });
        renderizarSugestoesEnderecos(results.slice(0, 6));
      }
    }
  } catch (error) {
    console.warn("Consulta Photon externa ocupada. Exibindo resultados locais.", error);
  }
}

function renderizarSugestoesEnderecos(items) {
  const suggestionsList = document.getElementById("suggestions-list");
  if (!suggestionsList) return;

  if (items.length === 0) {
    suggestionsList.classList.add("hidden");
    return;
  }

  suggestionsList.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `<strong>${item.title}</strong><span>${item.details}</span>`;
    
    div.addEventListener("click", () => {
      document.getElementById("address-input").value = item.display_name;
      suggestionsList.classList.add("hidden");
      
      map.setView([item.lat, item.lon], 17);
      validarPonto(item.lat, item.lon, item.display_name);
    });

    suggestionsList.appendChild(div);
  });
  suggestionsList.classList.remove("hidden");
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
  window.ultimoPontoConsultado = { lat, lng, logradouro };

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`<div style="font-size:0.85rem;"><strong>📍 Ponto Selecionado</strong><br>${logradouro}</div>`).openPopup();

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

// Analisa a atividade buscando a descrição exata na API do IBGE, se online
async function analisarAtividadeCNAE(cnaeString) {
  const clean = cnaeString.replace(/[^0-9]/g, "");
  if (!clean) return null;

  let desc = "";
  let cat = "";

  // 1. Tenta correspondência exata na base completa do Decreto 30.529/2025 (1.334 CNAEs)
  if (typeof BANCO_DECRETO_30529 !== "undefined" && BANCO_DECRETO_30529[clean]) {
    return BANCO_DECRETO_30529[clean];
  }

  if (BANCO_CNAE[clean]) {
    return BANCO_CNAE[clean];
  }

  // 2. Se não achou localmente, consulta dinamicamente os servidores oficiais do IBGE
  try {
    const url = `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${clean}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.descricao) {
        desc = data.descricao;
      }
    }
  } catch (error) {
    console.warn("Servidores do IBGE offline. Utilizando fallback local para classificação espacial.", error);
  }

  // 3. Fallback inteligente baseado nas Divisões CNAE (2 primeiros dígitos) para classificar o uso urbano
  const div = parseInt(clean.substring(0, 2));
  if (isNaN(div)) return null;

  // Detecção específica para Bares com Entretenimento ou Recreação Noturna
  if (clean.startsWith("5611205") || div === 90 || clean.startsWith("9329")) {
    cat = "GRN";
    if (!desc) desc = "Bares, Espetáculos ou Recreação com Entretenimento Noturno (Gerador de Ruído)";
  } else if (clean.startsWith("9313") || clean.startsWith("9319")) {
    cat = "GRD";
    if (!desc) desc = "Academias de ginástica ou centros esportivos de grande porte";
  } else if (clean.startsWith("9321")) {
    cat = "TL";
    if (!desc) desc = "Parques temáticos e de diversão";
  } else if (div >= 1 && div <= 3) {
    cat = "AAP";
    if (!desc) desc = "Atividades Agropastoris / Pesca (CNAE Geral)";
  } else if (div >= 5 && div <= 9) {
    cat = "UAI";
    if (!desc) desc = "Extração Mineral / Combustíveis (CNAE Geral)";
  } else if (div >= 10 && div <= 33) {
    cat = "CSI";
    if (!desc) desc = "Atividade Industrial / Produção (CNAE Geral)";
  } else if (div === 45 || div === 47) {
    if (clean.startsWith("47113")) {
      cat = "PGTI";
      if (!desc) desc = "Comércio de Grande Porte (Supermercado / Hipermercado)";
    } else {
      cat = "CSI";
      if (!desc) desc = "Comércio Varejista / Atacadista (CNAE Geral)";
    }
  } else if (div >= 49 && div <= 53) {
    if (clean.startsWith("492")) {
      cat = "CSI";
      if (!desc) desc = "Transporte Rodoviário Coletivo ou Individual de Passageiros (CSI)";
    } else {
      cat = "PGTP";
      if (!desc) desc = "Transporte de Cargas / Logística e Armazenagem (PGTP)";
    }
  } else if (div === 56) {
    cat = "CSI";
    if (!desc) desc = "Alimentação (Restaurante / Lanchonete / Serviços Alimentares)";
  } else if (div === 62 || div === 63) {
    cat = "EVC";
    if (!desc) desc = "Tecnologia da Informação e Processamento (CNAE Geral)";
  } else if ((div >= 69 && div <= 74) || div === 77 || div === 78 || (div >= 80 && div <= 82)) {
    cat = "SEAP";
    if (!desc) desc = "Serviços de Apoio Administrativo / Escritórios (CNAE Geral)";
  } else if (div === 85) {
    cat = "UE";
    if (!desc) desc = "Serviço de Educação e Ensino (CNAE Geral)";
  } else if (div === 86) {
    cat = "SEAP";
    if (!desc) desc = "Serviço de Saúde Humana / Consultórios / Laboratórios";
  } else if (div === 96) {
    cat = "SEAP";
    if (!desc) desc = "Outras Atividades de Serviços Pessoais (Salões, estética, lavanderia)";
  } else {
    cat = "CSI";
    if (!desc) desc = "Atividade de Comércio/Serviço Geral (Não mapeado)";
  }

  return { desc, cat };
}

async function exibirResultado(data) {
  const resultCard = document.getElementById("result-card");
  const badge = document.getElementById("parecer-badge");
  const reqList = document.getElementById("res-requisitos");
  const usesContainer = document.getElementById("res-usos-permitidos");
  const cnaeInput = document.getElementById("cnae-input");
  const cnaeVerdictBox = document.getElementById("cnae-verdict-box");

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
  const normalizedKey = zonaCodigo.toUpperCase().replace("-E", "EXP");
  const usosPermitidos = MAPEAMENTO_USOS[normalizedKey] || ["CSI", "SEAP", "EVC", "UE"];

  if (usesContainer) {
    usesContainer.innerHTML = "";
    usosPermitidos.forEach(uso => {
      const span = document.createElement("span");
      span.className = "use-tag";
      span.textContent = uso;
      span.title = DESCRICOES_USO[uso] || "Uso Urbano";
      usesContainer.appendChild(span);
    });
  }

  // --- CRUZAMENTO DINÂMICO DE CNAE COM O ZONEAMENTO ---
  if (cnaeInput && cnaeInput.value.trim() && cnaeVerdictBox) {
    const cnaeValue = cnaeInput.value.trim();
    cnaeVerdictBox.classList.remove("hidden");
    
    const cnaeBadge = document.getElementById("cnae-badge");
    const cnaeJustificativa = document.getElementById("cnae-justificativa");

    // Mostra indicador visual de progresso da requisição externa
    cnaeBadge.className = "cnae-badge cnae-badge-vistoria";
    cnaeBadge.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      <span>Consultando IBGE...</span>
    `;
    cnaeJustificativa.textContent = "Buscando descrição oficial da atividade...";

    // Analisa a atividade (consulta assíncrona ao IBGE Concla)
    const atividade = await analisarAtividadeCNAE(cnaeValue);

    if (atividade) {
      const cnaePermitidoNaZona = usosPermitidos.includes(atividade.cat);

      cnaeBadge.className = "cnae-badge";
      if (cnaePermitidoNaZona) {
        if (data.parecer === "Necessita de Vistoria") {
          cnaeBadge.classList.add("cnae-badge-vistoria");
          cnaeBadge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Vistoria Necessária
          `;
          cnaeJustificativa.innerHTML = `A atividade <strong>${atividade.desc}</strong> (CNAE enquadrado em <strong>${atividade.cat}</strong>) é compatível com o zoneamento <strong>${zonaCodigo}</strong>, porém o local exige vistoria física prévia para liberação.`;
        } else {
          cnaeBadge.classList.add("cnae-badge-apto");
          cnaeBadge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Atividade Permitida
          `;
          cnaeJustificativa.innerHTML = `A atividade <strong>${atividade.desc}</strong> (CNAE enquadrado em <strong>${atividade.cat}</strong>) é <strong>totalmente compatível</strong> com o zoneamento <strong>${zonaCodigo}</strong> no horário diurno regular.`;
        }

        // Condicionantes do Decreto 30.529/2025 (Noturno e Porte / Metragem Excedente)
        if (atividade.cat_noturno) {
          const noturnoPermitido = usosPermitidos.includes(atividade.cat_noturno);
          const noturnoMsg = noturnoPermitido
            ? `Se o estabelecimento operar entre <strong>22h e 06h</strong>, o enquadramento passa para <strong>${atividade.cat_noturno}</strong> (Gerador de Ruído Noturno).`
            : `Se o estabelecimento operar entre <strong>22h e 06h</strong>, o enquadramento passa para <strong>${atividade.cat_noturno}</strong> e a atividade torna-se <strong>VEDADA</strong> no zoneamento ${zonaCodigo}.`;
          const noturnoStyle = noturnoPermitido
            ? `background:rgba(59, 130, 246, 0.1); border-left:3px solid var(--primary-gold);`
            : `background:rgba(239, 68, 68, 0.1); border-left:3px solid var(--status-inapto);`;
          cnaeJustificativa.innerHTML += `<div style="margin-top:8px; padding:6px 10px; ${noturnoStyle} border-radius:4px; font-size:0.82rem; color:var(--text-main);"><strong>🌙 Alerta Noturno (Decreto 30.529/2025):</strong> ${noturnoMsg}</div>`;
        }

        if (atividade.cat_porte) {
          let descMetragem = "Se a área construída/terreno for excedente ou abrigar frota de veículos";
          if (atividade.conds_detalhe) {
            const d = atividade.conds_detalhe;
            const partes = [];
            if (d.terreno_gt_2500) partes.push("área de terreno > 2.500m²");
            if (d.constr_gt_2500) partes.push("área construída > 2.500m²");
            if (d.constr_gt_750) partes.push("área construída > 750m²");
            if (d.garage_gt_2500) partes.push("área privativa (exceto garagem) > 2.500m²");
            if (d.garage_gt_2000) partes.push("área privativa (exceto garagem) > 2.000m²");
            if (d.garage_gt_1000) partes.push("área privativa (exceto garagem) > 1.000m²");
            if (d.garage_gt_750) partes.push("área privativa (exceto garagem) > 750m²");
            if (partes.length > 0) descMetragem = "Em caso de " + partes.join(" ou ");
          }

          const portePermitido = usosPermitidos.includes(atividade.cat_porte);
          const porteMsg = portePermitido
            ? `${descMetragem}, o enquadramento passa para <strong>${atividade.cat_porte}</strong> (admitido no zoneamento ${zonaCodigo}).`
            : `${descMetragem}, o enquadramento passa para <strong>${atividade.cat_porte}</strong> e a atividade torna-se <strong>INCOMPATÍVEL</strong> com o zoneamento ${zonaCodigo}.`;
          const porteStyle = portePermitido
            ? `background:rgba(245, 158, 11, 0.1); border-left:3px solid var(--status-vistoria);`
            : `background:rgba(239, 68, 68, 0.1); border-left:3px solid var(--status-inapto);`;
          cnaeJustificativa.innerHTML += `<div style="margin-top:6px; padding:6px 10px; ${porteStyle} border-radius:4px; font-size:0.82rem; color:var(--text-main);"><strong>🏢 Alerta de Porte (Decreto 30.529/2025):</strong> ${porteMsg}</div>`;
        }
      } else {
        cnaeBadge.classList.add("cnae-badge-inapto");
        cnaeBadge.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Atividade Proibida
        `;
        cnaeJustificativa.innerHTML = `A atividade <strong>${atividade.desc}</strong> (CNAE classificado em <strong>${atividade.cat}</strong>) é <strong>VEDADA</strong> para este zoneamento. A zona <strong>${zonaCodigo}</strong> não admite a categoria <strong>${atividade.cat}</strong> de acordo com a Seção II, Art. 118 da Lei 13.123/2025 e Decreto 30.529/2025.`;
      }
    } else {
      cnaeVerdictBox.classList.add("hidden");
    }
  } else {
    if (cnaeVerdictBox) cnaeVerdictBox.classList.add("hidden");
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