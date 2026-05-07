import { Icons, StarsRow } from './Icons.jsx';
import logoAmaralWebp from '../assets/logo-amaral.webp';
import logoAmaralPng from '../assets/logo-amaral.png';

export function Hero({ headline, subhead, ctaLabel }) {
  return (
    <section className="hero">
      <div className="wrap">
        <nav className="hero-nav" aria-label="Principal">
          <div className="brand">
            <picture>
              <source srcSet={logoAmaralWebp} type="image/webp" />
              <img
                src={logoAmaralPng}
                alt="Amaral e Bohrer Advogados"
                className="brand-logo"
                width="155"
                height="38"
                fetchpriority="high"
              />
            </picture>
          </div>
          <div className="nav-tag">Especialistas em Direito Digital</div>
        </nav>

        <div className="hero-grid">
          <div className="hero-text">
            <div className="pill">
              <span className="dot" aria-hidden="true">!</span>
              Instagram hackeado ou suspenso? Aja agora
            </div>
            <h1 dangerouslySetInnerHTML={{ __html: headline }} />
            <p className="lead">{subhead}</p>
            <a href="https://app.leadster.com.br/capture/gwesAHX1JB801Qre" target="_blank" rel="noopener" className="cta">
              {ctaLabel}
              <Icons.Arrow />
            </a>
            <div style={{ marginTop: 18 }}>
              <StarsRow light />
            </div>
          </div>

          <div className="phone-wrap">
            <div className="badge b1">
              <div className="ic"><Icons.FileLine /></div>
              <div>
                <div className="v">+13.000</div>
                <div className="l">Casos atendidos</div>
              </div>
            </div>
            <div className="phone" aria-hidden="true">
              <div className="phone-screen">
                <div className="phone-status">
                  <span>9:41</span>
                  <div className="icons"><span></span><span></span><span></span></div>
                </div>
                <div className="phone-content">
                  <div className="phone-logo">
                    <span className="mark">A</span>
                    <span>Amaral &amp; Bohrer</span>
                  </div>
                  <div className="phone-card">
                    <div className="head">Notificação</div>
                    <p className="phone-card-title">Seu Instagram foi suspenso</p>
                    <div className="phone-bars">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className="phone-card" style={{ background: '#fff5e8' }}>
                    <div className="head" style={{ color: 'var(--teal-dark)' }}>
                      <span style={{ background: 'var(--teal)' }}></span>
                      Próximo passo
                    </div>
                    <p className="phone-card-title">Recupere seu perfil com um especialista</p>
                    <div className="phone-bars">
                      <span></span><span></span>
                    </div>
                  </div>
                  <div className="phone-cta">Falar com especialista</div>
                  <div className="phone-quote">★★★★★ Mais de 13 mil clientes</div>
                </div>
              </div>
            </div>
            <div className="badge b2">
              <div className="ic"><Icons.Star /></div>
              <div>
                <div className="v">5.0</div>
                <div className="l">Nota Google</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
