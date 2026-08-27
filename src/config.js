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

  // ATENÇÃO: este número NÃO tem conexão correspondente no Digisac (nenhuma
  // conexão termina em 8173). Lead que cair aqui não é registrado no CRM.
  // Confirmar antes de manter em produção.
  { numero: '5511926878173', peso: 1 },
];

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
