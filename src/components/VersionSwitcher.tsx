import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Globe, Monitor, Sparkles } from 'lucide-react';

export const VersionSwitcher: React.FC = () => {
  const { appMode, setAppMode } = useAppStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(18, 18, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '40px',
      padding: '4px',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 20px rgba(227, 82, 4, 0.25)',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={() => setAppMode('web')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '30px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          transition: 'all 0.25s ease',
          background: appMode === 'web' 
            ? 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)' 
            : 'transparent',
          color: appMode === 'web' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: appMode === 'web' ? '0 4px 14px rgba(227, 82, 4, 0.4)' : 'none'
        }}
        title="Классическая веб-версия портала"
      >
        <Globe size={15} />
        <span>Веб-портал</span>
      </button>

      <button
        onClick={() => setAppMode('kiosk')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '30px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          transition: 'all 0.25s ease',
          background: appMode === 'kiosk' 
            ? 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)' 
            : 'transparent',
          color: appMode === 'kiosk' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: appMode === 'kiosk' ? '0 4px 14px rgba(227, 82, 4, 0.4)' : 'none'
        }}
        title="Интерактивный терминал (Кейс Upside Towers / Dprofile)"
      >
        <Monitor size={15} />
        <span>Интерактивный терминал</span>
        <span style={{
          background: 'rgba(255, 255, 255, 0.2)',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 800,
          textTransform: 'uppercase'
        }}>
          Upside UX
        </span>
      </button>
    </div>
  );
};
