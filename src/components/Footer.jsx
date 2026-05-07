export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-top">
          <div>
            <div className="foot-brand">
              <span className="mark" aria-hidden="true">A</span>
              <span>Amaral &amp; Bohrer Advogados</span>
            </div>
            <p>Escritório especializado em direito digital e defesa de usuários em plataformas digitais. Atuamos em todo o Brasil de forma remota.</p>
          </div>
          <div className="foot-col">
            <h3>Contato</h3>
            <ul>
              <li>contato@amaraladvogados.app</li>
              <li>(11) 99682-4517</li>
              <li><a href="https://app.leadster.com.br/capture/d7TGpeHYhhrspZ7i" target="_blank" rel="noopener">Fale conosco</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h3>Áreas de atuação</h3>
            <ul>
              <li>Instagram / Meta</li>
              <li>Facebook</li>
              <li>TikTok</li>
              <li>YouTube</li>
              <li>Marketplaces</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Amaral &amp; Bohrer Advogados. Todos os direitos reservados.</span>
          <span>OAB/CE 36.237</span>
        </div>
        <p className="foot-disclaimer">
          Este site não faz parte do Google nem do Instagram, Facebook ou Meta Platforms, Inc. Não somos afiliados à Meta. Não oferecemos nenhum tipo de serviço oficial do governo e não praticamos fraude.
        </p>
      </div>
    </footer>
  );
}
