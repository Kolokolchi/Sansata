import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useAppStore();

  const scrollToAnchor = (anchorId: string) => {
    navigateTo('home');
    setTimeout(() => {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Col 1: Brand info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--color-brand-base)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '18px'
              }}>
                S
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '1px' }}>
                STAVNI <span style={{ color: 'var(--color-brand-light)' }}>ОБВОДНЫЙ</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, marginBottom: '20px' }}>
              Камерный жилой комплекс бизнес-класса в Адмиралтейском районе Санкт-Петербурга. Квартиры с потолками 3 метра, закрытый двор, подземный паркинг.
            </p>

            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
              Застройщик: ООО «СПЗ «СТАВНИ ОБВОДНЫЙ»<br />
              ИНН: 7838112345 / ОГРН: 1257800123456
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div className="footer__col-title">Выбор квартиры</div>
            <ul className="footer__links">
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigateTo('visual'); }}>На 3D-плане</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigateTo('parametric-search'); }}>По параметрам</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigateTo('favorite'); }}>Избранное</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigateTo('audiogid'); }}>Аудиоэкскурсия</a></li>
            </ul>
          </div>

          {/* Col 3: About Complex */}
          <div>
            <div className="footer__col-title">О комплексе</div>
            <ul className="footer__links">
              <li><a href="#about" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('about'); }}>О проекте</a></li>
              <li><a href="#mesto" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('mesto'); }}>Преимущества</a></li>
              <li><a href="#finishing" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('finishing'); }}>Отделка Whitebox</a></li>
              <li><a href="#location" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('location'); }}>Расположение</a></li>
              <li><a href="#akcii" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('akcii'); }}>Акции и скидки</a></li>
              <li><a href="#mortgage" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('mortgage'); }}>Ипотека</a></li>
              <li><a href="#progress" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('progress'); }}>Ход строительства</a></li>
              <li><a href="#docs" className="footer__link" onClick={(e) => { e.preventDefault(); scrollToAnchor('docs'); }}>Документация</a></li>
            </ul>
          </div>

          {/* Col 4: Contacts */}
          <div>
            <div className="footer__col-title">Контакты</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Phone size={16} color="var(--color-brand-light)" />
                <a href="tel:+78125011151" style={{ color: '#ffffff', fontWeight: 700 }}>+7 (812) 501-11-51</a>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Mail size={16} color="var(--color-brand-light)" />
                <a href="mailto:sales@stavni-dom.ru" style={{ color: '#ffffff' }}>sales@stavni-dom.ru</a>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <MapPin size={16} color="var(--color-brand-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>СПб, наб. Обводного канала, 118А, лит. С</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="footer__bottom">
          <div>
            © {new Date().getFullYear()} ЖК «STAVNI Обводный». Все права защищены.
          </div>
          <div style={{ maxWidth: '650px', textAlign: 'right' }}>
            Любая информация, представленная на данном сайте, носит исключительно информационный характер и не является публичной офертой, определяемой положениями статьи 437 Гражданского кодекса РФ.
          </div>
        </div>
      </div>
    </footer>
  );
};
