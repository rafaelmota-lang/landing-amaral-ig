import { useState } from 'react';

const faqs = [
  {
    q: 'É possível recuperar uma conta hackeada ou suspensa indevidamente pela justiça?',
    a: 'Sim. Por meio de ação judicial com pedido liminar, um juiz pode determinar que a Meta restabeleça o acesso à sua conta em poucos dias. Esse caminho é eficaz tanto em casos de invasão quanto de suspensão indevida pela plataforma — especialmente quando os meios convencionais (suporte do aplicativo, verificação por selfie, e-mail) não funcionam.',
  },
  {
    q: 'Quanto tempo demora para recuperar o acesso ao Instagram?',
    a: 'Em casos com pedido liminar, é possível obter a reativação em 7 a 30 dias. O prazo varia conforme a complexidade do caso, o juízo e a documentação disponível. Casos mais simples podem ser resolvidos extrajudicialmente em menos tempo.',
  },
  {
    q: 'Atendem criadores de conteúdo e perfis comerciais?',
    a: 'Sim. Atendemos tanto usuários pessoais quanto criadores de conteúdo, influenciadores digitais e empresas que utilizam o Instagram como canal de vendas. A perda da conta por uma empresa ou criador pode gerar prejuízos materiais que também podem ser pleiteados judicialmente.',
  },
  {
    q: 'Atendem clientes em todo o Brasil?',
    a: 'Sim. Atuamos em todo o território nacional de forma 100% remota. Toda a documentação é enviada digitalmente e as audiências, quando necessárias, são realizadas online.',
  },
  {
    q: 'Como funciona o pagamento dos honorários?',
    a: 'Trabalhamos com modelos transparentes, ajustados ao perfil do seu caso. Na primeira conversa, apresentamos o orçamento de forma clara e sem surpresas.',
  },
  {
    q: 'Mesmo sem ter sido hackeado consigo recorrer da suspensão?',
    a: 'Sim. Mesmo quando o Instagram alega "violação dos termos de uso" e suspende a conta sem invasão de terceiros, é possível questionar judicialmente a proporcionalidade e a fundamentação da punição. Frequentemente as suspensões são aplicadas por erro do algoritmo ou por interpretação equivocada de denúncias.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq">
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="eyebrow">Perguntas frequentes</span>
        </div>
        <h2 className="section-title">Tire suas dúvidas antes de começar</h2>
        <div className="faq-list" style={{ marginTop: 48 }}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const id = `faq-${i}`;
            return (
              <div className="faq-item" key={i} data-open={isOpen}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="plus" aria-hidden="true">+</span>
                </button>
                <div className="faq-a" id={id} role="region">
                  <p style={{ paddingTop: 4 }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
