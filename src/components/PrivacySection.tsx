import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Shield, CheckCircle2, Footprints, Baby, Bike } from 'lucide-react';

export const PrivacySection: React.FC = () => {
  const { openLightbox } = useAppStore();

  const features = [
    {
      title: 'Безбарьерная среда',
      desc: 'Вход с уровня земли без ступеней и пандусов — комфортно с колясками и покупками.',
      icon: Footprints
    },
    {
      title: 'Колясочные в каждой парадной',
      desc: 'Специальные отапливаемые помещения рядом с лифтовыми холлами с контролем доступа.',
      icon: Baby
    },
    {
      title: 'Хранение велосипедов',
      desc: 'Отдельные сухие боксы с креплениями для велосипедов и электросамокатов.',
      icon: Bike
    }
  ];

  const imgUrl = '/images/courtyard.jpg';

  return (
    <section className="section section--grey" id="dom">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Text Info */}
          <div>
            <span className="section-tag">Приватность и архитектура</span>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>
              Дом, который бережёт ваше личное пространство
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--color-brand-text)', marginBottom: '32px' }}>
              Пространство спроектировано так, чтобы город оставался рядом, но не проникал внутрь. Парковка для жителей полностью вынесена под землю. Закрытый внутренний двор является полностью пешеходным. Здесь можно спокойно пройти к своей парадной, посидеть в тени деревьев или отпустить детей играть на свежем воздухе.
            </p>

            <div style={{ display: 'grid', gap: '20px' }}>
              {features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      background: '#ffffff',
                      padding: '20px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(227, 82, 4, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand-base)',
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-additional-1)', lineHeight: 1.5 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual */}
          <div 
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => openLightbox(imgUrl, 'Двор без машин и приватное пространство')}
          >
            <img 
              src={imgUrl} 
              alt="Внутренний двор-сад ЖК STAVNI"
              style={{ width: '100%', height: '520px', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
