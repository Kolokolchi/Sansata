import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Building2, 
  Sparkles, 
  Car, 
  Store, 
  Trees, 
  Layers, 
  Box, 
  Eye, 
  Compass, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { KioskBuildingExplorer } from './KioskBuildingExplorer';

export const KioskMasterplanView: React.FC = () => {
  const { 
    kioskPointType, 
    setKioskPointType, 
    setKioskBuildingId, 
    timeOfDay,
    openPlanoplanModal
  } = useAppStore();

  const [activeSubMode, setActiveSubMode] = useState<'overview' | 'building-explorer'>('overview');

  // Hotspot points definition according to Mindmap
  const hotspots = [
    {
      id: 'building-1',
      type: 'building' as const,
      label: 'Корпус (Секции 1-5)',
      sub: '280 квартир бизнес-класса',
      badge: 'B2',
      x: 50,
      y: 42,
      sectionId: 1
    },
    {
      id: 'mop-point',
      type: 'mop' as const,
      label: 'МОПы и Гранд-лобби',
      sub: 'Дизайнерские холлы 4.8м',
      x: 42,
      y: 68
    },
    {
      id: 'parking-point',
      type: 'parking' as const,
      label: 'Подземный паркинг',
      sub: '-1 и -2 этажи (168 мест)',
      x: 68,
      y: 74
    },
    {
      id: 'commercial-point',
      type: 'commercial' as const,
      label: 'Коммерция 1 этаж',
      sub: 'Стрит-ритейл и рестораны',
      x: 28,
      y: 62
    },
    {
      id: 'other-point',
      type: 'other' as const,
      label: 'Благоустройство & Келлеры',
      sub: 'Двор-парк 0.8 га, лаунж-кровля',
      x: 62,
      y: 30
    }
  ];

  if (activeSubMode === 'building-explorer') {
    return (
      <div style={{ height: '100%' }}>
        <KioskBuildingExplorer />
      </div>
    );
  }

  const bgImage = timeOfDay === 'night' 
    ? '/images/facade_3d.jpg'
    : timeOfDay === 'sunset' 
    ? '/images/courtyard.jpg' 
    : '/images/hero_facade.jpg';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Top Points Switcher Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderRadius: '16px',
        background: 'rgba(16, 20, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#ff8e52', marginRight: '6px' }}>
            Поинты генплана:
          </span>

          <button
            onClick={() => setActiveSubMode('building-explorer')}
            className="kiosk-btn kiosk-btn--primary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <Building2 size={16} />
            <span>Корпус (Выбор этажей)</span>
          </button>

          <button
            onClick={() => setKioskPointType('mop')}
            className="kiosk-btn"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <Sparkles size={16} />
            <span>МОПы</span>
          </button>

          <button
            onClick={() => setKioskPointType('parking')}
            className="kiosk-btn"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <Car size={16} />
            <span>Паркинг</span>
          </button>

          <button
            onClick={() => setKioskPointType('commercial')}
            className="kiosk-btn"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <Store size={16} />
            <span>Коммерция</span>
          </button>

          <button
            onClick={() => setKioskPointType('other')}
            className="kiosk-btn"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <Trees size={16} />
            <span>Прочее</span>
          </button>
        </div>

        {/* 3D Tour Fullscreen Button */}
        <button
          onClick={() => openPlanoplanModal('2ee1019ddb3e8f756ad9aa354403604c_3d')}
          className="kiosk-btn"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <Box size={16} />
          <span>Полноэкранный 3D-тур</span>
        </button>
      </div>

      {/* Interactive 3D Canvas Box with Hotspots */}
      <div style={{
        flex: 1,
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        <img 
          src={bgImage} 
          alt="3D Генплан"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: timeOfDay === 'night' ? 'brightness(0.7) contrast(1.15)' : 'none',
            transition: 'all 0.6s ease'
          }}
        />

        {/* Dark Vignette Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10, 12, 16, 0.8) 0%, transparent 40%, rgba(10, 12, 16, 0.4) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Compass Badge in Top Right */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          borderRadius: '30px',
          background: 'rgba(14, 16, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700
        }}>
          <Compass size={16} color="#e35204" />
          <span>Ориентация: Юг / Восток</span>
        </div>

        {/* Interactive Hotspot Pins */}
        {hotspots.map(spot => (
          <div
            key={spot.id}
            className="kiosk-hotspot-pin"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={() => {
              if (spot.type === 'building') {
                setActiveSubMode('building-explorer');
              } else {
                setKioskPointType(spot.type);
              }
            }}
          >
            <div className="kiosk-pin-ring" />
            <div className="kiosk-pin-core">
              {spot.type === 'building' && <Building2 size={16} color="#ff8e52" />}
              {spot.type === 'mop' && <Sparkles size={16} color="#4ade80" />}
              {spot.type === 'parking' && <Car size={16} color="#60a5fa" />}
              {spot.type === 'commercial' && <Store size={16} color="#fbbf24" />}
              {spot.type === 'other' && <Trees size={16} color="#a78bfa" />}

              <div>
                <div>{spot.label}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 500 }}>
                  {spot.sub}
                </div>
              </div>

              <ChevronRight size={14} color="rgba(255, 255, 255, 0.5)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
