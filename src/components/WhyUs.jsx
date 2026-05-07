import { Icons, StarsRow } from './Icons.jsx';

export function WhyUs() {
  const cards = [
    {
      stat: '+',
      label: 'Especialização',
      title: 'Entendemos de direito digital',
      text: 'Conhecemos os mecanismos de moderação das plataformas digitais, sabemos a linguagem jurídica correta e os caminhos mais eficazes para forçar a Meta a restabelecer o acesso.',
      icon: <Icons.Handshake />,
    },
    {
      stat: '13k+',
      label: 'Clientes atendidos',
      title: 'Mais de 13 mil clientes atendidos',
      text: 'Nossa equipe já atendeu criadores de conteúdo, influenciadores, empresas e usuários comuns que perderam o acesso às suas redes sociais. Sabemos exatamente o que fazer.',
      icon: <Icons.Users />,
    },
    {
      stat: '5,0',
      label: 'Nota Google',
      title: 'Nota máxima no Google',
      text: 'Nosso escritório tem nota 5,0 nas avaliações do Google, com 594 avaliações verificadas. Você pode conferir o perfil oficial antes mesmo de falar conosco.',
      icon: <Icons.Star />,
    },
  ];
  return (
    <section className="section why-us">
      <div className="wrap">
        <h2 className="section-title">
          Precisa de um advogado especializado em redes sociais?<br />
          <span className="accent-orange">Saiba por que escolher a Amaral</span>
        </h2>
        <div className="why-grid">
          {cards.map((c, i) => (
            <div className="why-card" key={i}>
              <div className="corner"></div>
              <div className="stat">{c.stat}</div>
              <div className="stat-label">{c.label}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
        <div className="cta-block">
          <a href="https://app.leadster.com.br/capture/gwesAHX1JB801Qre" target="_blank" rel="noopener" className="cta">Comece agora <Icons.Arrow /></a>
          <StarsRow />
        </div>
      </div>
    </section>
  );
}
