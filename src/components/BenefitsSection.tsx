import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { benefitsItems } from '../data/commonData';
import { ArrowUpRight } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const { openBenefitModal } = useAppStore();

  return (
    <section className="section section--grey" id="benefits">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Инфраструктура дома</span>
          <h2 className="section-title">
            Проект создан как единая среда для жизни
          </h2>
          <p className="section-subtitle">
            Все элементы экосистемы STAVNI спроектированы для максимальной безопасности, комфорта и приватности.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {benefitsItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openBenefitModal(item)}
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.borderColor = 'rgba(227, 82, 4, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand-base)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--color-brand-base)',
                  marginBottom: '8px'
                }}>
                  0{idx + 1} // {item.shortTitle}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.3, marginBottom: '10px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', lineHeight: 1.5, marginTop: 'auto' }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
