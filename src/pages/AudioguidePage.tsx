import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Headphones, Play, Pause, SkipForward, SkipBack, Volume2, MapPin, Clock, ArrowLeft } from 'lucide-react';

interface AudioTrack {
  id: number;
  title: string;
  duration: string;
  location: string;
  description: string;
  imageUrl: string;
}

export const AudioguidePage: React.FC = () => {
  const { navigateTo } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(25);

  const tracks: AudioTrack[] = [
    {
      id: 1,
      title: 'Введение: Индустриальное величие Обводного канала',
      duration: '4:15',
      location: 'Старт маршрута • Набережная Обводного канала',
      description: 'История создания крупнейшего водного пути Петербурга XIX века и его трансформация в центр креативной и жилой жизни.',
      imageUrl: '/images/hero_facade.jpg'
    },
    {
      id: 2,
      title: 'Варшавский вокзал и рождение Vokzal 1853',
      duration: '5:40',
      location: 'наб. Обводного канала, 118',
      description: 'От императорских поездов до крупнейшего фуд-молла Европы: архитектурный ренессанс исторического памятника.',
      imageUrl: '/images/vokzal_1853.jpg'
    },
    {
      id: 3,
      title: 'Газгольдеры и Планетарий № 1: Космос на Обводном',
      duration: '4:45',
      location: 'наб. Обводного канала, 74Ц',
      description: 'Уникальные кирпичные резервуары Общества столичного освещения и их новая космическая жизнь с крупнейшим куполом в мире.',
      imageUrl: '/images/planetarium_1.jpg'
    },
    {
      id: 4,
      title: 'ЖК STAVNI: Новая веха комфортной жизни на набережной',
      duration: '3:20',
      location: 'наб. Обводного канала, 118А, лит. С',
      description: 'Камерный дом бизнес-класса, бережно продолжающий петербургские традиции в современной архитектуре.',
      imageUrl: '/images/grand_lobby.jpg'
    },
    {
      id: 5,
      title: 'Приватный оазис: Двор-сад без машин',
      duration: '3:50',
      location: 'Внутренний двор ЖК STAVNI',
      description: 'Ландшафтный дизайн, зоны тихого отдыха с перголами и безопасность как естественная часть архитектуры.',
      imageUrl: '/images/courtyard.jpg'
    }
  ];

  const current = tracks[currentTrackIndex];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
  };

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 20px)', paddingBottom: '80px', minHeight: '100vh', background: '#141113', color: '#ffffff' }}>
      <div className="container">
        {/* Top Back Nav */}
        <div style={{ marginBottom: '28px' }}>
          <button
            className="btn btn--outline-white btn--sm"
            onClick={() => navigateTo('home')}
          >
            <ArrowLeft size={16} /> Вернуться на главную
          </button>
        </div>

        {/* Title Header */}
        <div style={{ maxWidth: '780px', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-light)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
            <Headphones size={16} /> Аудиоэкскурсия по району
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
            Обводный канал: Путешествие между эпохами
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '12px', lineHeight: 1.6 }}>
            Послушайте увлекательные истории об архитектуре, инженерных инновациях и атмосфере исторического района вокруг ЖК STAVNI.
          </p>
        </div>

        {/* Player Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Main Active Player Card */}
          <div style={{
            background: '#1d181b',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
          }}>
            <div style={{ aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px' }}>
              <img 
                src={current.imageUrl} 
                alt={current.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ fontSize: '13px', color: 'var(--color-brand-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <MapPin size={14} /> {current.location}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>
              {current.title}
            </h2>

            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '28px' }}>
              {current.description}
            </p>

            {/* Timeline Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{ height: '6px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '3px', cursor: 'pointer', position: 'relative' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress(Math.round((clickX / rect.width) * 100));
                }}
              >
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-brand-base)', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '6px' }}>
                <span>01:15</span>
                <span>{current.duration}</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <button 
                className="btn-circle" 
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                onClick={prevTrack}
              >
                <SkipBack size={18} />
              </button>

              <button 
                onClick={togglePlay}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--color-brand-base)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-brand)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
              </button>

              <button 
                className="btn-circle" 
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                onClick={nextTrack}
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
              Главы экскурсии ({tracks.length})
            </div>

            {tracks.map((track, idx) => {
              const isCurrent = currentTrackIndex === idx;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrent ? 'rgba(227, 82, 4, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isCurrent ? 'var(--color-brand-base)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--color-brand-base)' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {isCurrent && isPlaying ? <Pause size={14} /> : idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3, marginBottom: '2px' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {track.duration}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
