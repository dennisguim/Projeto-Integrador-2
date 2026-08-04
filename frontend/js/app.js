// Alternador de Tema Claro/Escuro com Persistência no LocalStorage
const themeToggleBtn = document.getElementById('theme-toggle');

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  themeToggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
}

// Checagem de Conexão com o Backend FastAPI
async function checkBackendStatus() {
  const syncText = document.getElementById('sync-status-text');
  const syncBadge = document.querySelector('.sync-badge');

  try {
    const response = await fetch('http://localhost:8000/status');
    if (response.ok) {
      syncText.innerText = 'Online';
      syncBadge.style.color = 'var(--status-apto)';
    } else {
      throw new Error('Off');
    }
  } catch (error) {
    syncText.innerText = 'Servidor Offline';
    syncBadge.style.color = 'var(--status-inapto)';
  }
}

// Executar verificação ao carregar a página
document.addEventListener('DOMContentLoaded', checkBackendStatus);