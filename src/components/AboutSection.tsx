import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Headphones, Building2, Home, Maximize, Car, Box } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { navigateTo, openLightbox } = useAppStore();

  const factoids = [
    { number: '8 - 11', label: 'этажей в комплексе', icon: Building2 },
    { number: '382', label: 'квартиры бизнес-класса', icon: Home },
    { number: '3 метра', label: 'высота потолков', icon: Maximize },
    { number: '168 мест', label: 'подземный паркинг', icon: Car },
    { number: '161', label: 'кладовое помещение', icon: Box }
  ];

  return (
    <section className="section" id="about">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">О проекте</span>
          <h2 className="section-title">
            Единая среда для жизни в историческом центре
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '48px',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '18px', lineHeight: 1.7, color: 'var(--color-brand-text)', marginBottom: '20px' }}>
              Камерный дом бизнес-класса на набережной Обводного канала. Проект создан как единая среда для жизни, где нет случайных деталей — всё подчинено общей идее: сделать вашу жизнь комфортной, безопасной и эстетичной. Здесь можно жить в центре событий, сохраняя при этом абсолютную приватность и уют.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--color-additional-1)', marginBottom: '28px' }}>
              Фасады выдержаны в спокойной палитре, дополняющей исторический контекст района, облицованы фактурным бетоном и клинкерной плиткой с использованием акцентных материалов из металла. Внутренний двор закрыт от посторонних взглядов и машин, а также полностью благоустроен для отдыха и общения с близкими.
            </p>

            <button
              className="btn btn--secondary"
              onClick={() => navigateTo('audiogid')}
            >
              <Headphones size={18} color="var(--color-brand-base)" />
              Слушать аудиоэкскурсию по локации
            </button>
          </div>

          <div 
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              cursor: 'pointer'
            }}
            onClick={() => openLightbox('/images/hero_facade.jpg', 'Архитектурный фасад ЖК STAVNI')}
          >
            <img 
              src="/images/hero_facade.jpg" 
              alt="Фасад ЖК STAVNI Обводный"
              style={{ width: '100%', height: '380px', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(27, 20, 22, 0.8) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px',
              color: '#ffffff'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Архитектурная концепция проекта STAVNI</span>
            </div>
          </div>
        </div>

        {/* Factoids */}
        <div className="factoids-grid">
          {factoids.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="factoid-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="factoid-number">{f.number}</span>
                  <Icon size={24} color="var(--color-brand-base)" style={{ opacity: 0.8 }} />
                </div>
                <div className="factoid-label">{f.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
