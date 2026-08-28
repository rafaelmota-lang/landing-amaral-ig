import { useEffect, useState } from 'react';
import { linkPadrao, escolherNumero, montarLink } from './config.js';

/**
 * Devolve o link de WhatsApp do visitante.
 *
 * No HTML pré-renderizado sai linkPadrao() (link válido, funciona sem JS).
 * Depois da hidratação o sorteio roda e o href é atualizado — por isso o
 * sorteio precisa ficar em useEffect: se rodasse no render, o prerender
 * congelaria um número só para todos os visitantes.
 */
export function useWhatsAppLink() {
  const [href, setHref] = useState(linkPadrao);
  useEffect(() => { setHref(montarLink(escolherNumero().numero)); }, []);
  return href;
}
