let map;
let marker;
let tipoComercioSelecionado = "ambulante";
let debounceTimeout;
let ultimoPonto = null;
let codigoConsultaAtual = "";
let dataHoraConsultaAtual = "";

const SOROCABA = [-23.5015, -47.4581];

const ICONES = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  alerta: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  seta: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`,
  carregando: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`
};

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
const BANCO_CNAE = {
  "4781400": { desc: "Comércio varejista de artigos do vestuário e acessórios (Lojas de Roupas)", cat: "CSI" },
  "4711302": { desc: "Comércio varejista de mercadorias em geral (Supermercados)", cat: "PGTI" },
  "4721102": { desc: "Padaria e confeitaria com predominância de revenda", cat: "CSI" },
  "4722901": { desc: "Comércio varejista de carnes (Açougues)", cat: "CSI" },
  "4771701": { desc: "Comércio varejista de produtos farmacêuticos (Farmácias)", cat: "CSI" },
  "4789004": { desc: "Comércio varejista de animais vivos e de artigos para pet shop", cat: "CSI" },
  "4753900": { desc: "Comércio varejista especializado de eletrodomésticos e equipamentos de áudio e vídeo", cat: "CSI" },
  "5611201": { desc: "Restaurantes e similares (Alimentação Silenciosa)", cat: "CSI", cat_noturno: "GRN", cat_porte: "PGTI" },
  "5611203": { desc: "Lanchonetes, casas de chá, de sucos e similares", cat: "CSI", cat_noturno: "GRN", cat_porte: "PGTI" },
  "5611204": { desc: "Bares e outros estabelecimentos especializados em servir bebidas, sem entretenimento", cat: "CSI", cat_noturno: "GRN", cat_porte: "PGTI" },
  "5611205": { desc: "Bares e outros estabelecimentos especializados em servir bebidas, com entretenimento", cat: "GRD", cat_noturno: "GRN", cat_porte: "PGTI" },
  "9001902": { desc: "Produção musical e casas de espetáculos com música ao vivo (Shows)", cat: "GRN" },
  "9602501": { desc: "Serviços de cabeleireiros, manicure, pedicure (Salões de Beleza)", cat: "SEAP" },
  "9602502": { desc: "Atividades de estética, barbearias e serviços de beleza", cat: "SEAP" },
  "8630503": { desc: "Atividade médica ambulatorial restrita a consultas (Clínicas Médicas)", cat: "SEAP" },
  "8630504": { desc: "Atividade odontológica (Clínicas Odontológicas)", cat: "SEAP" },
  "6911701": { desc: "Serviços advocatícios (Escritórios de Advocacia)", cat: "SEAP" },
  "6920601": { desc: "Atividades de contabilidade (Escritórios de Contabilidade)", cat: "SEAP" },
  "7020400": { desc: "Atividades de consultoria em gestão empresarial (Escritórios)", cat: "SEAP" },
  "6201500": { desc: "Desenvolvimento de programas de computador sob encomenda (TI / Coworking)", cat: "EVC" },
  "4520001": { desc: "Serviços de manutenção e reparação mecânica de veículos automotores (Oficinas)", cat: "GRD" },
  "4520002": { desc: "Serviços de lanternagem ou funilaria e pintura de veículos automotores", cat: "GRD" },
  "9313100": { desc: "Academias de ginástica e centros esportivos (Ruído Diurno)", cat: "GRD" },
  "8511200": { desc: "Educação infantil - creche (Creches e Berçários)", cat: "UE" },
  "8513900": { desc: "Ensino de idiomas e cursos livres", cat: "SEAP" },
  "8520100": { desc: "Ensino médio (Escolas Estaduais/Particulares)", cat: "UE" },
  "8610101": { desc: "Atividades de atendimento hospitalar (Hospitais)", cat: "UE" },
  "4921301": { desc: "Transporte rodoviário coletivo de passageiros, com itinerário fixo, municipal (Linhas de Ônibus / Passageiros)", cat: "CSI" },
  "4923001": { desc: "Serviço de táxi", cat: "CSI" },
  "4923002": { desc: "Serviço de transporte de passageiros - locação de automóveis com motorista (Aplicativos / Uber)", cat: "CSI" },
  "4930202": { desc: "Transporte rodoviário de carga (Transportadoras / Depósitos)", cat: "PGTP" },
  "4744099": { desc: "Comércio varejista de materiais de construção em geral (Depósito de Materiais)", cat: "PGTP" },
  "4784900": { desc: "Comércio varejista de gás liquefeito de petróleo (Depósito de Gás GLP)", cat: "UAI" },
  "4731800": { desc: "Comércio varejista de combustíveis para veículos automotores (Postos de Gasolina)", cat: "UAI" },
  "5510801": { desc: "Hotéis e pousadas (Hospedagem e Lazer)", cat: "TL" },
  "9321800": { desc: "Parques de diversão e parques temáticos (Recreação ao ar livre)", cat: "TL" },
  "0111301": { desc: "Cultivo de arroz (Atividade Agrícola)", cat: "AAP" },
  "0151201": { desc: "Criação de bovinos para corte (Atividade Pecuária)", cat: "AAP" }
};

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView(SOROCABA, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors | Prefeitura de Sorocaba",
    crossOrigin: "anonymous"
  }).addTo(map);

  setTipoComercio(localStorage.getItem("last_tipo_comercio") === "fixo" ? "fixo" : "ambulante");

  document.querySelectorAll(".trade-option").forEach((btn) => {
    btn.addEventListener("click", () => setTipoComercio(btn.dataset.tipo));
  });
  document.getElementById("search-btn").addEventListener("click", buscarEndereco);
  document.getElementById("btn-print-doc").addEventListener("click", salvarOuImprimirPDF);
  document.getElementById("btn-share-doc").addEventListener("click", compartilharLaudo);

  map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    let logradouro = "Ponto selecionado no mapa";
    try {
      const resp = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
      if (resp.ok) {
        const geoData = await resp.json();
        if (geoData && geoData.features && geoData.features.length > 0) {
          const p = geoData.features[0].properties;
          const streetName = p.name || p.street;
          const number = p.housenumber ? `, ${p.housenumber}` : "";
          const district = p.district || p.suburb ? ` - ${p.district || p.suburb}` : "";
          if (streetName) {
            logradouro = `${streetName}${number}${district}, Sorocaba - SP`.slice(0, 200);
            document.getElementById("address-input").value = logradouro;
          }
        }
      }
    } catch (err) {
      console.warn("Geocodificação reversa indisponível.");
    }

    validarPonto(lat, lng, logradouro);
  });

  const addressInput = document.getElementById("address-input");
  const suggestionsList = document.getElementById("suggestions-list");

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

    debounceTimeout = setTimeout(() => carregarSugestoes(query), 180);
  });

  const cnaeInput = document.getElementById("cnae-input");
  const cnaeSuggestionsList = document.getElementById("cnae-suggestions-list");
  let debounceCnaeTimeout;

  cnaeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      cnaeSuggestionsList.classList.add("hidden");
      revalidarUltimoPonto();
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

    debounceCnaeTimeout = setTimeout(() => carregarSugestoesCNAE(query), 250);
  });

  document.addEventListener("click", (e) => {
    if (e.target !== addressInput && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.add("hidden");
    }
    if (e.target !== cnaeInput && !cnaeSuggestionsList.contains(e.target)) {
      cnaeSuggestionsList.classList.add("hidden");
    }
  });

  // link compartilhado: consulta.html?id=CNS-...
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get("id") || urlParams.get("code");
  if (codeParam) {
    carregarConsultaPorCodigo(codeParam);
  }
});

