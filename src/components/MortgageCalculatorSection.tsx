import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Calculator, Percent, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

interface BankPartner {
  name: string;
  rate: number;
  minDownPaymentPercent: number;
  maxTermYears: number;
}

export const MortgageCalculatorSection: React.FC = () => {
  const { openMortgageModal } = useAppStore();

  const [propertyPrice, setPropertyPrice] = useState<number>(18500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20.1);
  const [loanTermYears, setLoanTermYears] = useState<number>(25);
  const [selectedRate, setSelectedRate] = useState<number>(6.0); // 6% family mortgage

  const programs = [
    { id: 'family', name: 'Семейная ипотека', rate: 6.0 },
    { id: 'subsidized', name: 'Субсидированная от 3.5%', rate: 3.5 },
    { id: 'it', name: 'IT-ипотека', rate: 6.0 },
    { id: 'base', name: 'Базовая программа', rate: 19.5 }
  ];

  const banks: BankPartner[] = [
    { name: 'Альфа-Банк', rate: 3.5, minDownPaymentPercent: 20.1, maxTermYears: 30 },
    { name: 'СберБанк', rate: 6.0, minDownPaymentPercent: 20.1, maxTermYears: 30 },
    { name: 'ВТБ', rate: 6.0, minDownPaymentPercent: 20.1, maxTermYears: 30 },
    { name: 'Банк ДОМ.РФ', rate: 6.0, minDownPaymentPercent: 20.0, maxTermYears: 30 },
    { name: 'Банк Санкт-Петербург', rate: 6.0, minDownPaymentPercent: 20.1, maxTermYears: 30 }
  ];

  const downPaymentRubles = Math.round((propertyPrice * downPaymentPercent) / 100);
  const loanAmount = Math.max(0, propertyPrice - downPaymentRubles);

  // Annuity payment calculation
  const { monthlyPayment, requiredIncome } = useMemo(() => {
    if (loanAmount <= 0) return { monthlyPayment: 0, requiredIncome: 0 };
    const monthlyRate = selectedRate / 100 / 12;
    const totalMonths = loanTermYears * 12;
    
    const monthly = Math.round(
      loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
    const income = Math.round(monthly * 1.6); // 60% DTI guideline
    return { monthlyPayment: monthly, requiredIncome: income };
  }, [loanAmount, selectedRate, loanTermYears]);

  const handleApply = () => {
    openMortgageModal({
      propertyPrice,
      downPaymentRubles,
      downPaymentPercent,
      loanTermYears,
      selectedRate,
      monthlyPayment,
      loanAmount
    });
  };

  return (
    <section className="section section--grey" id="mortgage">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Финансовые программы</span>
          <h2 className="section-title">Ипотечный калькулятор</h2>
          <p className="section-subtitle">
            Рассчитайте персональные параметры кредита и ежемесячный платеж по специальным ставкам от ведущих банков-партнеров.
          </p>
        </div>

        <div className="mortgage-box">
          <div className="mortgage-grid">
            {/* Left Column: Sliders & Controls */}
            <div>
              {/* Program Selector */}
              <div style={{ marginBottom: '28px' }}>
                <label className="calc-control__label" style={{ display: 'block', marginBottom: '10px' }}>
                  Программа кредитования
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {programs.map(prog => (
                    <button
                      key={prog.id}
                      className={`flats-tab ${selectedRate === prog.rate ? 'is-active' : ''}`}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                      onClick={() => setSelectedRate(prog.rate)}
                    >
                      {prog.name} ({prog.rate}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Price Slider */}
              <div className="calc-control">
                <div className="calc-control__header">
                  <span className="calc-control__label">Стоимость недвижимости</span>
                  <span className="calc-control__value">{propertyPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <input
                  type="range"
                  min="11000000"
                  max="45000000"
                  step="100000"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="calc-range"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-additional-2)', marginTop: '4px' }}>
                  <span>11 млн ₽</span>
                  <span>45 млн ₽</span>
                </div>
              </div>

              {/* Down Payment Slider */}
              <div className="calc-control">
                <div className="calc-control__header">
                  <span className="calc-control__label">Первоначальный взнос ({downPaymentPercent}%)</span>
                  <span className="calc-control__value">{downPaymentRubles.toLocaleString('ru-RU')} ₽</span>
                </div>
                <input
                  type="range"
                  min="20.1"
                  max="80"
                  step="0.5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="calc-range"
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {[20.1, 30, 50].map(pct => (
                    <button
                      key={pct}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: downPaymentPercent === pct ? 'var(--color-brand-base)' : 'var(--color-additional-bg)',
                        color: downPaymentPercent === pct ? '#ffffff' : 'var(--color-additional-1)',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      onClick={() => setDownPaymentPercent(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Term Slider */}
              <div className="calc-control" style={{ marginBottom: 0 }}>
                <div className="calc-control__header">
                  <span className="calc-control__label">Срок кредита</span>
                  <span className="calc-control__value">{loanTermYears} лет</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={loanTermYears}
                  onChange={(e) => setLoanTermYears(Number(e.target.value))}
                  className="calc-range"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-additional-2)', marginTop: '4px' }}>
                  <span>1 год</span>
                  <span>30 лет</span>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Results */}
            <div className="mortgage-results">
              <div className="mortgage-result__main">
                <div className="mortgage-result__label">Ежемесячный платёж</div>
                <div className="mortgage-result__sum">
                  {monthlyPayment.toLocaleString('ru-RU')} ₽/мес
                </div>
              </div>

              <div className="mortgage-result__sub">
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-additional-1)', marginBottom: '2px' }}>Сумма кредита</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{loanAmount.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-additional-1)', marginBottom: '2px' }}>Необходимый доход</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{requiredIncome.toLocaleString('ru-RU')} ₽</div>
                </div>
              </div>

              {/* Action */}
              <button
                className="btn btn--primary btn--lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleApply}
              >
                Подать заявку на ипотеку <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Bank Partners */}
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-additional-1)', marginBottom: '16px' }}>
              Банки-партнёры проекта
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {banks.map((bank, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--color-additional-bg)',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <Landmark size={16} color="var(--color-brand-base)" />
                  <span>{bank.name}</span>
                  <span style={{ color: 'var(--color-brand-base)', fontWeight: 800 }}>от {bank.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
