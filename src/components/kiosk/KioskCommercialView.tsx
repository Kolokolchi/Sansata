import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { commercialSpacesData } from '../../data/kioskData';
import { CommercialSpace } from '../../types';
import { Store, ArrowLeft, ShieldCheck, Check, Zap, Maximize2 } from 'lucide-react';

export const KioskCommercialView: React.FC = () => {
  const { setKioskSection, showSuccessModal, openLightbox } = useAppStore();
  const [selectedComm, setSelectedComm] = useState<CommercialSpace>(commercialSpacesData[0]);

  const handleBook = (comm: CommercialSpace) => {
    showSuccessModal(
      'Заявка на коммерческое помещение принята',
      `Помещение №${comm.number} (${comm.purpose}, ${comm.area} м²) зарезервировано. Менеджер коммерческой недвижимости свяжется с вами.`
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
          {commercialSpacesData.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedComm(c)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: selectedComm.id === c.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: selectedComm.id === c.id ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              №{c.number} ({c.area} м²)
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
          1-й этаж • Высокий пешеходный трафик
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Photo & Plan */}
        <div className="kiosk-glass" style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => openLightbox(selectedComm.image, selectedComm.name, `${selectedComm.area} м², ${selectedComm.purpose}`)}
        >
          <img 
            src={selectedComm.image} 
            alt={selectedComm.name}
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
              {selectedComm.purpose}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0 0' }}>
              {selectedComm.name}
            </h2>
          </div>
        </div>

        {/* Right Details */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          {/* Price */}
          <div style={{
            padding: '18px',
            borderRadius: '14px',
            background: 'rgba(227, 82, 4, 0.1)',
            border: '1px solid rgba(227, 82, 4, 0.3)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Стоимость помещения
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
              {selectedComm.price.toLocaleString('ru-RU')} ₽
            </div>
            <div style={{ fontSize: '13px', color: '#ff8e52', marginTop: '4px', fontWeight: 700 }}>
              {selectedComm.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
            </div>
          </div>

          {/* Specs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Площадь</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{selectedComm.area} м²</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Потолки</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{selectedComm.ceilingHeight} м</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Эл. мощность</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{selectedComm.powerKw} кВт</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Входная группа</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ff8e52', marginTop: '2px' }}>
                {selectedComm.entrance === 'both' ? 'Улица и двор' : selectedComm.entrance === 'street' ? 'С улицы' : 'Со двора'}
              </div>
            </div>
          </div>

          {/* Action */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              onClick={() => handleBook(selectedComm)}
              className="kiosk-btn kiosk-btn--green"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800 }}
            >
              <ShieldCheck size={18} />
              <span>Забронировать коммерческое помещение</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
