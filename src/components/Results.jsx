export function Results() {
  const items = [
    { big: '+13', unit: 'mil', small: 'Atendimentos', desc: 'Vendedores e consumidores atendidos em todo o Brasil desde a fundação do escritório.' },
    { big: '5,0', unit: '★', small: 'Nota Google', desc: 'Reputação verificada com 594 avaliações públicas no perfil oficial do escritório.' },
    { big: '100', unit: '%', small: 'Atendimento', desc: 'Atendimento remoto e digital — você não precisa sair de casa para falar com o seu advogado.' },
    { big: '24', unit: 'h', small: 'Resposta', desc: 'Tempo médio de retorno após o envio do formulário. Casos urgentes têm prioridade.' },
  ];
  return (
    <section className="section results">
      <div className="wrap">
        <div className="head">
          <div>
            <span className="eyebrow accent-orange">Resultados</span>
            <h2 style={{ marginTop: 12 }}>
              Números que mostram <span className="accent-orange">como atuamos</span>
            </h2>
          </div>
          <p className="lead">Indicadores agregados do nosso escritório. Resultados individuais variam conforme o caso e a documentação apresentada.</p>
        </div>
        <div className="results-grid">
          {items.map((it, i) => (
            <div key={i} className="result-card">
              <span className="acc"></span>
              <div className="big">{it.big}<span className="unit">{it.unit}</span></div>
              <div className="small">{it.small}</div>
              <p className="desc">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
