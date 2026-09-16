import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { mopSpacesData } from '../../data/kioskData';
import { Sparkles, ArrowLeft, Box, Check, ChevronRight } from 'lucide-react';

export const KioskMopView: React.FC = () => {
  const { setKioskSection, openPlanoplanModal, openLightbox } = useAppStore();
  const [selectedMopId, setSelectedMopId] = useState<string>(mopSpacesData[0].id);

  const selectedMop = mopSpacesData.find(m => m.id === selectedMopId) || mopSpacesData[0];

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
          <span>Назад к генплану</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {mopSpacesData.map(mop => (
            <button
              key={mop.id}
              onClick={() => setSelectedMopId(mop.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: selectedMopId === mop.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: selectedMopId === mop.id ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {mop.categoryName}
            </button>
          ))}
        </div>

        <button
          onClick={() => openPlanoplanModal(selectedMop.planoplanUid || '2ee1019ddb3e8f756ad9aa354403604c_3d')}
          className="kiosk-btn kiosk-btn--primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <Box size={16} />
          <span>3D-тур интерьера</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Big Visual View */}
        <div 
          className="kiosk-glass" 
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={() => openLightbox(selectedMop.imageUrl, selectedMop.title, selectedMop.description)}
        >
          <img 
            src={selectedMop.imageUrl} 
            alt={selectedMop.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,10,14,0.85) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px',
            color: '#ffffff'
          }}>
            <span className="kiosk-code-badge" style={{ marginBottom: '8px' }}>
              {selectedMop.categoryName}
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 0 0' }}>
              {selectedMop.title}
            </h2>
          </div>
        </div>

        {/* Right Info & Features */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#ff8e52', fontWeight: 800 }}>
              Концепция пространств
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginTop: '8px' }}>
              {selectedMop.description}
            </p>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              Преимущества и оснащение:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedMop.features.map((feat, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ade80'
                  }}>
                    <Check size={14} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              onClick={() => openPlanoplanModal(selectedMop.planoplanUid || '2ee1019ddb3e8f756ad9aa354403604c_3d')}
              className="kiosk-btn kiosk-btn--primary"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800 }}
            >
              <Box size={18} />
              <span>Открыть интерактивный 3D-тур</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
