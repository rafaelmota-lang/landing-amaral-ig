import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

execSync('vite build --ssr src/entry-server.jsx --outDir dist-ssr', {
  stdio: 'inherit',
});

const ssrFile = readdirSync('dist-ssr').find((f) => f.startsWith('entry-server'));
const { renderApp } = await import(pathToFileURL(path.resolve('dist-ssr', ssrFile)).href);
const appHtml = renderApp();

const indexPath = 'dist/index.html';
let html = readFileSync(indexPath, 'utf8');

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
rmSync('dist-ssr', { recursive: true, force: true });

console.log('✓ Prerendered dist/index.html');
