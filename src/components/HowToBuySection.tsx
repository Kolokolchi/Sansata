import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CreditCard, Landmark, CalendarClock, HeartHandshake, RefreshCw } from 'lucide-react';

export const HowToBuySection: React.FC = () => {
  const { openCallbackModal } = useAppStore();

  const methods = [
    {
      title: '100% оплата',
      desc: 'Максимальная скидка от базовой стоимости квартиры и самое быстрое оформление сделки через эскроу-счет.',
      icon: CreditCard,
      highlight: 'Скидка до 5%'
    },
    {
      title: 'Ипотечные программы',
      desc: 'Семейная, IT-ипотека, субсидированные ставки от 3.5% от ведущих банков РФ. Помощь в одобрении.',
      icon: Landmark,
      highlight: 'Ставка от 3.5%'
    },
    {
      title: 'Беспроцентная рассрочка',
      desc: 'Индивидуальные графики выплат от застройщика до окончания строительства дома в 2028 году.',
      icon: CalendarClock,
      highlight: '0% переплаты'
    },
    {
      title: 'Материнский капитал',
      desc: 'Использование средств господдержки в качестве первоначального взноса или для досрочного погашения.',
      icon: HeartHandshake,
      highlight: 'Господдержка'
    },
    {
      title: 'Trade-in',
      desc: 'Обмен вашей вторичной недвижимости на новую квартиру в ЖК STAVNI Обводный с фиксацией цены.',
      icon: RefreshCw,
      highlight: 'Быстрый выкуп'
    }
  ];

  return (
    <section className="section" id="how-to-buy">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Способы приобретения</span>
          <h2 className="section-title">Как купить квартиру</h2>
          <p className="section-subtitle">
            Мы предлагаем гибкие финансовые инструменты для комфортной покупки жилья в строящемся комплексе.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {methods.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px 24px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'rgba(227, 82, 4, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(227, 82, 4, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand-base)'
                  }}>
                    <Icon size={24} />
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--color-brand-base)',
                    background: 'rgba(227, 82, 4, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {m.highlight}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', lineHeight: 1.5, marginBottom: '24px' }}>
                  {m.desc}
                </p>

                <button
                  className="btn btn--secondary btn--sm"
                  style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
                  onClick={openCallbackModal}
                >
                  Консультация менеджера
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
