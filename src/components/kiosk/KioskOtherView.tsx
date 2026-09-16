import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { otherAmenitiesData } from '../../data/kioskData';
import { OtherAmenity } from '../../types';
import { Trees, ArrowLeft, Check, Sparkles, ShieldCheck } from 'lucide-react';

export const KioskOtherView: React.FC = () => {
  const { setKioskSection, openLightbox, showSuccessModal } = useAppStore();
  const [selectedAmenity, setSelectedAmenity] = useState<OtherAmenity>(otherAmenitiesData[0]);

  const handleBookCellar = () => {
    showSuccessModal(
      'Заявка на кладовое помещение принята',
      'Менеджер свяжется с вами для подбора оптимальной площади и расположения келлера на -1 или -2 этаже.'
    );
  };

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
          {otherAmenitiesData.map(amenity => (
            <button
              key={amenity.id}
              onClick={() => setSelectedAmenity(amenity)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: selectedAmenity.id === amenity.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: selectedAmenity.id === amenity.id ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {amenity.title}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
          Пространства для резидентов
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Photo */}
        <div 
          className="kiosk-glass" 
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={() => openLightbox(selectedAmenity.imageUrl, selectedAmenity.title, selectedAmenity.description)}
        >
          <img 
            src={selectedAmenity.imageUrl} 
            alt={selectedAmenity.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,12,16,0.9) 0%, transparent 50%)',
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
              {selectedAmenity.subtitle}
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 0 0' }}>
              {selectedAmenity.title}
            </h2>
          </div>
        </div>

        {/* Right Info */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#ff8e52', fontWeight: 800 }}>
              Описание объекта
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, marginTop: '8px' }}>
              {selectedAmenity.description}
            </p>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              Характеристики:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {selectedAmenity.specs.map((spec, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>{spec.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '3px' }}>
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedAmenity.category === 'cellar' && (
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                onClick={handleBookCellar}
                className="kiosk-btn kiosk-btn--green"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800 }}
              >
                <ShieldCheck size={18} />
                <span>Забронировать кладовую (Келлер)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
