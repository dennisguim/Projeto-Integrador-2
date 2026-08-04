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

// Executar verificação ao carregar a página
document.addEventListener('DOMContentLoaded', checkBackendStatus);