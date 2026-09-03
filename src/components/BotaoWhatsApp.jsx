import { useEffect, useState } from 'react';
import { useWhatsAppLink } from '../useWhatsAppLink.js';

// Botao flutuante de WhatsApp.
//
// Usa o MESMO useWhatsAppLink dos outros CTAs, entao herda de graca:
//   - o rodizio (sorteio ponderado + sticky por navegador);
//   - a tag de origem da pagina (#Google em /google/, #Meta em /meta/);
//   - a mensagem inicial da tese.
// Nao existe segunda fonte de verdade: mudar o pool em config.js muda o botao.
//
// id="lead" e proposital: e o atributo que o trigger do GTM usa para contar a
// conversao "Botao de WhatsApp" no Google Ads, igual aos demais CTAs.
//
// SO APARECE DEPOIS DE ROLAR: no desktop ele cobria o selo "5.0 Nota Google"
// do hero, que e prova social. Alem disso, a primeira dobra ja tem o CTA
// grande; o flutuante serve para quem desceu e esta longe dele.
export function BotaoWhatsApp() {
  const whatsappLink = useWhatsAppLink();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const conferir = () => setVisivel(window.scrollY > window.innerHeight * 0.6);
    conferir();
    window.addEventListener('scroll', conferir, { passive: true });
    return () => window.removeEventListener('scroll', conferir);
  }, []);

  return (
    <a
      id="lead"
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={visivel ? 'wpp-flutuante visivel' : 'wpp-flutuante'}
      aria-label="Falar com um especialista no WhatsApp"
      aria-hidden={visivel ? undefined : 'true'}
      tabIndex={visivel ? undefined : -1}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16.04 3.2c-7.1 0-12.87 5.77-12.87 12.87 0 2.27.6 4.49 1.73 6.44L3.1 29.1l6.76-1.77a12.8 12.8 0 0 0 6.17 1.57h.01c7.1 0 12.87-5.77 12.87-12.87S23.14 3.2 16.04 3.2Zm0 23.13h-.01a10.7 10.7 0 0 1-5.44-1.49l-.39-.23-4.01 1.05 1.07-3.91-.25-.4a10.66 10.66 0 0 1-1.63-5.68c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.54 1.11 7.56 3.14a10.62 10.62 0 0 1 3.13 7.57c0 5.9-4.8 10.65-10.73 10.65Zm5.87-7.98c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55l-.62-.01c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68s1.15 3.1 1.31 3.32c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.82.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z"/>
      </svg>
    </a>
  );
}
