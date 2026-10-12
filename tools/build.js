// Gera dist/ a partir de frontend/: JS ofuscado, CSS minificado e HTML sem comentários.
// O código-fonte legível continua em frontend/; em produção publica-se apenas dist/.
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ORIGEM = path.join(__dirname, '..', 'frontend');
const DESTINO = path.join(__dirname, '..', 'dist');

// bases de dados: só ocupam espaço, não têm lógica para esconder
const SO_COPIAR = ['decreto30529_db.js', 'locais_sorocaba_db.js'];
const IGNORAR = ['decreto30529_db.json'];

const OPCOES = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  // os scripts conversam por nomes globais (esc, apiFetch, map...), então esses ficam como estão
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.3,
  deadCodeInjection: false,
  numbersToExpressions: true,
  simplify: true,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  selfDefending: false,
  debugProtection: false,
  sourceMap: false
};

function minificarCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function limparHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s+/gm, '')
    .replace(/\n{2,}/g, '\n');
}

function processar(origem, destino) {
  fs.mkdirSync(destino, { recursive: true });

  for (const item of fs.readdirSync(origem, { withFileTypes: true })) {
    const de = path.join(origem, item.name);
    const para = path.join(destino, item.name);

    if (item.isDirectory()) {
      processar(de, para);
    } else if (IGNORAR.includes(item.name)) {
      continue;
    } else if (item.name.endsWith('.js') && !SO_COPIAR.includes(item.name)) {
      const codigo = fs.readFileSync(de, 'utf8');
      fs.writeFileSync(para, JavaScriptObfuscator.obfuscate(codigo, OPCOES).getObfuscatedCode());
      console.log('ofuscado  ', path.relative(ORIGEM, de));
    } else if (item.name.endsWith('.css')) {
      fs.writeFileSync(para, minificarCss(fs.readFileSync(de, 'utf8')));
      console.log('minificado', path.relative(ORIGEM, de));
    } else if (item.name.endsWith('.html')) {
      fs.writeFileSync(para, limparHtml(fs.readFileSync(de, 'utf8')));
    } else {
      fs.copyFileSync(de, para);
    }
  }
}

fs.rmSync(DESTINO, { recursive: true, force: true });
processar(ORIGEM, DESTINO);
console.log('pronto:', DESTINO);
