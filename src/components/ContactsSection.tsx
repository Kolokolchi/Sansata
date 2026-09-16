import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';

export const ContactsSection: React.FC = () => {
  const { openCallbackModal } = useAppStore();

  return (
    <section className="section section--grey" id="contacts">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Свяжитесь с нами</span>
          <h2 className="section-title">Офис продаж и контакты</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          {/* Main Sales Office Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Центральный офис продаж</h3>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <MapPin size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>191025, г. Санкт-Петербург</div>
                <div style={{ fontSize: '14px', color: 'var(--color-additional-1)' }}>Невский пр-т, 114−116, БЦ «Невский Центр», 9 этаж</div>
                <a
                  href="https://yandex.ru/maps/org/stavni/106206790565/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '13px', color: 'var(--color-brand-base)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}
                >
                  Проложить маршрут на Яндекс.Картах →
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <Phone size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <a href="tel:+78125011151" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-text)' }}>
                  +7 (812) 501-11-51
                </a>
                <div style={{ fontSize: '13px', color: 'var(--color-additional-1)' }}>Ежедневно для звонков и записи на встречу</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <Clock size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Пн — Пт: с 9:00 до 20:00</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Сб — Вс: с 11:00 до 16:00</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <Mail size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <a href="mailto:sales@stavni-dom.ru" style={{ fontSize: '15px', color: 'var(--color-brand-text)', fontWeight: 600 }}>
                sales@stavni-dom.ru
              </a>
            </div>

            <button
              className="btn btn--primary"
              style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
              onClick={openCallbackModal}
            >
              Заказать обратный звонок
            </button>
          </div>

          {/* Site Office & Socials */}
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Офис на строительной площадке</h3>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <MapPin size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>наб. Обводного канала, 118А, лит. С</div>
                <div style={{ fontSize: '14px', color: 'var(--color-additional-1)' }}>Адмиралтейский район, м. Балтийская</div>
              </div>
            </div>

            <div style={{
              background: 'var(--color-additional-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '20px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                Мы в мессенджерах и соцсетях
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginBottom: '16px' }}>
                Оперативные ответы экспертов по недвижимости, трансляции хода строительства и закрытые акции:
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="https://t.me/stavni_official"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--secondary btn--sm"
                  style={{ background: '#ffffff' }}
                >
                  <Send size={15} color="#0088cc" /> Telegram канал
                </a>
                <a
                  href="https://vk.com/stavni_official"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--secondary btn--sm"
                  style={{ background: '#ffffff' }}
                >
                  <MessageCircle size={15} color="#4c75a3" /> ВКонтакте
                </a>
              </div>
            </div>

            <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--color-additional-2)', lineHeight: 1.5 }}>
              Застройщик ООО «СПЗ «СТАВНИ ОБВОДНЫЙ». Проектная декларация размещена на единой информационной системе жилищного строительства наш.дом.рф.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
