import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Navigation, Compass, CheckCircle2 } from 'lucide-react';

export const LocationNarrativeSection: React.FC = () => {
  const { openLightbox } = useAppStore();

  const points = [
    'Дом гармонично вписан в историческую застройку Адмиралтейского района',
    'Работа, встречи, рестораны, музеи и театры — всё в пешей доступности',
    'Станция метро «Балтийская» и Балтийский вокзал — 10 минут спокойным шагом',
    'Быстрый выезд на ЗСД (12 минут) и Московский проспект'
  ];

  const imgUrl = '/images/vokzal_1853.jpg';

  return (
    <section className="section" id="mesto">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Visual with zoom */}
          <div 
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => openLightbox(imgUrl, 'Место, где центр города и тишина живут рядом', 'наб. Обводного канала, 118')}
          >
            <img 
              src={imgUrl} 
              alt="Окружение ЖК STAVNI и Vokzal 1853"
              style={{ width: '100%', height: '420px', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(27, 20, 22, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <MapPin size={14} color="var(--color-brand-light)" /> Адмиралтейский район • Vokzal 1853
            </div>
          </div>

          {/* Text Content */}
          <div>
            <span className="section-tag">Локация</span>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>
              Место, где центр города и тишина живут рядом
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--color-brand-text)', marginBottom: '24px' }}>
              Жилой комплекс STAVNI Обводный расположен на набережной Обводного канала, в самом сердце Адмиралтейского района. Рядом — Балтийский вокзал, гастрономический фуд-молл Vokzal 1853, Планетарий №1, арт-пространства и парки. Это живой центр Петербурга, где историческая ткань города встречается с европейским уровнем комфорта.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {points.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '15px', color: 'var(--color-brand-text)', fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
