// Identifica de qual campanha veio o visitante, para marcar a conversa no WhatsApp.
//
// POR QUE ISSO EXISTE: o lead chega ao WhatsApp por link (wa.me), e link nunca
// carrega ctwaClid — esse identificador só existe em clique de anúncio
// Click-to-WhatsApp. Ou seja, o TEXTO da mensagem é o único elo entre o clique
// no anúncio e a conversa no CRM. Sem marcador, todo lead chega igual.

export const ORIGENS = {
  google: { tag: '#Google', rotulo: 'Google Ads' },
  meta:   { tag: '#Meta',   rotulo: 'Meta Ads' },
  youtube:{ tag: '#Youtube',rotulo: 'descrição dos vídeos do YouTube' },
  site:   { tag: '#Site',   rotulo: 'raiz / orgânico' },
};

// Anexa um código curto do clique (gclid/fbclid) ao final da mensagem, dando
// granularidade de CAMPANHA e não só de plataforma. Desligado por padrão porque
// altera o texto que o cliente vê. Ligue quando quiser rastrear anúncio a anúncio.
// Ligado em 27/10/2026 (Rafael) para importar os contratos fechados no Google Ads:
// o final do gclid casa com o click_view da API do Google no dia do lead, que
// devolve o gclid inteiro. 8 caracteres: com 6 houve 3 repetidos em 755 cliques/dia.
// Corrigido em 29/10/2026: o FINAL do gclid é fixo (84 de 85 leads de 28/10 vieram com
// "QAvD_BwE"), então o código passou a ser um hash FNV-1a 32 bits do gclid inteiro, em
// base 36 com 7 caracteres. Para casar: aplicar hashClique() a cada gclid do click_view.
export const INCLUIR_CODIGO_DO_CLIQUE = true;

export function hashClique(id) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0');
}

export function detectarOrigem() {
  // No prerender não existe location: a origem vem do build (prerender.mjs).
  if (typeof location === 'undefined') {
    return (typeof globalThis !== 'undefined' && globalThis.__ORIGEM__) || 'site';
  }
  try {
    const p = (location.pathname || '').toLowerCase();
    if (p.startsWith('/google')) return 'google';
    if (p.startsWith('/meta')) return 'meta';
    if (p.startsWith('/youtube')) return 'youtube';
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
    if (g) return ` [g:${hashClique(g)}]`;
    const f = q.get('fbclid');
    if (f) return ` [f:${hashClique(f)}]`;
  } catch (e) {}
  return '';
}
