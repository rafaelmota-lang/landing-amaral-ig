import { useState } from 'react';
import { Icons, StarsRow } from './Icons.jsx';

const VIDEO_ID = 'ItwYkRaxXN4';

export function Recover() {
  const [playing, setPlaying] = useState(false);
  const steps = [
    {
      title: 'Tente recuperar o acesso pelos canais oficiais do Instagram',
      paras: [
        'Use o recurso "Precisa de mais ajuda?" na tela de login e siga todos os passos indicados pelo aplicativo. Tente a verificação por selfie, SMS e e-mail.',
        'Se a conta foi hackeada e o e-mail/telefone foram alterados, use o link enviado para o e-mail original (o Instagram envia um e-mail de segurança quando o endereço é trocado).',
      ],
    },
    {
      title: 'Documente todas as tentativas sem sucesso',
      paras: [
        'Salve capturas de tela de todos os passos que você tentou, incluindo mensagens de erro e respostas automáticas do suporte.',
        'Anote datas, horários e números de protocolo. Essa documentação é essencial para comprovar que você esgotou os recursos disponíveis.',
      ],
    },
    {
      title: 'Registre a ocorrência e acione o Procon',
      paras: [
        'Faça um boletim de ocorrência (pode ser online) relatando a invasão ou o bloqueio indevido da conta.',
        'Envie reclamação no Consumidor.gov e no Reclame Aqui. Mesmo que o Instagram não responda, você acumula provas da tentativa de resolução extrajudicial.',
      ],
    },
    {
      title: 'Acione a justiça com auxílio de um advogado especializado',
      paras: [
        'Com a documentação em mãos, um advogado especialista em direito digital pode impetrar medida judicial com pedido liminar para forçar a Meta a restabelecer o acesso.',
        'Dependendo do caso, é possível também requerer indenização por danos morais e materiais causados pela perda da conta.',
      ],
    },
  ];
  return (
    <section className="section recover">
      <div className="wrap">
        <h2 className="section-title">Como recuperar sua conta do Instagram?</h2>
        <div className="video-wrap">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&playsinline=1&modestbranding=1&autoplay=1`}
              title="Como recuperar conta no Instagram"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <button
              type="button"
              className="video-poster"
              onClick={() => setPlaying(true)}
              aria-label="Assista: como recuperar sua conta - reproduzir vídeo"
            >
              <img
                src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
                alt=""
                width="480"
                height="360"
                loading="lazy"
                decoding="async"
              />
              <span className="video-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <span className="video-label">Assista: como recuperar sua conta</span>
            </button>
          )}
        </div>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">{i + 1}</div>
              <h3>{s.title}</h3>
              {s.paras.map((p, j) => <p key={j}>{p}</p>)}
            </div>
          ))}
        </div>
        <div className="cta-block">
          <a href="https://app.leadster.com.br/capture/gwesAHX1JB801Qre" target="_blank" rel="noopener" className="cta">Receba orientação especializada <Icons.Arrow /></a>
          <StarsRow />
        </div>
      </div>
    </section>
  );
}
