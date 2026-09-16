import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Phone, Download, Star, MapPin, Compass, Home, Layers, Headphones, Monitor } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { navigateTo, openCallbackModal, openBookletModal, favorites, setAppMode } = useAppStore();

  if (!isOpen) return null;

  const handleNavClick = (page: string) => {
    navigateTo(page);
    onClose();
  };

  const handleAnchorClick = (anchorId: string) => {
    navigateTo('home');
    onClose();
    setTimeout(() => {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(15, 12, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      animation: 'fadeIn 0.25s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '2px' }}>
          STAVNI <span style={{ color: 'var(--color-brand-light)', fontSize: '12px' }}>ОБВОДНЫЙ</span>
        </div>
        <button 
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Kiosk Mode Launcher */}
        <button
          onClick={() => {
            setAppMode('kiosk');
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)',
            border: 'none',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 800,
            textAlign: 'left',
            boxShadow: '0 4px 20px rgba(227, 82, 4, 0.4)'
          }}
        >
          <Monitor size={20} />
          <span>Интерактивный 3D-терминал</span>
        </button>

        {/* Main CTA Links */}
        <button
          onClick={() => handleNavClick('visual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            background: 'rgba(227, 82, 4, 0.2)',
            border: '1px solid var(--color-brand-base)',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'left'
          }}
        >
          <Compass size={20} color="var(--color-brand-light)" />
          Выбрать квартиру на 3D-плане
        </button>

        <button
          onClick={() => handleNavClick('parametric-search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'left'
          }}
        >
          <Layers size={20} />
          Выбрать квартиру по параметрам
        </button>

        <button
          onClick={() => handleNavClick('audiogid')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'left'
          }}
        >
          <Headphones size={20} color="var(--color-brand-light)" />
          Аудиоэкскурсия по району
        </button>

        <button
          onClick={() => handleNavClick('favorite')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Star size={20} /> Избранное
          </div>
          <span style={{
            background: 'var(--color-brand-base)',
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '12px'
          }}>
            {favorites.length}
          </span>
        </button>

        {/* Anchor Links */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, fontWeight: 700 }}>
            О комплексе
          </div>
          <a href="#about" onClick={(e) => { e.preventDefault(); handleAnchorClick('about'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>О проекте</a>
          <a href="#mesto" onClick={(e) => { e.preventDefault(); handleAnchorClick('mesto'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Преимущества локации</a>
          <a href="#flats" onClick={(e) => { e.preventDefault(); handleAnchorClick('flats'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Планировки и цены</a>
          <a href="#finishing" onClick={(e) => { e.preventDefault(); handleAnchorClick('finishing'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Отделка Whitebox</a>
          <a href="#location" onClick={(e) => { e.preventDefault(); handleAnchorClick('location'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Инфраструктура на карте</a>
          <a href="#akcii" onClick={(e) => { e.preventDefault(); handleAnchorClick('akcii'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Акции и скидки</a>
          <a href="#mortgage" onClick={(e) => { e.preventDefault(); handleAnchorClick('mortgage'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Ипотечный калькулятор</a>
          <a href="#progress" onClick={(e) => { e.preventDefault(); handleAnchorClick('progress'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Ход строительства</a>
          <a href="#docs" onClick={(e) => { e.preventDefault(); handleAnchorClick('docs'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Документы</a>
          <a href="#contacts" onClick={(e) => { e.preventDefault(); handleAnchorClick('contacts'); }} style={{ fontSize: '15px', padding: '6px 0', opacity: 0.85 }}>Контакты</a>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <a 
          href="tel:+78125011151" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--color-brand-light)'
          }}
        >
          <Phone size={18} /> +7 (812) 501-11-51
        </a>
        <button
          className="btn btn--primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => {
            onClose();
            openCallbackModal();
          }}
        >
          Заказать звонок
        </button>
      </div>
    </div>
  );
};
