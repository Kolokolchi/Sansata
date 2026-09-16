import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Play, 
  Layers, 
  Film, 
  Building2, 
  Info, 
  ChevronRight, 
  Sparkles, 
  Compass, 
  ShieldCheck,
  Award,
  Globe
} from 'lucide-react';

export const KioskStartScreen: React.FC = () => {
  const { 
    startKioskSession, 
    openVideoTourModal, 
    setKioskSection, 
    setAppMode,
    timeOfDay
  } = useAppStore();

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 60px',
      overflow: 'hidden',
      zIndex: 10
    }}>
      {/* Background Ambience Image with overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden'
      }}>
        <img 
          src={timeOfDay === 'sunset' ? '/images/courtyard.jpg' : '/images/hero_facade.jpg'} 
          alt="STAVNI Facade"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.05)',
            filter: timeOfDay === 'night' 
              ? 'brightness(0.65) contrast(1.2) saturate(1.1)' 
              : timeOfDay === 'sunset' 
              ? 'brightness(0.75) contrast(1.15) sepia(0.2)' 
              : 'brightness(0.85) contrast(1.1)',
            transition: 'all 0.8s ease'
          }}
        />
        {/* Dark Vignette and Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(227, 82, 4, 0.15) 0%, rgba(5, 7, 10, 0.75) 50%, #05070a 100%)',
          backdropFilter: 'blur(1px)'
        }} />
      </div>

      {/* Top Bar of Start Screen */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '26px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(227, 82, 4, 0.5)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '0.12em', color: '#ffffff' }}>
              STAVNI
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              Жилой комплекс бизнес-класса на Обводном канале
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '13px',
            fontWeight: 700
          }}>
            <Award size={16} color="#e35204" />
            <span>Sansata Group • 24 проекта</span>
          </div>

          <button
            onClick={() => setAppMode('web')}
            className="kiosk-btn"
            style={{ borderRadius: '30px', padding: '8px 18px', fontSize: '13px' }}
          >
            <Globe size={15} />
            <span>Классический веб-сайт</span>
          </button>
        </div>
      </div>

      {/* Center Hero & Quick Action */}
      <div style={{
        maxWidth: '820px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 2
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(227, 82, 4, 0.18)',
          border: '1px solid rgba(227, 82, 4, 0.4)',
          width: 'fit-content'
        }}>
          <Sparkles size={16} color="#ff8e52" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ff8e52', letterSpacing: '0.04em' }}>
            ИНТЕРАКТИВНЫЙ ТЕРМИНАЛ ПРОДАЖ
          </span>
        </div>

        <h1 style={{
          fontSize: '56px',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          textShadow: '0 4px 24px rgba(0, 0, 0, 0.8)'
        }}>
          Архитектурная доминанта с видом на исторический Петербург
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.82)',
          lineHeight: 1.6,
          maxWidth: '680px'
        }}>
          Исследуйте генеральный план в 3D, изучайте планировки с имитацией солнечного света, выбирайте квартиры, парковочные места и коммерческие площади в режиме реального времени.
        </p>

        {/* Primary Start Session Button (B1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
          <button
            onClick={() => startKioskSession()}
            className="kiosk-btn kiosk-btn--primary"
            style={{
              padding: '18px 36px',
              fontSize: '18px',
              borderRadius: '18px',
              fontWeight: 800,
              gap: '14px'
            }}
          >
            <Play size={22} fill="currentColor" />
            <span>Начать сеанс</span>
            <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              B1
            </span>
          </button>

          <button
            onClick={() => openVideoTourModal()}
            className="kiosk-btn"
            style={{
              padding: '18px 28px',
              fontSize: '16px',
              borderRadius: '18px',
              fontWeight: 700
            }}
          >
            <Film size={20} />
            <span>Видеотур</span>
          </button>
        </div>
      </div>

      {/* Bottom Main Menu Grid according to Mindmap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '18px',
        zIndex: 2,
        marginTop: '20px'
      }}>
        {/* Генплан */}
        <div 
          onClick={() => {
            startKioskSession('genplan');
          }}
          className="kiosk-glass"
          style={{
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(20, 24, 34, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(227, 82, 4, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff8e52'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>
                Генплан
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                3D-модель и корпуса
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
        </div>

        {/* Видеотур */}
        <div 
          onClick={() => openVideoTourModal()}
          className="kiosk-glass"
          style={{
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(20, 24, 34, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <Film size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>
                Видеотур
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Кинематографичный полет
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
        </div>

        {/* О проекте */}
        <div 
          onClick={() => {
            startKioskSession('about-project');
          }}
          className="kiosk-glass"
          style={{
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(20, 24, 34, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <Info size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>
                О проекте
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Концепция и инженерия
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
        </div>

        {/* О разработчике */}
        <div 
          onClick={() => {
            startKioskSession('developer');
          }}
          className="kiosk-glass"
          style={{
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(20, 24, 34, 0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>
                О разработчике
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Sansata Group портфолио
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
        </div>
      </div>
    </div>
  );
};
