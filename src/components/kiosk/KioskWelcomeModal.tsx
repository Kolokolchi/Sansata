import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sparkles, Compass, Layers, MousePointer, ShieldCheck, ArrowRight, X } from 'lucide-react';

export const KioskWelcomeModal: React.FC = () => {
  const { setKioskStep, setKioskSection } = useAppStore();

  const handleProceed = () => {
    setKioskSection('genplan');
    setKioskStep('hud');
  };

  return (
    <div className="kiosk-modal-backdrop">
      <div 
        className="kiosk-glass-heavy"
        style={{
          width: '100%',
          maxWidth: '780px',
          padding: '40px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}
      >
        {/* Close / Skip button */}
        <button
          onClick={handleProceed}
          className="kiosk-btn kiosk-btn--icon"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(227, 82, 4, 0.4)'
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="kiosk-code-badge" style={{ marginBottom: '4px' }}>
              Сеанс B1 активирован
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Добро пожаловать в презентацию ЖК STAVNI
            </h2>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.6, margin: 0 }}>
          Перед вами интерактивное цифровое пространство комплекса бизнес-класса. Используйте сенсорное управление для детального изучения инфраструктуры, фасадов и планировок.
        </p>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          <div style={{
            padding: '18px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(227, 82, 4, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff8e52',
              marginBottom: '12px'
            }}>
              <Layers size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff', marginBottom: '4px' }}>
              3D-Генплан и Корпуса
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Интерактивная нарезка секций, выбор этажа и квартир с ценами и статусами.
            </div>
          </div>

          <div style={{
            padding: '18px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80',
              marginBottom: '12px'
            }}>
              <Compass size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff', marginBottom: '4px' }}>
              Инсоляция & 3D-туры
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Симуляция траектории движения солнца и виртуальные прогулки по комнатам.
            </div>
          </div>

          <div style={{
            padding: '18px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
              marginBottom: '12px'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff', marginBottom: '4px' }}>
              Бронирование в 1 клик
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Мгновенная фиксация цены, выгрузка PDF-буклета и подбор ипотеки.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '8px' }}>
          <button
            onClick={handleProceed}
            className="kiosk-btn kiosk-btn--primary"
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              borderRadius: '14px',
              fontWeight: 800
            }}
          >
            <span>Перейти к интерактивному меню</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
