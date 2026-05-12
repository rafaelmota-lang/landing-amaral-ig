import { Icons, StarsRow } from './Icons.jsx';

export function Banner() {
  const items = [
    {
      icon: <Icons.Contract />,
      text: <><strong>O Instagram suspende contas sem explicar o motivo com clareza.</strong> A plataforma costuma enviar apenas notificações genéricas, sem indicar exatamente qual regra foi violada — o que dificulta a defesa por conta própria.</>,
    },
    {
      icon: <Icons.Robot />,
      text: <><strong>O sistema de moderação é automatizado e erra com frequência.</strong> Algoritmos identificam "comportamento suspeito" de forma incorreta, removendo perfis legítimos — inclusive contas verificadas e com anos de histórico.</>,
    },
    {
      icon: <Icons.Speed />,
      text: <><strong>Hackers tomam controle do perfil e o Instagram demora a responder.</strong> Quando um terceiro acessa sua conta, altera e-mail e telefone, recuperar o acesso pelos canais oficiais pode levar semanas — ou nunca acontecer.</>,
    },
    {
      icon: <Icons.Box />,
      text: <>Se o Instagram <strong>não informou claramente o motivo do bloqueio</strong> ou você não consegue recuperar o acesso mesmo seguindo os passos indicados, você tem o direito de buscar solução judicial.</>,
    },
  ];
  return (
    <section className="orange-band">
      <div className="wrap">
        <h2>Bloqueios e invasões de contas no Instagram acontecem todos os dias, mas você pode recorrer com o auxílio da justiça</h2>
        <div className="orange-list">
          {items.map((it, i) => (
            <div className="orange-item" key={i}>
              <div className="ic">{it.icon}</div>
              <p>{it.text}</p>
            </div>
          ))}
        </div>
        <div className="cta-block">
          <a id="lead" href="https://app.leadster.com.br/capture/d7TGpeHYhhrspZ7i" target="_blank" rel="noopener" className="cta">Fale com um especialista em direito digital <Icons.Arrow /></a>
          <StarsRow light />
        </div>
      </div>
    </section>
  );
}
