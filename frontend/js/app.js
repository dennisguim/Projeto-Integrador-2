// Alternador de Tema Claro/Escuro com Persistência no LocalStorage
const themeToggleBtn = document.getElementById('theme-toggle');

// Ícones SVG Outline (Lucide style) para Tema
const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`;
const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'light' ? moonSvg : sunSvg;
  }
}

// Checagem de Conexão com o Backend FastAPI
async function checkBackendStatus() {
  const syncText = document.getElementById('sync-status-text');
  const syncBadge = document.querySelector('.sync-badge');

  if (!syncText || !syncBadge) return;

  try {
    const response = await fetch('http://localhost:8000/status');
    if (response.ok) {
      syncText.innerText = 'Online';
      syncBadge.style.color = 'var(--status-apto)';
      syncBadge.style.background = 'rgba(16, 185, 129, 0.1)';
      syncBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    } else {
      throw new Error('Off');
    }
  } catch (error) {
    syncText.innerText = 'Servidor Offline';
    syncBadge.style.color = 'var(--status-inapto)';
    syncBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    syncBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
  }
}

// Lógica de Acessibilidade: Injeção Dinâmica dos Controles e VLibras
function initAccessibility() {
  // 1. Injetar Divs estruturais do VLibras
  const vlibrasDiv = document.createElement('div');
  vlibrasDiv.setAttribute('vw', '');
  vlibrasDiv.className = 'enabled';
  vlibrasDiv.innerHTML = `
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  `;
  document.body.appendChild(vlibrasDiv);

  // Injetar Script Oficial do VLibras
  const vlibrasScript = document.createElement('script');
  vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  vlibrasScript.onload = () => {
    try {
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    } catch (e) {
      console.error("Erro ao iniciar VLibras:", e);
    }
  };
  document.body.appendChild(vlibrasScript);

  // 2. Injetar Widget Flutuante de Acessibilidade no HTML
  const accWidget = document.createElement('div');
  accWidget.className = 'accessibility-widget';
  accWidget.innerHTML = `
    <button class="acc-main-btn" id="acc-main-btn" title="Menu de Acessibilidade" aria-label="Menu de Acessibilidade">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-accessibility"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4 22h14"/><path d="M20 22h2"/><path d="m12 8-2 10-3-1"/></svg>
    </button>
    <div class="acc-menu" id="acc-menu">
      <h4 class="acc-title">Acessibilidade</h4>
      
      <div class="acc-option">
        <span class="acc-label">Tamanho do Texto:</span>
        <div class="acc-btn-group">
          <button id="btn-font-dec" title="Diminuir Fonte" aria-label="Diminuir Fonte">A-</button>
          <button id="btn-font-reset" title="Tamanho Padrão" aria-label="Tamanho Padrão">A</button>
          <button id="btn-font-inc" title="Aumentar Fonte" aria-label="Aumentar Fonte">A+</button>
        </div>
      </div>
      
      <div class="acc-option">
        <span class="acc-label">Contraste:</span>
        <button id="btn-contrast-toggle" class="btn-contrast" title="Alternar Alto Contraste" aria-label="Alternar Alto Contraste">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-contrast"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>
          Alto Contraste
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(accWidget);

  // 3. Gerenciamento do Painel Flutuante (Abrir / Fechar)
  const mainBtn = document.getElementById('acc-main-btn');
  const menu = document.getElementById('acc-menu');
  
  if (mainBtn && menu) {
    mainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      menu.classList.remove('active');
    });

    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 4. Ajustes Dinâmicos do Tamanho de Fonte (A+, A-, A)
  let currentFontScale = parseFloat(localStorage.getItem('fontScale')) || 1.0;
  applyFontScale(currentFontScale);

  document.getElementById('btn-font-inc').addEventListener('click', () => {
    if (currentFontScale < 1.4) {
      currentFontScale += 0.1;
      localStorage.setItem('fontScale', currentFontScale);
      applyFontScale(currentFontScale);
    }
  });

  document.getElementById('btn-font-dec').addEventListener('click', () => {
    if (currentFontScale > 0.8) {
      currentFontScale -= 0.1;
      localStorage.setItem('fontScale', currentFontScale);
      applyFontScale(currentFontScale);
    }
  });

  document.getElementById('btn-font-reset').addEventListener('click', () => {
    currentFontScale = 1.0;
    localStorage.setItem('fontScale', currentFontScale);
    applyFontScale(currentFontScale);
  });

  function applyFontScale(scale) {
    // Aplica a escala em porcentagem no elemento html (rem acompanha essa alteração)
    document.documentElement.style.fontSize = (scale * 100) + '%';
  }

  // 5. Ajustes de Alto Contraste
  let highContrast = localStorage.getItem('highContrast') === 'true';
  applyContrast(highContrast);

  document.getElementById('btn-contrast-toggle').addEventListener('click', () => {
    highContrast = !highContrast;
    localStorage.setItem('highContrast', highContrast);
    applyContrast(highContrast);
  });

  function applyContrast(enable) {
    if (enable) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }
}

// Inicializar ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  initAccessibility();
});