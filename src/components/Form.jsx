import { useState } from 'react';
import { Icons } from './Icons.jsx';

const LEAD_ROUTING = [
  { name: 'Pedro Amaral', email: 'pedrobamaral@yahoo.com.br', whatsapp: '5511972021019' },
  { name: 'Rafael Mota', email: 'rafael.mota@conversaojuridica.com.br', whatsapp: '5511912611616' },
];

function getNextConsultant() {
  const key = 'amaral_ig_lead_round_robin';
  const next = (parseInt(localStorage.getItem(key) || '0', 10) + 1) % LEAD_ROUTING.length;
  localStorage.setItem(key, String(next));
  return LEAD_ROUTING[next];
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [routedTo, setRoutedTo] = useState(null);
  const [data, setData] = useState({
    nome: '',
    email: '',
    telefone: '',
    perfil: '',
    situacao: '',
    mensagem: '',
  });
  const handle = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const consultant = getNextConsultant();
    setRoutedTo(consultant);
    setSubmitted(true);

    const msg = encodeURIComponent(
      `Olá, ${consultant.name}! Meu nome é ${data.nome}. ` +
      `Tenho um perfil ${data.perfil || 'no Instagram'}. ` +
      `Situação: ${data.situacao || 'não informada'}. ` +
      (data.mensagem ? `Detalhes: ${data.mensagem}` : '')
    );
    setTimeout(() => {
      window.open(`https://wa.me/${consultant.whatsapp}?text=${msg}`, '_blank', 'noopener');
    }, 1200);
  };

  return (
    <section className="section form-section" id="contato">
      <div className="wrap">
        <div className="form-grid">
          <div className="form-left">
            <span className="eyebrow accent-orange">Fale conosco</span>
            <h2 style={{ marginTop: 12 }}>Avaliação gratuita do seu caso</h2>
            <p style={{ marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Preencha o formulário e um dos nossos especialistas entrará em contato
              para analisar o seu caso sem custo. Atendemos em todo o Brasil.
            </p>
            <ul className="form-trust" style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Avaliação inicial gratuita',
                'Atendimento 100% remoto',
                'Resposta em até 24 horas',
              ].map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                  <Icons.Check />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {submitted ? (
            <div className="form-card submitted">
              <div className="check-circle" aria-hidden="true">✓</div>
              <h3>Formulário enviado!</h3>
              <p>Em instantes abriremos uma conversa no WhatsApp com <strong>{routedTo?.name}</strong> para dar continuidade ao seu caso.</p>
              <a
                href={`https://wa.me/${routedTo?.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cta"
              >
                Abrir WhatsApp agora <Icons.Arrow />
              </a>
            </div>
          ) : (
            <form className="form-card" onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="form-nome">Seu nome completo</label>
                <input
                  id="form-nome"
                  type="text"
                  placeholder="João da Silva"
                  value={data.nome}
                  onChange={handle('nome')}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="form-email">E-mail</label>
                <input
                  id="form-email"
                  type="email"
                  placeholder="joao@email.com"
                  value={data.email}
                  onChange={handle('email')}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="form-telefone">WhatsApp</label>
                <input
                  id="form-telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={data.telefone}
                  onChange={handle('telefone')}
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="form-perfil">Tipo de perfil</label>
                <select
                  id="form-perfil"
                  value={data.perfil}
                  onChange={handle('perfil')}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="perfil pessoal">Perfil pessoal</option>
                  <option value="perfil comercial / empresa">Perfil comercial / empresa</option>
                  <option value="criador de conteúdo / influenciador">Criador de conteúdo / influenciador</option>
                  <option value="conta verificada">Conta verificada</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="form-situacao">O que aconteceu?</label>
                <select
                  id="form-situacao"
                  value={data.situacao}
                  onChange={handle('situacao')}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="conta hackeada — perdi o acesso">Conta hackeada — perdi o acesso</option>
                  <option value="conta suspensa ou desativada pelo Instagram">Conta suspensa ou desativada pelo Instagram</option>
                  <option value="conta removida sem motivo claro">Conta removida sem motivo claro</option>
                  <option value="não consigo recuperar via suporte do app">Não consigo recuperar via suporte do app</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="form-mensagem">Descreva brevemente o que aconteceu</label>
                <textarea
                  id="form-mensagem"
                  rows={3}
                  placeholder="Ex: minha conta foi hackeada em 15/04, o hacker trocou o e-mail e telefone..."
                  value={data.mensagem}
                  onChange={handle('mensagem')}
                />
              </div>
              <button type="submit" className="cta">
                Quero avaliação gratuita <Icons.Arrow />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
