// Glossário Legal e Regulatório de Comércio e Zoneamento - Sorocaba
const TERMOS_GLOSSARIO = [
  {
    termo: "Ambulante",
    categoria: "Decreto 26.501",
    baseLegal: "Decreto nº 26.501/2021, Art. 1º",
    descricao: "Pessoa física civilmente capaz ou jurídica (MEI/Microempresa) que exerce pessoalmente, por conta própria e a seu risco, pequena atividade comercial em via pública ou de porta em porta."
  },
  {
    termo: "C.A.C.A. (Comissão de Análise)",
    categoria: "Órgãos",
    baseLegal: "Decreto nº 26.501/2021, Art. 3º",
    descricao: "Comissão de Análise do Comércio Ambulante. Órgão colegiado multidisciplinar (SEDETTUR, Trânsito, Guarda Municipal, VISA, Solo, Fiscalização e Representante dos Ambulantes) responsável por analisar e deliberar sobre a concessão de licenças."
  },
  {
    termo: "Autorização Precária",
    categoria: "Decreto 26.501",
    baseLegal: "Decreto nº 26.501/2021, Art. 2º",
    descricao: "Ato administrativo unilateral, pessoal, intransferível e não oneroso que permite o exercício da atividade comercial em vias públicas. Pode ser revogado a qualquer tempo pela Prefeitura sem direito a indenização."
  },
  {
    termo: "Categoria A (Veículos Adaptados)",
    categoria: "Equipamentos",
    baseLegal: "Decreto nº 26.501/2021, Art. 5º, I",
    descricao: "Equipamentos montados em veículos a motor ou rebocados, com comprimento máximo de 4,00m e largura máxima de 2,20m. Devem ser desmobilizados e recolhidos obrigatoriamente ao final de cada expediente."
  },
  {
    termo: "Categoria B (Carrinhos e Tabuleiros)",
    categoria: "Equipamentos",
    baseLegal: "Decreto nº 26.501/2021, Art. 5º, II",
    descricao: "Equipamentos comercializados em carrinhos ou tabuleiros movidos ou tracionados por força humana, com área máxima autorizada de 4,00m²."
  },
  {
    termo: "Categoria C (Barracas Desmontáveis)",
    categoria: "Equipamentos",
    baseLegal: "Decreto nº 26.501/2021, Art. 5º, III",
    descricao: "Equipamentos de comércio montados em estruturas e barracas desmontáveis com área máxima ocupada de até 4,00m²."
  },
  {
    termo: "Ponto Fixo",
    categoria: "Decreto 26.501",
    baseLegal: "Decreto nº 26.501/2021, Art. 4º, §3º",
    descricao: "Autorização para permanência estacionária em local, praça ou endereço delimitado no Alvará, vedada a alteração de local durante o período de trabalho."
  },
  {
    termo: "Porta a Porta",
    categoria: "Decreto 26.501",
    baseLegal: "Decreto nº 26.501/2021, Art. 4º, §4º",
    descricao: "Atividade comercial itinerante e não estacionária, transitando pelas vias públicas para a oferta direta de produtos ou serviços a residentes e pedestres."
  },
  {
    termo: "Recuo de Calçada (1,20m)",
    categoria: "Restrições Urbanas",
    baseLegal: "Decreto nº 26.501/2021, Art. 24, I",
    descricao: "Obrigação de manter uma faixa livre contínua de no mínimo 1,20m na calçada para permitir a circulação desimpedida de pedestres e cadeirantes."
  },
  {
    termo: "Distância Mínima de 5 Metros",
    categoria: "Restrições Urbanas",
    baseLegal: "Decreto nº 26.501/2021, Art. 24, II",
    descricao: "Afastamento mínimo obrigatório de 5m de faixas de pedestres, pontos de ônibus/táxi, rebaixamentos PCD, esquinas, hidrantes, escolas, hospitais e portas de estabelecimentos comerciais do mesmo segmento."
  },
  {
    termo: "Sachê Individual Obrigatório",
    categoria: "Regras Sanitárias",
    baseLegal: "Decreto nº 26.501/2021, Art. 9º, III",
    descricao: "Norma da Vigilância Sanitária que proíbe expressamente bisnagas e recipientes de molhos de uso repetitivo. Condimentos (ketchup, maionese, mostarda) devem ser servidos obrigatoriamente em sachês individuais lacrados."
  },
  {
    termo: "Proibição de Bebidas Alcoólicas",
    categoria: "Regras Sanitárias",
    baseLegal: "Decreto nº 26.501/2021, Art. 7º, parágrafo único",
    descricao: "Vedação absoluta da comercialização de qualquer tipo de bebida alcoólica por ambulantes autorizados em logradouros públicos."
  },
  {
    termo: "Boas Práticas de Manipulação",
    categoria: "Regras Sanitárias",
    baseLegal: "Decreto nº 26.501/2021, Art. 12, IV",
    descricao: "Certificado obrigatório de curso de higiene e manuseio de alimentos expedido por órgão técnico credenciado, exigido para todos os ambulantes do setor alimentício."
  },
  {
    termo: "Base Operacional de Apoio",
    categoria: "Regras Sanitárias",
    baseLegal: "Decreto nº 26.501/2021, Art. 12, VI",
    descricao: "Declaração formal do local de apoio utilizado pelo ambulante para a higienização, preparação prévia, armazenamento e guarda noturna dos equipamentos e insumos."
  },
  {
    termo: "Recadastramento Anual",
    categoria: "Decreto 26.501",
    baseLegal: "Decreto nº 26.501/2021, Art. 23",
    descricao: "Renovação obrigatória da licença comercial que deve ser realizada impreterivelmente no primeiro trimestre de cada ano (Janeiro, Fevereiro e Março)."
  },
  {
    termo: "CSI (Comércio e Serviços de Pequeno Porte)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Categoria de uso que engloba estabelecimentos de comércio varejista e serviços de bairro (padarias, farmácias, pequenos mercados, lojas de roupas)."
  },
  {
    termo: "SEAP (Serviço e Apoio)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Atividades de escritório, consultórios, salões de beleza e clínicas. Permitido na maioria das zonas, inclusive em ZR1 e ZRDS."
  },
  {
    termo: "EVC (Escritório Virtual e Contato)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Sedes fiscais, coworkings e escritórios sem estoque ou tráfego de mercadorias. Permitido em praticamente todas as zonas urbanas e ambientais."
  },
  {
    termo: "GRN (Gerador de Ruído Noturno)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Estabelecimentos com atividade sonora no período das 22h às 06h (bares com som, casas de show, boates). Proibido em zonas residenciais como ZR1 e ZR3."
  },
  {
    termo: "GRD (Gerador de Ruído Diurno)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Atividades industriais ou de serviços com ruído diurno (oficinas mecânicas, marcenarias, serralherias, academias de grande porte)."
  },
  {
    termo: "PGTI (Polo Gerador de Tráfego)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Empreendimentos atratores de grande volume de veículos leves (shoppings, hipermercados, agências bancárias centralizadas)."
  },
  {
    termo: "PGTP (Gerador de Tráfego Pesado)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Instalações de logística e transporte com movimentação intensa de caminhões e veículos pesados (transportadoras, grandes depósitos)."
  },
  {
    termo: "TL (Turismo e Lazer)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Empreendimentos voltados ao turismo, hospedagem recreativa e lazer (hotéis-fazenda, parques temáticos, clubes de campo)."
  },
  {
    termo: "UAI (Uso de Alta Incomodidade)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Atividades comerciais ou industriais de alto risco ou impacto ambiental (postos de combustíveis, distribuidores de GLP/gás, indústrias químicas)."
  },
  {
    termo: "UE (Uso Especial)",
    categoria: "Zoneamento",
    baseLegal: "Lei nº 13.123/2025, Art. 118",
    descricao: "Equipamentos comunitários e de infraestrutura pública (escolas, hospitais, creches, cemitérios, fóruns e secretarias)."
  },
  {
    termo: "SEMEPP / SEDETTUR",
    categoria: "Órgãos",
    baseLegal: "Decreto nº 26.501/2021, Art. 12",
    descricao: "Secretaria de Desenvolvimento Econômico, Trabalho e Turismo de Sorocaba, responsável pela gestão das licenças comerciais e acompanhamento dos permissionários."
  },
  {
    termo: "CNAE (Classificação de Atividades)",
    categoria: "Comércio Fixo",
    baseLegal: "Lei nº 13.123/2025 & IBGE",
    descricao: "Classificação Nacional de Atividades Econômicas. Código numérico padronizado que identifica a atividade do estabelecimento comercial fixo para cruzamento direto com a matriz de uso de solo (Art. 118)."
  },
  {
    termo: "Comércio Fixo (Estabelecimento)",
    categoria: "Comércio Fixo",
    baseLegal: "Lei nº 11.367/2016",
    descricao: "Atividade comercial ou de prestação de serviços instalada em edificação/imóvel privado permanente com Alvará de Funcionamento emitido pela Prefeitura."
  },
  {
    termo: "Liberdade Econômica (Baixo Risco)",
    categoria: "Comércio Fixo",
    baseLegal: "Lei nº 12.346/2021",
    descricao: "Lei municipal que garante a dispensa de alvarás e licenças prévias de funcionamento para estabelecimentos comerciais fixos com CNAE classificado em Baixo Risco (Nível I)."
  },
  {
    termo: "Alvará Noturno Especial",
    categoria: "Comércio Fixo",
    baseLegal: "Lei nº 10.052/2012",
    descricao: "Autorização municipal obrigatória concedida a estabelecimentos comerciais fixos (bares, restaurantes, casas de show) para funcionamento após as 23h00."
  },
  {
    termo: "Mesas e Cadeiras na Calçada",
    categoria: "Comércio Fixo",
    baseLegal: "Lei nº 13.217/2025",
    descricao: "Regulamento para ocupação de passeio público por estabelecimentos comerciais fixos (bares e restaurantes), mantendo obrigatoriamente a faixa livre mínima de 1,20m."
  },
  {
    termo: "Decreto nº 30.529/2025 (Enquadramento CNAE)",
    categoria: "Comércio Fixo",
    baseLegal: "Decreto nº 30.529/2025 & Lei nº 13.123/2025",
    descricao: "Decreto municipal oficial que estabelece a tabela de correspondência de cada código CNAE Subclasses 2.3 às categorias do Plano Diretor (CSI, SEAP, EVC, PGTI, GRN, etc.), considerando área construída, capacidade de público e horário noturno (22h às 06h)."
  }
];

