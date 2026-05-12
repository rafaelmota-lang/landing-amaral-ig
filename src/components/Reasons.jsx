import { Icons, StarsRow } from './Icons.jsx';

export function Reasons() {
  const cards = [
    {
      icon: <Icons.FileLine />,
      title: 'Suspensão indevida pela plataforma',
      text: 'O Instagram desativa contas alegando descumprimento de regras sem provas concretas. Em muitos casos a punição é desproporcional ou aplicada por engano e o usuário não consegue se defender.',
    },
    {
      icon: <Icons.Robot />,
      title: 'Erro do algoritmo de moderação',
      text: 'O sistema automatizado identifica "atividade suspeita" de forma equivocada e remove perfis legítimos — mesmo sem qualquer violação real dos termos de uso.',
    },
    {
      icon: <Icons.Lock />,
      title: 'Conta hackeada / invadida',
      text: 'Terceiros invadem o perfil, alteram e-mail, senha e telefone, tornando praticamente impossível a recuperação pelos meios convencionais oferecidos pelo próprio Instagram.',
    },
  ];
  return (
    <section className="section reasons">
      <div className="wrap">
        <h2 className="section-title">
          Por que sua conta foi suspensa ou hackeada<br />
          <span className="accent-orange">(e o que um advogado pode fazer a respeito)</span>
        </h2>
        <div className="reason-grid">
          {cards.map((c, i) => (
            <div className="reason-card" key={i}>
              <div className="num">0{i + 1}</div>
              <div className="ic">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
        <p className="pre-cta">Sente que teve sua conta bloqueada ou invadida injustamente?</p>
        <div className="cta-block" style={{ marginTop: 0 }}>
          <a id="lead" href="https://app.leadster.com.br/capture/d7TGpeHYhhrspZ7i" target="_blank" rel="noopener" className="cta">Converse sobre o seu caso <Icons.Arrow /></a>
          <StarsRow />
        </div>
      </div>
    </section>
  );
}
