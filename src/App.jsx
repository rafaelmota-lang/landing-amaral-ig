import { lazy, Suspense, useState } from 'react';
import { Hero } from './components/Hero.jsx';
import { Banner } from './components/Banner.jsx';
import { Reasons } from './components/Reasons.jsx';
import { Results } from './components/Results.jsx';
import { Recover } from './components/Recover.jsx';
import { Lawyer } from './components/Lawyer.jsx';
import { WhyUs } from './components/WhyUs.jsx';
import { Testimonials } from './components/Testimonials.jsx';
import { FAQ } from './components/FAQ.jsx';
import { ContactForm } from './components/Form.jsx';
import { Footer } from './components/Footer.jsx';

const TWEAKS_ENABLED = typeof __TWEAKS__ !== 'undefined' && __TWEAKS__;

const TweaksRuntime = TWEAKS_ENABLED
  ? lazy(() => import('./components/tweaks/TweaksRuntime.jsx'))
  : null;

const HEADLINES = {
  original: 'O Instagram suspendeu ou hackearam sua conta? Recupere seu perfil com o auxílio de um advogado <span class="accent">especializado em direito digital</span>.',
  direct: 'Conta hackeada ou suspensa no <span class="accent">Instagram</span>? Recupere seu perfil com quem entende do assunto.',
  urgent: 'Seu Instagram foi hackeado. <span class="accent">Você perdeu o acesso.</span> Nós sabemos como reverter isso.',
};
const SUBHEADS = {
  original: 'Somos especialistas em assistência jurídica para criadores de conteúdo e empresas que perderam o acesso ao Instagram: saiba como recorrer se a plataforma suspendeu ou hackearam o seu perfil.',
  direct: 'Mais de 13 mil clientes já recuperaram suas contas com o nosso escritório. Atuamos em todo o Brasil, de forma 100% remota e com avaliação inicial gratuita.',
  urgent: 'Cada hora sem acesso é prejuízo — seguidores, contratos, renda. Fale agora com um advogado especialista e descubra como recuperar seu Instagram.',
};
const CTAS = {
  original: 'Fale com um especialista em direito digital',
  direct: 'Quero recuperar meu Instagram agora',
  urgent: 'Análise gratuita do meu caso',
};

const DEFAULTS = (typeof window !== 'undefined' && window.TWEAK_DEFAULTS) || {
  headlineVariant: 'urgent',
  ctaVariant: 'original',
  subheadVariant: 'urgent',
};

export function App() {
  const [tweaks, setTweaks] = useState(DEFAULTS);
  const setTweak = (key, value) => setTweaks((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Hero
        headline={HEADLINES[tweaks.headlineVariant] || HEADLINES.original}
        subhead={SUBHEADS[tweaks.subheadVariant] || SUBHEADS.original}
        ctaLabel={CTAS[tweaks.ctaVariant] || CTAS.original}
      />
      <main id="content">
        <Banner />
        <Reasons />
        <Results />
        <Recover />
        <Lawyer />
        <WhyUs />
        <Testimonials />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />

      {TWEAKS_ENABLED && TweaksRuntime && (
        <Suspense fallback={null}>
          <TweaksRuntime tweaks={tweaks} setTweak={setTweak} />
        </Suspense>
      )}
    </>
  );
}
