import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Sun, 
  Moon, 
  Sunset, 
  Camera, 
  Settings, 
  LogOut, 
  Globe, 
  Volume2, 
  VolumeX, 
  Maximize2 
} from 'lucide-react';

export const KioskHeader: React.FC = () => {
  const { 
    kioskSection, 
    kioskPointType,
    timeOfDay, 
    setTimeOfDay, 
    triggerScreenshot, 
    openKioskSettingsModal, 
    endKioskSession, 
    setAppMode,
    kioskSettings,
    updateKioskSettings
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSectionTitle = () => {
    switch (kioskSection) {
      case 'genplan': return 'Генплан комплекса (B2)';
      case 'search': return 'Поиск по параметрам (B3)';
      case 'favorites': return 'Избранное (B5)';
      case 'infrastructure': return 'Инфраструктура района (B6)';
      case 'about-project': return 'О проекте STAVNI (B7)';
      case 'developer': return 'О девелопере Sansata Group';
      case 'mop': return 'МОПы и общественные зоны';
      case 'parking': return 'Подземный паркинг (-1 / -2 этажи)';
      case 'commercial': return 'Коммерческие помещения';
      case 'other': return 'Благоустройство и келлеры';
      default: return 'Интерактивный терминал';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      zIndex: 100,
      position: 'relative',
      background: 'rgba(10, 12, 16, 0.75)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Brand & Active Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '18px',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(227, 82, 4, 0.4)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.08em', color: '#ffffff' }}>
              STAVNI
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              by Sansata Group
            </div>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
            {getSectionTitle()}
          </span>
        </div>
      </div>

      {/* Controls & Time of Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Time of day switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '30px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setTimeOfDay('day')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: timeOfDay === 'day' ? '#e35204' : 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
            title="Дневное освещение"
          >
            <Sun size={14} />
            <span>День</span>
          </button>
          <button
            onClick={() => setTimeOfDay('sunset')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: timeOfDay === 'sunset' ? '#e35204' : 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
            title="Закатное освещение"
          >
            <Sunset size={14} />
            <span>Закат</span>
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: timeOfDay === 'night' ? '#e35204' : 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
            title="Ночная подсветка"
          >
            <Moon size={14} />
            <span>Ночь</span>
          </button>
        </div>

        {/* Screenshot Button */}
        <button
          onClick={triggerScreenshot}
          className="kiosk-btn"
          style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '24px' }}
          title="Сделать снимок экрана"
        >
          <Camera size={15} />
          <span>Снимок экрана</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => updateKioskSettings({ soundEnabled: !kioskSettings.soundEnabled })}
          className="kiosk-btn kiosk-btn--icon"
          style={{ width: '38px', height: '38px' }}
          title={kioskSettings.soundEnabled ? 'Звук включен' : 'Звук выключен'}
        >
          {kioskSettings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Settings Modal Opener */}
        <button
          onClick={openKioskSettingsModal}
          className="kiosk-btn kiosk-btn--icon"
          style={{ width: '38px', height: '38px' }}
          title="Настройки терминала"
        >
          <Settings size={16} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="kiosk-btn kiosk-btn--icon"
          style={{ width: '38px', height: '38px' }}
          title="Полноэкранный режим"
        >
          <Maximize2 size={16} />
        </button>

        {/* End Session Button (B8) */}
        <button
          onClick={endKioskSession}
          className="kiosk-btn"
          style={{ 
            padding: '8px 16px', 
            fontSize: '13px', 
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5'
          }}
          title="Завершить текущий сеанс презентации (B8)"
        >
          <LogOut size={15} />
          <span>Завершить сеанс</span>
          <span className="kiosk-code-badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}>
            B8
          </span>
        </button>

        {/* Clock & Weather Widget */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '13px',
          fontWeight: 700
        }}>
          <span>СПб</span>
          <span style={{ color: '#e35204' }}>•</span>
          <span>{currentTime || '12:00'}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>|</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>+21°C</span>
        </div>
      </div>
    </header>
  );
};
