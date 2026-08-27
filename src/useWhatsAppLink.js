import { useEffect, useState } from 'react';
import { LEAD_URL, escolherNumero, montarLink } from './config.js';

/**
 * Devolve o link de WhatsApp do visitante.
 *
 * No HTML pré-renderizado sai LEAD_URL (link válido, funciona sem JS).
 * Depois da hidratação o sorteio roda e o href é atualizado — por isso o
 * sorteio precisa ficar em useEffect: se rodasse no render, o prerender
 * congelaria um número só para todos os visitantes.
 */
export function useWhatsAppLink() {
  const [href, setHref] = useState(LEAD_URL);
  useEffect(() => { setHref(montarLink(escolherNumero().numero)); }, []);
  return href;
}