function marcarPonto(lat, lng, titulo, logradouro) {
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);

  const popup = document.createElement("div");
  popup.className = "popup-ponto";
  const forte = document.createElement("strong");
  forte.textContent = titulo;
  popup.append(forte, document.createElement("br"), logradouro);
  marker.bindPopup(popup).openPopup();
}

function revalidarUltimoPonto() {
  if (ultimoPonto) {
    validarPonto(ultimoPonto.lat, ultimoPonto.lng, ultimoPonto.logradouro);
  }
}

async function carregarConsultaPorCodigo(code) {
  try {
    const response = await apiFetch(`/api/consulta/${encodeURIComponent(code)}`);
    if (!response.ok) {
      exibirToast("Consulta não encontrada. Confira o código do link.");
      return;
    }
    const data = await response.json();
    ultimoPonto = { lat: data.latitude, lng: data.longitude, logradouro: data.logradouro };
    codigoConsultaAtual = data.codigo_consulta;
    dataHoraConsultaAtual = data.data_hora;

    if (data.tipo_comercio) setTipoComercio(data.tipo_comercio, false);
    document.getElementById("cnae-input").value = data.cnae || "";
    document.getElementById("address-input").value = data.logradouro;

    map.setView([data.latitude, data.longitude], 17);
    marcarPonto(data.latitude, data.longitude, "Ponto consultado", data.logradouro);

    exibirResultado(data);
  } catch (err) {
    console.warn("Não foi possível carregar a consulta salva.", err);
  }
}

