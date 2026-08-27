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
  // Conferidos no Digisac em 2026-08-12: conectados e não arquivados.
  { numero: '5551999711399', peso: 1 }, // RSOCIAL - Carla - F - 1399
  { numero: '5511997571221', peso: 1 }, // Disponivel - F - 1221
  { numero: '5511911581515', peso: 1 }, // Disponivel - F - 1515
  { numero: '5511972021019', peso: 1 }, // Disponivel - F - 1019
  { numero: '555180230806',  peso: 1 }, // Disponivel - F - 0806

  // Este número não está no Digisac: está no Fluxo Jurídico (confirmado pelo dono
  // em 2026-08-12). O lead É registrado, mas em OUTRO CRM — ver nota abaixo.
  { numero: '5511926878173', peso: 1 },
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

export const MENSAGEM_INICIAL = '#Meta - Quero recuperar minha conta do Instagram';

const CHAVE_STICKY = 'ab_ig_wpp';

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

export function montarLink(numero) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM_INICIAL)}`;
}

// Link padrão usado no HTML pré-renderizado (o prerender roda sem localStorage).
// O sorteio real acontece no cliente, via useWhatsAppLink.
export const LEAD_URL = montarLink(WHATSAPP_POOL[0].numero);
