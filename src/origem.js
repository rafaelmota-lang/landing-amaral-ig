// Identifica de qual campanha veio o visitante, para marcar a conversa no WhatsApp.
//
// POR QUE ISSO EXISTE: o lead chega ao WhatsApp por link (wa.me), e link nunca
// carrega ctwaClid — esse identificador só existe em clique de anúncio
// Click-to-WhatsApp. Ou seja, o TEXTO da mensagem é o único elo entre o clique
// no anúncio e a conversa no CRM. Sem marcador, todo lead chega igual.

export const ORIGENS = {
  google: { tag: '#Google', rotulo: 'Google Ads' },
  meta:   { tag: '#Meta',   rotulo: 'Meta Ads' },
  site:   { tag: '#Site',   rotulo: 'raiz / orgânico' },
};

// Anexa um código curto do clique (gclid/fbclid) ao final da mensagem, dando
// granularidade de CAMPANHA e não só de plataforma. Desligado por padrão porque
// altera o texto que o cliente vê. Ligue quando quiser rastrear anúncio a anúncio.
export const INCLUIR_CODIGO_DO_CLIQUE = false;

export function detectarOrigem() {
  // No prerender não existe location: a origem vem do build (prerender.mjs).
  if (typeof location === 'undefined') {
    return (typeof globalThis !== 'undefined' && globalThis.__ORIGEM__) || 'site';
  }
  try {
    const p = (location.pathname || '').toLowerCase();
    if (p.startsWith('/google')) return 'google';
    if (p.startsWith('/meta')) return 'meta';
    const src = new URLSearchParams(location.search).get('src');
    if (src && ORIGENS[src.toLowerCase()]) return src.toLowerCase();
  } catch (e) {}
  return 'site';
}

export function codigoDoClique() {
  if (!INCLUIR_CODIGO_DO_CLIQUE) return '';
  try {
    const q = new URLSearchParams(location.search);
    const g = q.get('gclid') || q.get('gbraid') || q.get('wbraid');
    if (g) return ` [g:${g.slice(-6)}]`;
    const f = q.get('fbclid');
    if (f) return ` [f:${f.slice(-6)}]`;
  } catch (e) {}
  return '';
}
