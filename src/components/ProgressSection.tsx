import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { progressAlbums } from '../data/commonData';
import { Camera, Video, Calendar, Image as ImageIcon, Maximize2, Play } from 'lucide-react';

export const ProgressSection: React.FC = () => {
  const { openLightbox } = useAppStore();
  const [activeTab, setActiveTab] = useState<'photos' | 'online'>('photos');
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);

  const currentAlbum = progressAlbums[selectedAlbumIndex];

  return (
    <section className="section section--grey" id="progress">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-tag">Динамика проекта</span>
            <h2 className="section-title">Ход строительства</h2>
            <p className="section-subtitle">
              Ежемесячные фотоотчеты со строительной площадки и круглосуточная онлайн-трансляция.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`flats-tab ${activeTab === 'photos' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              <Camera size={16} /> Фотоотчёты
            </button>
            <button
              className={`flats-tab ${activeTab === 'online' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('online')}
            >
              <Video size={16} /> Онлайн-трансляция
            </button>
          </div>
        </div>

        {activeTab === 'photos' ? (
          <div>
            {/* Months Selector */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '28px' }}>
              {progressAlbums.map((album, idx) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbumIndex(idx)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    background: selectedAlbumIndex === idx ? 'var(--color-brand-base)' : '#ffffff',
                    color: selectedAlbumIndex === idx ? '#ffffff' : 'var(--color-brand-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {album.month} {album.year}
                </button>
              ))}
            </div>

            {/* Selected Album Details */}
            {currentAlbum && (
              <div style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                padding: '36px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800 }}>{currentAlbum.title}</h3>
                  <span style={{ fontSize: '14px', color: 'var(--color-additional-1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> {currentAlbum.date} • {currentAlbum.photosCount} фото
                  </span>
                </div>

                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-additional-1)', marginBottom: '28px' }}>
                  {currentAlbum.description}
                </p>

                {/* Album Photo Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '16px'
                }}>
                  {currentAlbum.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        position: 'relative',
                        aspectRatio: '4 / 3',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      onClick={() => openLightbox(photo.url, currentAlbum.title, photo.caption)}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.caption}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {photo.caption}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Stream View */
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=85" 
                alt="Онлайн трансляция стройки STAVNI"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />

              {/* Live Badge */}
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                background: 'rgba(227, 82, 4, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  animation: 'pulse-ring 1.5s infinite'
                }}></span>
                В ЭФИРЕ • КАМЕРА №1 (СЕКЦИИ 1-3)
              </div>

              {/* Timestamp */}
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                color: '#ffffff',
                background: 'rgba(0,0,0,0.6)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                LIVE: {new Date().toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
