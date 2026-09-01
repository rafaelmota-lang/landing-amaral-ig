import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

execSync('vite build --ssr src/entry-server.jsx --outDir dist-ssr', {
  stdio: 'inherit',
});

const ssrFile = readdirSync('dist-ssr').find((f) => f.startsWith('entry-server'));
const { renderApp } = await import(pathToFileURL(path.resolve('dist-ssr', ssrFile)).href);

// Páginas de campanha: mesma LP, uma URL por plataforma, para o relatório separar
// a origem e para a mensagem do WhatsApp chegar marcada. São variantes do MESMO
// app: nada de conteúdo duplicado para manter.
const VARIANTES = [
  { origem: 'site',   dir: '',       indexavel: true  },
  { origem: 'google', dir: 'google', indexavel: false },
  { origem: 'meta',   dir: 'meta',   indexavel: false },
];

const indexPath = 'dist/index.html';
const htmlBase = readFileSync(indexPath, 'utf8');

globalThis.__ORIGEM__ = 'site';
const appHtml = renderApp();

let html = htmlBase;

const jsMatch = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
const mainJs = jsMatch ? jsMatch[1] : null;

html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

if (mainJs && !html.includes(`rel="modulepreload" href="${mainJs}"`)) {
  html = html.replace(
    '</head>',
    `<link rel="modulepreload" href="${mainJs}" crossorigin>\n</head>`
  );
}

writeFileSync(indexPath, html);

// Gera /google/index.html e /meta/index.html a partir do mesmo build.
// noindex + canonical para a raiz: as variantes existem para campanha paga, não
// para busca orgânica, e sem isso seriam conteúdo duplicado da raiz.
const CANONICAL = 'https://instagram.amaralebohrer.com.br/';
for (const v of VARIANTES) {
  if (!v.dir) continue;
  globalThis.__ORIGEM__ = v.origem;
  const corpo = renderApp();
  let saida = htmlBase.replace('<div id="root"></div>', `<div id="root">${corpo}</div>`);

  if (mainJs && !saida.includes(`rel="modulepreload" href="${mainJs}"`)) {
    saida = saida.replace('</head>', `<link rel="modulepreload" href="${mainJs}" crossorigin>\n</head>`);
  }
  // remove o canonical que veio do template base antes de injetar o nosso,
  // senão a variante sai com duas tags canonical concorrentes.
  saida = saida.replace(/\s*<link rel="canonical"[^>]*>/gi, '');
  saida = saida.replace(
    '</head>',
    `<meta name="robots" content="noindex, follow">\n<link rel="canonical" href="${CANONICAL}">\n</head>`
  );
  // assets são referenciados por caminho absoluto (/assets/...), então funcionam na subpasta
  mkdirSync(path.join('dist', v.dir), { recursive: true });
  writeFileSync(path.join('dist', v.dir, 'index.html'), saida);
  console.log(`✓ Prerendered dist/${v.dir}/index.html  (origem: ${v.origem})`);
}

rmSync('dist-ssr', { recursive: true, force: true });

console.log('✓ Prerendered dist/index.html');
