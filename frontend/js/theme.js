// carregado no <head> para a página já abrir no tema salvo, sem piscar
(function () {
  var raiz = document.documentElement;
  var tema = null;
  try {
    tema = localStorage.getItem('theme');
    if (localStorage.getItem('highContrast') === 'true') raiz.setAttribute('data-contrast', 'high');
    var escala = parseFloat(localStorage.getItem('fontScale'));
    if (escala) raiz.style.fontSize = (escala * 100) + '%';
  } catch (e) {}
  if (!tema) {
    tema = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  raiz.setAttribute('data-theme', tema);
})();
