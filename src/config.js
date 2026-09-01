// Roteamento de WhatsApp da LP do Instagram.
// Substitui a página de captura do Leadster: o CTA vai direto para o WhatsApp.
//
// POR QUE SORTEIO PONDERADO E NÃO ROUND-ROBIN:
// round-robin com contador em localStorage (padrão usado hoje em ml/shopee) NÃO
// distribui: o estado é por navegador, então todo visitante novo começa do mesmo
// ponto. Sorteio ponderado converge para a distribuição desejada no agregado e
// o campo `peso` permite mandar mais volume para quem tem mais capacidade.
//
// STICKY: quem volta ao site fala com a mesma pessoa (evita o lead ser atendido
// por dois advogados diferentes).

export const WHATSAPP_POOL = [
  // Conferidos no Digisac em 2026-08-31 23:xx: conectados e NAO arquivados.
  { numero: '5551999711399', peso: 1 }, // Disponivel - F - 1399  (conectado)
  { numero: '5511911581515', peso: 1 }, // Disponivel - F - 1515  (conectado)
  { numero: '5511926878173', peso: 1 }, // Fluxo Juridico (fora do Digisac)

  // ---------------------------------------------------------------------
  // REMOVIDOS EM 2026-08-31 — ARQUIVADOS E DESCONECTADOS NO DIGISAC.
  // Estavam "Disponivel / isConnected=true" quando o pool foi montado de
  // manha; a noite apareceram arquivados. Enquanto estiveram no pool,
  // ~50% dos leads pagos foram para WhatsApp morto.
  //   { numero: '5511997571221' },  // Disponivel - F - 1221  ARQUIVADO
  //   { numero: '5511972021019' },  // Disponivel - F - 1019  ARQUIVADO
  //   { numero: '555180230806'  },  // Disponivel - F - 0806  ARQUIVADO
  //
  // ANTES DE REATIVAR QUALQUER UM: conferir isConnected=true E archivedAt=null
  // em GET /services do Digisac. Nao basta o numero existir.
  // ---------------------------------------------------------------------
];

// ---------------------------------------------------------------------------
// NOTA: esta LP roteia para DOIS CRMs de WhatsApp diferentes.
//
//   5 números  -> Digisac  (tomazapp.digisac.app)
//   1 número   -> Fluxo Jurídico (5511926878173)
//
// Consequências, para quem for mexer nisso depois:
//   - não existe visão única do funil desta LP: o relatório precisa somar duas
//     fontes, e "quantos leads esta página gerou" tem duas respostas parciais;
//   - o coletor digisac-meta-capi, que manda desfecho de lead para a Meta CAPI,
//     cobre só o lado Digisac. O lead que cair no Fluxo Jurídico fica fora da
//     atribuição por lá;
//   - o texto "#Meta - ..." da MENSAGEM_INICIAL é hoje o único marcador comum
//     aos dois lados, e o visitante pode apagá-lo antes de enviar.
//
// Isso é fato do estado atual, não recomendação. A escolha de CRM oficial é a
// decisão D1 de PENDENCIAS-PAINEIS.md, ainda em aberto.
// ---------------------------------------------------------------------------

import { ORIGENS, detectarOrigem, codigoDoClique } from './origem.js';

export const ASSUNTO = 'Quero recuperar minha conta do Instagram';

// Mensagem do HTML pré-renderizado da raiz. As páginas /google/ e /meta/ e o
// sorteio real montam a mensagem no cliente, via montarLink().
export const MENSAGEM_INICIAL = `${ORIGENS.site.tag} - ${ASSUNTO}`;

const CHAVE_STICKY = 'ab_ig_wpp_v2';  // v2: invalida o sticky antigo, que prendia visitantes nos numeros arquivados

export function escolherNumero() {
  try {
    const salvo = localStorage.getItem(CHAVE_STICKY);
    const jaEscolhido = WHATSAPP_POOL.find((p) => p.numero === salvo);
    if (jaEscolhido) return jaEscolhido;
  } catch (e) {}

  const total = WHATSAPP_POOL.reduce((s, p) => s + p.peso, 0);
  let r = Math.random() * total;
  const escolhido = WHATSAPP_POOL.find((p) => (r -= p.peso) < 0) || WHATSAPP_POOL[0];

  try { localStorage.setItem(CHAVE_STICKY, escolhido.numero); } catch (e) {}
  return escolhido;
}

export function montarMensagem() {
  const origem = detectarOrigem();
  const tag = (ORIGENS[origem] || ORIGENS.site).tag;
  return `${tag} - ${ASSUNTO}${codigoDoClique()}`;
}

export function montarLink(numero) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(montarMensagem())}`;
}

// Link padrão do HTML pré-renderizado (o prerender roda sem localStorage).
// É FUNÇÃO, não const: a mensagem depende da origem, e a origem só é conhecida
// na hora do render — no build por variante, no cliente pelo pathname. Como
// const, seria congelada no import e as três páginas sairiam com a mesma tag.
export function linkPadrao() {
  return montarLink(WHATSAPP_POOL[0].numero);
}
