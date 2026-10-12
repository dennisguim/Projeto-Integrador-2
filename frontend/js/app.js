const API_BASE = (document.querySelector('meta[name="api-base"]') || {}).content || 'http://localhost:8000';

const themeToggleBtn = document.getElementById('theme-toggle');

const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`;
const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;

updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  if (!themeToggleBtn) return;
  themeToggleBtn.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
  themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro');
}

// tudo que vem da API, do geocodificador ou do usuário passa por aqui antes de entrar em innerHTML
function esc(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

let csrfToken = null;

async function obterCsrf(renovar) {
  if (csrfToken && !renovar) return csrfToken;
  const resp = await fetch(`${API_BASE}/api/csrf`);
  csrfToken = (await resp.json()).token;
  return csrfToken;
}

async function apiFetch(caminho, opcoes = {}) {
  const metodo = (opcoes.method || 'GET').toUpperCase();
  const headers = {};
  let body;

  if (opcoes.dados !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opcoes.dados);
  }
  if (opcoes.fiscal) {
    headers['Authorization'] = `Bearer ${sessionStorage.getItem('fiscal_token') || ''}`;
  }

  const enviar = async (renovar) => {
    if (metodo !== 'GET') headers['X-CSRF-Token'] = await obterCsrf(renovar);
    return fetch(API_BASE + caminho, { method: metodo, headers, body });
  };

  let resp = await enviar(false);
  if (resp.status === 403 && metodo !== 'GET') {
    resp = await enviar(true);
  }
  return resp;
}

function mensagemErro(resp, dados, padrao) {
  if (dados && typeof dados.detail === 'string') return dados.detail;
  if (resp.status === 429) return 'Muitas tentativas em sequência. Aguarde um minuto e tente de novo.';
  if (resp.status === 422) return 'Confira os dados informados.';
  return padrao;
}

async function checkBackendStatus() {
  const syncText = document.getElementById('sync-status-text');
  const syncBadge = document.querySelector('.sync-badge');
  if (!syncText || !syncBadge) return;

  let online = false;
  try {
    online = (await fetch(`${API_BASE}/status`)).ok;
  } catch (error) {
    online = false;
  }
  syncText.textContent = online ? 'Online' : 'Servidor offline';
  syncBadge.classList.toggle('offline', !online);
}

function initAccessibility() {
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

  const vlibrasScript = document.createElement('script');
  vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  vlibrasScript.onload = () => {
    try {
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    } catch (e) {
      console.error('Erro ao iniciar VLibras:', e);
    }
  };
  document.body.appendChild(vlibrasScript);

  const accWidget = document.createElement('div');
  accWidget.className = 'accessibility-widget';
  accWidget.innerHTML = `
    <button class="acc-main-btn" id="acc-main-btn" title="Menu de Acessibilidade" aria-label="Menu de Acessibilidade">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-accessibility"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4 22h14"/><path d="M20 22h2"/><path d="m12 8-2 10-3-1"/></svg>
    </button>
    <div class="acc-menu" id="acc-menu">
      <h4 class="acc-title">Acessibilidade</h4>

      <div class="acc-option">
        <span class="acc-label">Tamanho do texto</span>
        <div class="acc-btn-group">
          <button id="btn-font-dec" title="Diminuir fonte" aria-label="Diminuir fonte">A-</button>
          <button id="btn-font-reset" title="Tamanho padrão" aria-label="Tamanho padrão">A</button>
          <button id="btn-font-inc" title="Aumentar fonte" aria-label="Aumentar fonte">A+</button>
        </div>
      </div>

      <div class="acc-option">
        <span class="acc-label">Contraste</span>
        <button id="btn-contrast-toggle" class="btn-contrast" title="Alternar alto contraste" aria-label="Alternar alto contraste">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-contrast"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>
          Alto contraste
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(accWidget);

  const mainBtn = document.getElementById('acc-main-btn');
  const menu = document.getElementById('acc-menu');

  mainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
  });
  menu.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => menu.classList.remove('active'));

  let currentFontScale = parseFloat(localStorage.getItem('fontScale')) || 1.0;

  function applyFontScale(scale) {
    // o layout usa rem, então basta mexer no font-size da raiz
    currentFontScale = Math.round(scale * 10) / 10;
    localStorage.setItem('fontScale', currentFontScale);
    document.documentElement.style.fontSize = (currentFontScale * 100) + '%';
  }

  document.getElementById('btn-font-inc').addEventListener('click', () => {
    if (currentFontScale < 1.4) applyFontScale(currentFontScale + 0.1);
  });
  document.getElementById('btn-font-dec').addEventListener('click', () => {
    if (currentFontScale > 0.8) applyFontScale(currentFontScale - 0.1);
  });
  document.getElementById('btn-font-reset').addEventListener('click', () => applyFontScale(1.0));

  let highContrast = localStorage.getItem('highContrast') === 'true';

  document.getElementById('btn-contrast-toggle').addEventListener('click', () => {
    highContrast = !highContrast;
    localStorage.setItem('highContrast', highContrast);
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  initAccessibility();
});
