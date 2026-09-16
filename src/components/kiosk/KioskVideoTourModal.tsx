import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Film, Check } from 'lucide-react';

export const KioskVideoTourModal: React.FC = () => {
  const { videoTourModalOpen, closeVideoTourModal } = useAppStore();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);

  if (!videoTourModalOpen) return null;

  const chapters = [
    { title: '1. Аэросъемка и локация', time: '0:00', desc: 'Набережная Обводного канала, исторические мосты и панорамы' },
    { title: '2. Архитектурный облик', time: '0:45', desc: 'Ступенчатые фасады, натуральный клинкер и витражное остекление' },
    { title: '3. Приватный двор-парк', time: '1:30', desc: 'Территория без машин, геопластика холмов и лаунж-зоны' },
    { title: '4. Гранд-лобби и интерьеры', time: '2:15', desc: 'Двусветное пространство, каминная зона и консьерж 24/7' }
  ];

  return (
    <div className="kiosk-modal-backdrop">
      <div 
        className="kiosk-glass-heavy"
        style={{
          width: '100%',
          maxWidth: '1080px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(10, 12, 16, 0.85)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="kiosk-code-badge">
              4K CINEMATIC
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Видеотур: ЖК STAVNI by Sansata Group
            </h2>
          </div>

          <button
            onClick={closeVideoTourModal}
            className="kiosk-btn kiosk-btn--icon"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Canvas & Chapters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          flex: 1,
          minHeight: 0
        }}>
          {/* Video Player Display */}
          <div style={{
            position: 'relative',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img 
              src={selectedChapter === 0 ? '/images/hero_facade.jpg' : selectedChapter === 1 ? '/images/facade_3d.jpg' : selectedChapter === 2 ? '/images/courtyard.jpg' : '/images/grand_lobby.jpg'}
              alt="Video Poster"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Custom Overlay Controls */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px'
            }}>
              {/* Center Play/Pause button */}
              <div style={{ margin: 'auto' }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'rgba(227, 82, 4, 0.85)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(227, 82, 4, 0.6)'
                  }}
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(14, 16, 22, 0.85)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {chapters[selectedChapter].time} / 3:20
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Chapters Selector */}
          <div className="kiosk-scroll" style={{
            padding: '24px',
            background: 'rgba(12, 14, 18, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#ff8e52' }}>
              Главы презентационного фильма
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chapters.map((chap, idx) => {
                const isSelected = selectedChapter === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedChapter(idx);
                      setIsPlaying(true);
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: isSelected ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(227, 82, 4, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
                        {chap.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#ff8e52', fontWeight: 700 }}>
                        {chap.time}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '6px', lineHeight: 1.4 }}>
                      {chap.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
