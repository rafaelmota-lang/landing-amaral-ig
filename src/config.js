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
  // Redes sociais, alternando entre os dois canais vivos (2026-10-10).
  { numero: '5511926878173', peso: 1 }, // FJ "Z-API - Redes Sociais"
  { numero: '5511926470895', peso: 1 }, // FJ "Canal Rede Social" (coex, novo)
  // 2026-10-10: 5511926878630 (coex) BANIDO, saiu. Historico completo de
  // trocas no repo landing-amaral-ig. A API do FJ nao denuncia banimento:
  // so teste de envio real prova que o numero esta vivo.
];

// ---------------------------------------------------------------------------
// NOTA: esta LP roteia para DOIS CRMs de WhatsApp diferentes.
//
//   5511926878630 -> Fluxo Juridico, canal "Canal Rede Social" (coexistencia)
//
// Destino unico desde 2026-09-16: nao ha rodizio nesta LP. A distribuicao
// entre atendentes e responsabilidade da fila do proprio Fluxo Juridico.
//
// Desde 2026-09-03 os DOIS vivem no Fluxo Juridico: nao ha mais nada desta LP
// no Digisac, entao o coletor digisac-meta-capi deixou de cobrir esta LP.
//
// O sorteio alterna entre os dois (peso 1 e 1, ~50/50). Dentro de cada um, a
// distribuicao entre atendentes e responsabilidade da fila da propria
// plataforma — a LP nao sabe nem controla isso.
//
// Consequencias, para quem for mexer nisso depois:
//   - nao existe visao unica do funil desta LP: o relatorio precisa somar duas
//     fontes, e "quantos leads esta pagina gerou" tem duas respostas parciais;
//   - o coletor digisac-meta-capi, que manda desfecho de lead para a Meta CAPI,
//     cobre so o lado Digisac. O lead que cair no Fluxo Juridico fica fora da
//     atribuicao por la;
//   - o texto "#Google -" / "#Meta -" da mensagem e hoje o unico marcador comum
//     aos dois lados, e o visitante pode apaga-lo antes de enviar;
//   - o monitor de 6h so enxerga o lado Digisac. Se o numero do Fluxo Juridico
//     cair, metade do trafego pago sangra sem alarme (ver scripts/verificar-pool.py).
//
// Isso e fato do estado atual, nao recomendacao. A escolha de CRM oficial e a
// decisao D1 de PENDENCIAS-PAINEIS.md, ainda em aberto.
// ---------------------------------------------------------------------------

import { ORIGENS, detectarOrigem, codigoDoClique } from './origem.js';

export const ASSUNTO = 'Quero recuperar minha conta do Instagram';

// Mensagem do HTML pré-renderizado da raiz. As páginas /google/ e /meta/ e o
// sorteio real montam a mensagem no cliente, via montarLink().
export const MENSAGEM_INICIAL = `${ORIGENS.site.tag} - ${ASSUNTO}`;

// v4: pool trocado em 2026-09-03. Bump obrigatorio: quem ja tinha o 1120
// salvo ficaria preso a um numero fora do pool ate limpar o navegador.
const CHAVE_STICKY = 'ab_ig_wpp_v11';

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
