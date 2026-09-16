import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';

export const KioskFarewellScreen: React.FC = () => {
  const { finishFarewell } = useAppStore();
  const [countdown, setCountdown] = useState<number>(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishFarewell();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finishFarewell]);

  return (
    <div className="kiosk-modal-backdrop">
      <div 
        className="kiosk-glass-heavy"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '48px 40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.2)',
          border: '2px solid #22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4ade80',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)'
        }}>
          <CheckCircle2 size={40} />
        </div>

        <div>
          <div className="kiosk-code-badge" style={{ marginBottom: '8px' }}>
            Сеанс B8 завершен
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            Спасибо за интерес к ЖК STAVNI!
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '12px', lineHeight: 1.5 }}>
            Мы сохранили ваши избранные планировки. Наши менеджеры в офисе продаж всегда готовы ответить на любые вопросы и организовать персональный показ.
          </p>
        </div>

        <div style={{
          padding: '12px 24px',
          borderRadius: '30px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Возврат на стартовый экран через <strong style={{ color: '#ff8e52' }}>{countdown}</strong> сек...
        </div>

        <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
          <button
            onClick={finishFarewell}
            className="kiosk-btn kiosk-btn--primary"
            style={{ padding: '12px 28px', borderRadius: '12px' }}
          >
            <RotateCcw size={16} />
            <span>Начать новый сеанс сейчас</span>
          </button>
        </div>
      </div>
    </div>
  );
};
