import { Icons, StarsRow } from './Icons.jsx';

export function Reasons() {
  const cards = [
    {
      icon: <Icons.Lock />,
      title: 'Conta hackeada',
      text: 'Terceiros invadem o perfil, alteram e-mail, senha e número de telefone, tornando impossível a recuperação pelos meios convencionais do próprio Instagram.',
    },
    {
      icon: <Icons.Robot />,
      title: 'Suspensão por erro do algoritmo',
      text: 'O sistema automatizado identifica "atividade suspeita" de forma equivocada e remove perfis legítimos — mesmo sem qualquer violação real dos termos de uso.',
    },
    {
      icon: <Icons.FileLine />,
      title: 'Violação alegada dos Termos de Uso',
      text: 'O Instagram alega descumprimento de regras sem apresentar provas concretas. Em muitos casos a punição é desproporcional ou aplicada por engano.',
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
          <a href="https://app.leadster.com.br/capture/gwesAHX1JB801Qre" target="_blank" rel="noopener" className="cta">Converse sobre o seu caso <Icons.Arrow /></a>
          <StarsRow />
        </div>
      </div>
    </section>
  );
}