function normalizar(str) {
  return str ? str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : "";
}

function carregarSugestoesCNAE(query) {
  const lista = document.getElementById("cnae-suggestions-list");
  const cnaeInput = document.getElementById("cnae-input");
  if (typeof BANCO_DECRETO_30529 === "undefined") return;

  const qClean = normalizar(query);
  const qCleanNum = query.replace(/[^0-9]/g, "");

  const matches = [];
  for (const key in BANCO_DECRETO_30529) {
    const item = BANCO_DECRETO_30529[key];
    const fmtMatch = item.fmt && normalizar(item.fmt).includes(qClean);
    const keyMatch = qCleanNum && key.includes(qCleanNum);
    const descMatch = item.desc && normalizar(item.desc).includes(qClean);

    if (fmtMatch || keyMatch || descMatch) {
      matches.push(item);
    }
    if (matches.length >= 15) break;
  }

  lista.innerHTML = "";

  if (matches.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "suggestion-item vazio";
    vazio.textContent = `Nenhum CNAE ou atividade encontrada para "${query}"`;
    lista.appendChild(vazio);
    lista.classList.remove("hidden");
    return;
  }

  matches.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <div class="sug-cnae-topo">
        <strong>${esc(item.fmt)}</strong>
        <span>${esc(item.cat || "CSI")}</span>
      </div>
      <div class="sug-cnae-desc">${esc(item.desc)}</div>
    `;

    div.addEventListener("click", () => {
      cnaeInput.value = item.fmt;
      lista.classList.add("hidden");
      revalidarUltimoPonto();
    });

    lista.appendChild(div);
  });

  lista.classList.remove("hidden");
}

// distância de edição, para a busca tolerar erros de digitação
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

async function carregarSugestoes(query) {
  const qClean = normalizar(query);
  const results = [];

  if (typeof LOCAIS_SOROCABA !== "undefined") {
    LOCAIS_SOROCABA.forEach((item) => {
      const nameNorm = normalizar(item.nome);
      const bairroNorm = normalizar(item.bairro);
      const aliasNorm = (item.aliases || []).map((a) => normalizar(a));

      let matched = nameNorm.includes(qClean) || bairroNorm.includes(qClean) || aliasNorm.some((a) => a.includes(qClean));

      if (!matched && qClean.length >= 3) {
        const qWords = qClean.split(/\s+/).filter((w) => w.length >= 3);
        const targetWords = (nameNorm + " " + bairroNorm + " " + aliasNorm.join(" ")).split(/\s+/);

        matched = qWords.every((qw) =>
          targetWords.some((tw) => tw.includes(qw) || levenshteinDistance(tw, qw) <= (qw.length > 5 ? 2 : 1))
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

  // a base local responde na hora; o Photon complementa quando chegar
  renderizarSugestoesEnderecos(results.slice(0, 6));

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " Sorocaba")}&lat=${SOROCABA[0]}&lon=${SOROCABA[1]}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    if (!data || !data.features) return;

    data.features.forEach((feat) => {
      const p = feat.properties;
      if (p.city === "Sorocaba" || p.county === "Sorocaba" || p.state === "São Paulo" || !p.city) {
        const title = p.name || p.street || query;
        const details = [p.street, p.suburb, p.district, "Sorocaba - SP"].filter(Boolean).join(", ");
        const [lon, lat] = feat.geometry.coordinates;

        if (!results.some((r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lon - lon) < 0.001)) {
          results.push({ display_name: `${title}, ${details}`, title, details, lat, lon });
        }
      }
    });
    renderizarSugestoesEnderecos(results.slice(0, 6));
  } catch (error) {
    console.warn("Photon indisponível, exibindo apenas resultados locais.");
  }
}

function renderizarSugestoesEnderecos(items) {
  const suggestionsList = document.getElementById("suggestions-list");

  if (items.length === 0) {
    suggestionsList.classList.add("hidden");
    return;
  }

  suggestionsList.innerHTML = "";
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `<strong>${esc(item.title)}</strong><span>${esc(item.details)}</span>`;

    div.addEventListener("click", () => {
      document.getElementById("address-input").value = item.display_name;
      suggestionsList.classList.add("hidden");

      map.setView([item.lat, item.lon], 17);
      validarPonto(item.lat, item.lon, item.display_name.slice(0, 200));
    });

    suggestionsList.appendChild(div);
  });
  suggestionsList.classList.remove("hidden");
}

function setTipoComercio(tipo, revalidar = true) {
  tipoComercioSelecionado = tipo === "fixo" ? "fixo" : "ambulante";
  localStorage.setItem("last_tipo_comercio", tipoComercioSelecionado);

  document.getElementById("opt-ambulante").classList.toggle("active", tipoComercioSelecionado === "ambulante");
  document.getElementById("opt-fixo").classList.toggle("active", tipoComercioSelecionado === "fixo");

  if (revalidar) revalidarUltimoPonto();
}

async function buscarEndereco() {
  const query = document.getElementById("address-input").value.trim();
  if (!query) {
    exibirToast("Digite um endereço ou clique em um ponto do mapa.");
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
      validarPonto(lat, lon, String(data[0].display_name).slice(0, 200));
    } else {
      exibirToast("Endereço não localizado em Sorocaba. Tente incluir número ou bairro.");
    }
  } catch (error) {
    console.error("Erro na geocodificação:", error);
    exibirToast("Não foi possível consultar o serviço de endereços.");
  }
}

async function validarPonto(lat, lng, logradouro) {
  ultimoPonto = { lat, lng, logradouro };
  marcarPonto(lat, lng, "Ponto selecionado", logradouro);

  try {
    const response = await apiFetch("/api/viabilidade", {
      method: "POST",
      dados: {
        latitude: lat,
        longitude: lng,
        logradouro: logradouro,
        tipo_comercio: tipoComercioSelecionado,
        cnae: document.getElementById("cnae-input").value.trim()
      }
    });

    const data = await response.json();
    if (!response.ok) {
      exibirToast(mensagemErro(response, data, "Não foi possível concluir a consulta."));
      return;
    }

    codigoConsultaAtual = data.codigo_consulta;
    dataHoraConsultaAtual = data.data_hora;
    window.history.replaceState(null, "", `${window.location.pathname}?id=${encodeURIComponent(data.codigo_consulta)}`);
    exibirResultado(data);
  } catch (error) {
    console.error("Erro ao consultar viabilidade:", error);
    exibirToast("Servidor indisponível no momento. Tente novamente em instantes.");
  }
}

async function analisarAtividadeCNAE(cnaeString) {
  const clean = cnaeString.replace(/[^0-9]/g, "");
  if (!clean) return null;

  let desc = "";
  let cat = "";

  if (typeof BANCO_DECRETO_30529 !== "undefined" && BANCO_DECRETO_30529[clean]) {
    return BANCO_DECRETO_30529[clean];
  }

  if (BANCO_CNAE[clean]) {
    return BANCO_CNAE[clean];
  }

  // fora das bases locais, busca a descrição no IBGE e classifica pela divisão do CNAE
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
    console.warn("API do IBGE indisponível, usando classificação local.");
  }

  const div = parseInt(clean.substring(0, 2));
  if (isNaN(div)) return null;

  if (clean.startsWith("5611205")) {
    cat = "GRD";
    if (!desc) desc = "Bares e outros estabelecimentos especializados em servir bebidas, com entretenimento";
  } else if (div === 90 || clean.startsWith("9329")) {
    cat = "GRN";
    if (!desc) desc = "Espetáculos, Shows ou Recreação Noturna (Gerador de Ruído)";
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

function alertaCnae(classe, titulo, mensagemHtml) {
  return `<div class="alerta-cnae ${classe}"><strong>${titulo}</strong> ${mensagemHtml}</div>`;
}

async function exibirResultado(data) {
  const resultCard = document.getElementById("result-card");
  const badge = document.getElementById("parecer-badge");
  const reqList = document.getElementById("res-requisitos");
  const usesContainer = document.getElementById("res-usos-permitidos");
  const cnaeVerdictBox = document.getElementById("cnae-verdict-box");

  resultCard.classList.remove("hidden");
  document.getElementById("res-tipo").textContent = data.tipo || (tipoComercioSelecionado === "ambulante" ? "Comércio Ambulante" : "Comércio Fixo");
  document.getElementById("res-codigo-consulta").textContent = data.codigo_consulta || codigoConsultaAtual;
  document.getElementById("res-endereco-logradouro").textContent = ultimoPonto ? ultimoPonto.logradouro : (data.logradouro || "");

  const elCnaeRow = document.getElementById("res-cnae-row");
  const cnaeValor = document.getElementById("cnae-input").value.trim() || data.cnae || "";
  document.getElementById("res-cnae-codigo").textContent = cnaeValor;
  elCnaeRow.classList.toggle("hidden", !cnaeValor);

  let zonaCodigo = "ZM";
  let zonaDesc = data.zona || "Zona Mista";

  if (data.zona) {
    const zonaMin = data.zona.toLowerCase();
    if (data.zona.includes(" - ")) {
      const parts = data.zona.split(" - ");
      zonaCodigo = parts[0].trim();
      zonaDesc = parts[1].trim();
    } else if (zonaMin.includes("mista")) {
      zonaCodigo = "ZM";
    } else if (zonaMin.includes("central")) {
      zonaCodigo = "ZC";
    } else if (zonaMin.includes("residencial 1") || zonaMin.includes("zr1")) {
      zonaCodigo = "ZR1";
    } else if (zonaMin.includes("preservação") || zonaMin.includes("zca")) {
      zonaCodigo = "ZCA";
    } else {
      zonaCodigo = data.zona.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
    }
  }

  document.getElementById("res-zona-codigo").textContent = zonaCodigo;
  document.getElementById("res-zona").textContent = zonaDesc;
  document.getElementById("res-justificativa").textContent = data.justificativa;

  const usosPermitidos = MAPEAMENTO_USOS[zonaCodigo.toUpperCase().replace("-E", "EXP")] || ["CSI", "SEAP", "EVC", "UE"];

  usesContainer.innerHTML = "";
  usosPermitidos.forEach((uso) => {
    const span = document.createElement("span");
    span.className = "use-tag";
    span.textContent = uso;
    span.title = DESCRICOES_USO[uso] || "Uso urbano";
    usesContainer.appendChild(span);
  });

  let parecerConsolidado = data.parecer;
  let justificativaConsolidada = data.justificativa;
  let requisitosConsolidados = data.requisitos_legais ? [...data.requisitos_legais] : [];

  cnaeVerdictBox.classList.add("hidden");

  if (cnaeValor) {
    const cnaeBadge = document.getElementById("cnae-badge");
    const cnaeJustificativa = document.getElementById("cnae-justificativa");

    cnaeVerdictBox.classList.remove("hidden");
    cnaeBadge.className = "cnae-badge cnae-badge-vistoria";
    cnaeBadge.innerHTML = `${ICONES.carregando}<span>Consultando atividade...</span>`;
    cnaeJustificativa.textContent = "Buscando a descrição oficial da atividade...";

    const atividade = await analisarAtividadeCNAE(cnaeValor);

    if (!atividade) {
      cnaeVerdictBox.classList.add("hidden");
    } else {
      const desc = esc(atividade.desc);
      const cat = esc(atividade.cat);
      const zona = esc(zonaCodigo);

      cnaeBadge.className = "cnae-badge";

      if (usosPermitidos.includes(atividade.cat)) {
        if (data.parecer === "Necessita de Vistoria" || data.parecer === "Inapto") {
          parecerConsolidado = data.parecer;
          cnaeBadge.classList.add("cnae-badge-vistoria");
          cnaeBadge.innerHTML = `${ICONES.alerta} Vistoria necessária`;
          cnaeJustificativa.innerHTML = `A atividade <strong>${desc}</strong> (CNAE enquadrado em <strong>${cat}</strong>) é compatível com o zoneamento <strong>${zona}</strong>, porém o local exige vistoria física prévia para liberação.`;
        } else {
          parecerConsolidado = "Apto";
          cnaeBadge.classList.add("cnae-badge-apto");
          cnaeBadge.innerHTML = `${ICONES.check} Atividade permitida`;
          cnaeJustificativa.innerHTML = `A atividade <strong>${desc}</strong> (CNAE enquadrado em <strong>${cat}</strong>) é compatível com o zoneamento <strong>${zona}</strong> no horário diurno regular.`;
        }

        if (atividade.cat_noturno) {
          const noturno = esc(atividade.cat_noturno);
          const permitido = usosPermitidos.includes(atividade.cat_noturno);
          const msg = permitido
            ? `Se o estabelecimento operar entre <strong>22h e 06h</strong>, o enquadramento passa para <strong>${noturno}</strong> (Gerador de Ruído Noturno).`
            : `Se o estabelecimento operar entre <strong>22h e 06h</strong>, o enquadramento passa para <strong>${noturno}</strong> e a atividade torna-se <strong>vedada</strong> no zoneamento ${zona}.`;
          cnaeJustificativa.innerHTML += alertaCnae(permitido ? "" : "alerta-vedado", "Funcionamento noturno (Decreto 30.529/2025):", msg);
        }

        if (atividade.cat_porte) {
          let descMetragem = "Se a área construída ou do terreno exceder o limite da categoria, ou houver frota de veículos";
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

          const porte = esc(atividade.cat_porte);
          const permitido = usosPermitidos.includes(atividade.cat_porte);
          const msg = permitido
            ? `${descMetragem}, o enquadramento passa para <strong>${porte}</strong> (admitido no zoneamento ${zona}).`
            : `${descMetragem}, o enquadramento passa para <strong>${porte}</strong> e a atividade torna-se <strong>incompatível</strong> com o zoneamento ${zona}.`;
          cnaeJustificativa.innerHTML += alertaCnae(permitido ? "alerta-porte" : "alerta-vedado", "Porte do estabelecimento (Decreto 30.529/2025):", msg);
        }
      } else {
        parecerConsolidado = "Inapto";
        cnaeBadge.classList.add("cnae-badge-inapto");
        cnaeBadge.innerHTML = `${ICONES.x} Atividade proibida`;
        cnaeJustificativa.innerHTML = `A atividade <strong>${desc}</strong> (CNAE classificado em <strong>${cat}</strong>) é <strong>vedada</strong> para este zoneamento. A zona <strong>${zona}</strong> não admite a categoria <strong>${cat}</strong>, de acordo com o Art. 118 da Lei 13.123/2025 e o Decreto 30.529/2025.`;
        justificativaConsolidada = `${zonaDesc} (${zonaCodigo}). A atividade consultada (${cnaeValor} - ${atividade.desc}) é vedada neste zoneamento por estar classificada na categoria ${atividade.cat} (Art. 118 da Lei 13.123/2025 e Decreto 30.529/2025).`;
        requisitosConsolidados = [
          `Atividade (CNAE ${cnaeValor}) incompatível com o zoneamento ${zonaCodigo}`,
          "Vedada a concessão de alvará ou autorização de funcionamento para esta categoria neste endereço"
        ];
      }
    }
  }

  document.getElementById("res-justificativa").textContent = justificativaConsolidada;

  reqList.innerHTML = "";
  requisitosConsolidados.forEach((req) => {
    const li = document.createElement("li");
    li.innerHTML = ICONES.seta;
    const texto = document.createElement("span");
    texto.textContent = req;
    li.appendChild(texto);
    reqList.appendChild(li);
  });

  badge.className = "badge";
  if (parecerConsolidado === "Apto") {
    badge.classList.add("badge-apto");
    badge.innerHTML = `${ICONES.check} Apto`;
  } else if (parecerConsolidado === "Inapto") {
    badge.classList.add("badge-inapto");
    badge.innerHTML = `${ICONES.x} Inapto`;
  } else {
    badge.classList.add("badge-vistoria");
    badge.innerHTML = `${ICONES.alerta} Necessita vistoria`;
  }
}

function atualizarMetaImpressao() {
  const codigo = codigoConsultaAtual || document.getElementById("res-codigo-consulta").textContent;
  document.getElementById("print-protocolo").textContent = codigo;
  document.getElementById("print-data").textContent = dataHoraConsultaAtual || new Date().toLocaleString("pt-BR");
}

function salvarOuImprimirPDF() {
  atualizarMetaImpressao();
  exibirToast("Preparando o laudo para salvar ou imprimir...");

  map.invalidateSize();
  if (marker) {
    map.setView(marker.getLatLng(), map.getZoom() || 16, { animate: false });
  }

  setTimeout(() => window.print(), 300);
}

async function compartilharLaudo() {
  const codigo = codigoConsultaAtual || document.getElementById("res-codigo-consulta").textContent;
  const parecer = document.getElementById("parecer-badge").innerText.trim();
  const zona = document.getElementById("res-zona-codigo").innerText.trim();
  const tipo = tipoComercioSelecionado === "ambulante" ? "Comércio Ambulante" : "Comércio Fixo";
  const endereco = ultimoPonto ? ultimoPonto.logradouro : "Sorocaba/SP";

  const link = window.location.href;
  const resumo = `Viabilidade espacial - Sorocaba\nCódigo da consulta: ${codigo}\nEndereço: ${endereco}\nModalidade: ${tipo}\nZoneamento: ${zona}\nParecer: ${parecer}\n\nLink da consulta: ${link}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `Viabilidade espacial Sorocaba (${codigo})`, text: resumo, url: link });
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    exibirToast("Link da consulta copiado para a área de transferência.");
  } catch (e) {
    window.prompt("Copie o link da consulta:", link);
  }
}

function exibirToast(mensagem) {
  let toast = document.querySelector(".toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.innerHTML = ICONES.info;
  const texto = document.createElement("span");
  texto.textContent = mensagem;
  toast.appendChild(texto);

  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
}
