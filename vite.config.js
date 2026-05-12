import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const TWEAKS = process.env.TWEAKS === '1';

function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const cssAssets = Object.values(bundle).filter(
          (a) => a.type === 'asset' && a.fileName.endsWith('.css')
        );
        if (cssAssets.length === 0) return html;
        const styleTag = cssAssets
          .map((a) => `<style>${a.source}</style>`)
          .join('\n');
        const cssNames = cssAssets.map((a) => a.fileName);
        let next = html;
        for (const name of cssNames) {
          next = next.replace(
            new RegExp(`<link[^>]+href="[^"]*${name}"[^>]*>\\s*`, 'g'),
            ''
          );
        }
        next = next.replace('</head>', `${styleTag}\n</head>`);
        return next;
      },
    },
  };
}

export default defineConfig({
  define: {
    __TWEAKS__: JSON.stringify(TWEAKS),
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/client': 'preact/compat/client',
      'react-dom/server': 'preact/compat/server',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('components/tweaks/')) return 'tweaks';
        },
      },
    },
  },
  plugins: [preact(), inlineCss()],
});
