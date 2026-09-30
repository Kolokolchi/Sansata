import company from '../data/sensata-company.json';
import telegram from '../assets/sensata-telegram.svg';
import instagram from '../assets/sensata-instagram.svg';
import youtube from '../assets/sensata-youtube.svg';
import tiktok from '../assets/sensata-tiktok.svg';

const icons: Record<string, string> = { telegram, instagram, youtube, tiktok };
export function SensataFooter() {
  return <footer className="sensata-footer">
    <div className="sensata-footer-bottom">
      <span>Sensata Group {new Date().getFullYear()} © Все права защищены</span>
      <nav className="sensata-socials" aria-label="Социальные сети Sensata">{company.socials.map(social => <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.network === 'YouTube' ? 'Sensata Group — YouTube' : `${social.network} — ${social.city}`}><img src={icons[social.icon]} alt="" width="30" height="30" /><span>{social.city}</span></a>)}</nav>
    </div>
  </footer>;
}
