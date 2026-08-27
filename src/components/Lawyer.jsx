import { Icons } from './Icons.jsx';
import rafaelAvif from '../assets/rafael-mota-536.avif';
import rafaelWebp from '../assets/rafael-mota-536.webp';
import rafaelJpg from '../assets/rafael-mota-536.jpg';
import { useWhatsAppLink } from '../useWhatsAppLink.js';

export function Lawyer() {
  const whatsappLink = useWhatsAppLink();
  return (
    <section className="section lawyer">
      <div className="wrap">
        <h2 className="section-title">Quem vai te ajudar a recuperar sua conta</h2>
        <div className="lawyer-card">
          <div className="lawyer-photo">
            <picture>
              <source srcSet={rafaelAvif} type="image/avif" />
              <source srcSet={rafaelWebp} type="image/webp" />
              <img
                src={rafaelJpg}
                alt="Rafael Mota - Advogado especialista"
                width="268"
                height="268"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          <div className="lawyer-info">
            <div className="role">Advogado especialista</div>
            <h3>Rafael Mota</h3>
            <p className="bio">Formado em Direito pelo Centro Universitário Estácio do Ceará, é um estrategista digital apaixonado pelo direito e novas tecnologias. Atua como professor e advogado especialista na defesa do trabalhador e do consumidor frente às tecnologias modernas.</p>
            <div className="oab">OAB/CE 36.237</div>
            <div>
              <a id="lead" href={whatsappLink} target="_blank" rel="noopener" className="cta">Fale com o especialista <Icons.Arrow /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
