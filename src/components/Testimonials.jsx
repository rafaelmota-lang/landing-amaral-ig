import { Icons } from './Icons.jsx';

export function Testimonials() {
  const breakdown = [
    { stars: 5, pct: 96 },
    { stars: 4, pct: 3 },
    { stars: 3, pct: 1 },
    { stars: 2, pct: 0 },
    { stars: 1, pct: 0 },
  ];
  return (
    <section className="section testimonials">
      <div className="wrap">
        <div className="head">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.65)' }}>Reputação verificada</div>
            <h2 style={{ marginTop: 12 }}>Quem confia no escritório<br />recomenda no Google</h2>
            <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
              Nossa reputação é pública. Você pode verificar cada avaliação diretamente
              no perfil oficial do escritório no Google.
            </p>
          </div>
        </div>

        <div className="google-card">
          <div className="g-left">
            <div className="g-logo">
              <svg width="42" height="42" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z" />
              </svg>
            </div>
            <div>
              <div className="g-title">Amaral e Bohrer Advogados</div>
              <div className="g-sub">Escritório de advocacia · Porto Alegre, RS</div>
            </div>
          </div>

          <div className="g-rating-row">
            <div className="g-score">5,0</div>
            <div>
              <div className="g-stars">★★★★★</div>
              <div className="g-reviews">Baseado em <strong>594 avaliações</strong> no Google</div>
            </div>
          </div>

          <div className="g-breakdown">
            {breakdown.map((b) => (
              <div key={b.stars} className="g-row">
                <span className="g-row-label">{b.stars}★</span>
                <span className="g-bar"><span style={{ width: b.pct + '%' }}></span></span>
                <span className="g-row-pct">{b.pct}%</span>
              </div>
            ))}
          </div>

          <a
            href="https://www.google.com/search?q=Amaral+e+Bohrer+Advogados+Coment%C3%A1rios"
            target="_blank"
            rel="noopener noreferrer"
            className="g-link"
          >
            Ver todas as avaliações no Google
            <Icons.Arrow />
          </a>
        </div>

        <div className="trust-strip">
          <div className="trust-item">
            <div className="trust-num">5,0</div>
            <div className="trust-lbl">Nota no Google</div>
          </div>
          <div className="trust-sep" aria-hidden="true"></div>
          <div className="trust-item">
            <div className="trust-num">594</div>
            <div className="trust-lbl">Avaliações verificadas</div>
          </div>
          <div className="trust-sep" aria-hidden="true"></div>
          <div className="trust-item">
            <div className="trust-num">+13k</div>
            <div className="trust-lbl">Clientes atendidos</div>
          </div>
          <div className="trust-sep" aria-hidden="true"></div>
          <div className="trust-item">
            <div className="trust-num">BR</div>
            <div className="trust-lbl">Atendemos todo o país</div>
          </div>
        </div>
      </div>
    </section>
  );
}
