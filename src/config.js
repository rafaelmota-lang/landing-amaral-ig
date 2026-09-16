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
  // Canal "Canal Rede Social" do Fluxo Juridico, modo COEXISTENCIA.
  { numero: '5511926878630', peso: 1 },

  // ---------------------------------------------------------------------
  // HISTORICO DO POOL - ler antes de acrescentar numero.
  //
  // 2026-09-16: 5511926878173 REMOVIDO, o numero foi BANIDO pelo WhatsApp.
  //   Era o canal "Z-API - Redes Sociais" (nao oficial). Por decisao do dono
  //   a LP passa a usar SO o canal de coexistencia de redes sociais.
  //   ATENCAO, ponto cego descoberto aqui: a API do Fluxo Juridico continuou
  //   reportando esse canal como status="connected" mesmo com o numero
  //   banido. O monitor de 6h deu "ok" para um numero morto. Conexao viva no
  //   painel nao prova numero vivo no WhatsApp.
  //
  // 2026-09-03: sai 5511918271120 (Digisac, vivo, decisao do dono).
  // 2026-09-01: saem 5551999711399 e 5511911581515 (vivos, decisao).
  //
  // 2026-08-31: ARQUIVADOS E DESCONECTADOS NO DIGISAC. Estavam conectados de
  // manha; a noite apareceram arquivados, e enquanto isso ~50% dos leads
  // pagos foram para WhatsApp morto.
  //   { numero: '5511997571221' },  // 1221  ARQUIVADO
  //   { numero: '5511972021019' },  // 1019  ARQUIVADO
  //   { numero: '555180230806'  },  // 0806  ARQUIVADO
  //
  // ANTES DE INCLUIR OU REATIVAR QUALQUER UM: conferir que esta conectado,
  // nao arquivado E nao banido. O painel nao mostra banimento; so mandando
  // mensagem de teste para o numero da para ter certeza.
  // ---------------------------------------------------------------------
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
const CHAVE_STICKY = 'ab_ig_wpp_v5';

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
