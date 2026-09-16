import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { developerStats } from '../../data/kioskData';
import { 
  Building2, 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  Users, 
  Layers, 
  ShieldCheck, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const KioskAboutDeveloperView: React.FC = () => {
  const { setKioskSection, openLightbox } = useAppStore();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '16px'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderRadius: '16px',
        background: 'rgba(16, 20, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => setKioskSection('genplan')}
          className="kiosk-btn"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} />
          <span>Генплан</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="kiosk-code-badge">
            SANSATA GROUP
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
            Надежный девелопер с 2012 года
          </span>
        </div>

        <div style={{
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#4ade80',
          fontSize: '12px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={14} />
          <span>Рейтинг надежности: ААА</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="kiosk-glass kiosk-scroll" style={{
        padding: '32px',
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {/* Intro Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '32px',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.15 }}>
              Создаем пространства для жизни, вдохновения и семейного благополучия
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginTop: '16px' }}>
              {developerStats.description}
            </p>
          </div>

          {/* Key Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px'
          }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#ff8e52' }}>{developerStats.builtSqMeters}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Построено и введено в эксплуатацию</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#4ade80' }}>{developerStats.happyFamilies}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Счастливых семей резидентов</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#60a5fa' }}>{developerStats.completedProjects}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Реализованных жилых проектов</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#c084fc' }}>14 лет</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>Безупречной репутации на рынке</div>
            </div>
          </div>
        </div>

        {/* Awards Section */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
            Награды и признание профессионального сообщества:
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px'
          }}>
            {developerStats.awards.map((award, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(227, 82, 4, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff8e52',
                  flexShrink: 0
                }}>
                  <Award size={20} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                  {award}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