let categoriaAtual = 'todas';

// Renderização dos cards
function renderizarGlossario(termos) {
  const container = document.getElementById("glossary-grid");
  if (!container) return;

  if (termos.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem; opacity:0.5;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <p style="font-size: 1.1rem; font-weight: 600;">Nenhum termo localizado</p>
        <p style="font-size: 0.9rem;">Tente pesquisar por palavras como "GRN", "calçada", "Decreto" ou "Sachê".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = termos.map(t => `
    <div class="term-card">
      <div class="term-header">
        <h3 class="term-title">${t.termo}</h3>
        <span class="term-badge">${t.categoria}</span>
      </div>
      <p class="term-desc">${t.descricao}</p>
      <div class="term-base-legal">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        <span>${t.baseLegal}</span>
      </div>
    </div>
  `).join('');
}

// Filtro por texto e categoria
function filtrarGlossario() {
  const searchVal = (document.getElementById("glossary-search")?.value || "").toLowerCase().trim();

  const filtrados = TERMOS_GLOSSARIO.filter(item => {
    const bateCategoria = (categoriaAtual === 'todas') || (item.categoria.toLowerCase() === categoriaAtual.toLowerCase());
    const bateTexto = !searchVal || 
      item.termo.toLowerCase().includes(searchVal) || 
      item.descricao.toLowerCase().includes(searchVal) || 
      item.baseLegal.toLowerCase().includes(searchVal) ||
      item.categoria.toLowerCase().includes(searchVal);
    
    return bateCategoria && bateTexto;
  });

  renderizarGlossario(filtrados);
}

// Alteração de categoria via botões
function setFiltroCategoria(categoria, btnElement) {
  categoriaAtual = categoria;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  filtrarGlossario();
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarGlossario(TERMOS_GLOSSARIO);
});
