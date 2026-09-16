import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { promoOffers } from '../data/commonData';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

export const PromosSection: React.FC = () => {
  const { openPromoModal } = useAppStore();

  return (
    <section className="section" id="akcii">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Выгодные условия</span>
          <h2 className="section-title">Акции и спецпредложения</h2>
          <p className="section-subtitle">
            Эксклюзивные ипотечные программы, субсидированные ставки и специальные скидки от застройщика.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {promoOffers.map(promo => (
            <div
              key={promo.id}
              onClick={() => openPromoModal(promo)}
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
              {/* Image banner */}
              {promo.imageUrl && (
                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={promo.imageUrl} 
                    alt={promo.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'var(--color-brand-base)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: '0 4px 10px rgba(227, 82, 4, 0.4)'
                  }}>
                    {promo.badge}
                  </div>
                </div>
              )}

              {/* Text info */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', lineHeight: 1.3 }}>
                  {promo.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {promo.description}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-additional-1)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {promo.validUntil}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-base)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {promo.actionText} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
