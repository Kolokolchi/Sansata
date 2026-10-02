import { ArrowRight, MapPin } from 'lucide-react';
import { safHero } from '../lib/safMaterials';
import { SelectionLink } from './SafVisualFloor';
import '../styles/saf-landing.css';

export function SafLanding() {
  return <main className="saf-landing">
    <section className="saf-landing-hero" aria-labelledby="saf-landing-title">
      <img className="saf-landing-photo" src={safHero} alt="Жилой комплекс SAF Avenue в вечернем свете" />
      <div className="saf-landing-heading">
        <h1 id="saf-landing-title">Привилегия<br />приватной жизни</h1>
        <p><MapPin size={23} aria-hidden="true" /><span>Алматы, пр. Аль-Фараби — ул. Розыбакиева</span></p>
      </div>
    </section>
    <dl className="saf-landing-facts" aria-label="О комплексе SAF Avenue">
      <div><dt>сейсмостойкость</dt><dd>9 баллов</dd></div>
      <div><dt>этажей</dt><dd>9, 12, 13</dd></div>
      <div><dt>блоков</dt><dd>7</dd></div>
      <div><dt>комнатность квартир</dt><dd>1 – 5</dd></div>
      <div><dt>площадь квартир</dt><dd>47 – 181 м²</dd></div>
    </dl>
    <nav className="saf-landing-actions" aria-label="Выбрать квартиру">
      <SelectionLink to="/saf/visual">Посмотреть на 3D-плане <ArrowRight size={19} aria-hidden="true" /></SelectionLink>
      <SelectionLink to="/saf">Посмотреть по параметрам <ArrowRight size={19} aria-hidden="true" /></SelectionLink>
    </nav>
  </main>;
}
