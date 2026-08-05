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

  // Logística & Alta Incomodidade (PGTP / UAI)
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

// Analisa a atividade buscando a descrição exata na API do IBGE, se online
async function analisarAtividadeCNAE(cnaeString) {
  const clean = cnaeString.replace(/[^0-9]/g, "");
  if (!clean) return null;

  let desc = "";
  let cat = "";

  // 1. Tenta correspondência exata no banco de dados local (desempenho instantâneo)
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
    cat = "PGTP";
    if (!desc) desc = "Transportadoras / Logística e Armazenagem (CNAE Geral)";
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
          cnaeJustificativa.innerHTML = `A atividade <strong>${atividade.desc}</strong> (CNAE enquadrado em <strong>${atividade.cat}</strong>) é <strong>totalmente compatível</strong> com o zoneamento <strong>${zonaCodigo}</strong> de acordo com a Seção II, Art. 118 da Lei 13.123/2025.`;
        }
      } else {
        cnaeBadge.classList.add("cnae-badge-inapto");
        cnaeBadge.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Atividade Proibida
        `;
        cnaeJustificativa.innerHTML = `A atividade <strong>${atividade.desc}</strong> (CNAE classificado em <strong>${atividade.cat}</strong>) é <strong>VEDADA</strong> para este zoneamento. A zona <strong>${zonaCodigo}</strong> não admite a categoria <strong>${atividade.cat}</strong> (excesso de ruído noturno ou impacto urbano incompatível).`;
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