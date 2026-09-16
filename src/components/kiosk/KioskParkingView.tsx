import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parkingSpotsData } from '../../data/kioskData';
import { ParkingSpot } from '../../types';
import { Car, ArrowLeft, Zap, ShieldCheck, Check, Info } from 'lucide-react';

export const KioskParkingView: React.FC = () => {
  const { setKioskSection, showSuccessModal } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState<-1 | -2>(-1);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(parkingSpotsData[0]);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredSpots = parkingSpotsData.filter(spot => 
    spot.level === selectedLevel &&
    (filterType === 'all' || (filterType === 'ev' && spot.hasCharger) || spot.type === filterType)
  );

  const handleBookSpot = (spot: ParkingSpot) => {
    showSuccessModal(
      'Заявка на бронирование машиноместа принята',
      `Машиноместо №${spot.number} (Уровень ${spot.level}, ${spot.typeName}, ${spot.area} м²) зафиксировано за вами по цене ${spot.price.toLocaleString('ru-RU')} ₽.`
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

        {/* Level Switcher (-1 and -2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
            Уровень паркинга:
          </span>
          {[-1, -2].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl as -1 | -2)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: selectedLevel === lvl ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: selectedLevel === lvl ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Уровень {lvl} этаж
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'Все места' },
            { id: 'ev', label: 'С зарядкой EV' },
            { id: 'standard', label: 'Стандарт' },
            { id: 'family', label: 'Семейные' },
            { id: 'moto', label: 'Мото' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: filterType === f.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: filterType === f.id ? 'rgba(227, 82, 4, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === f.id ? '#ff8e52' : '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Interactive Parking Scheme & Right Spot Detail Sheet */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Parking Bays Map */}
        <div className="kiosk-glass" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              Схема подземного уровня {selectedLevel} (168 машиномест)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                Свободно
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
                Бронь
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748b' }} />
                Продано
              </span>
            </div>
          </div>

          {/* Interactive Spots Scheme Grid */}
          <div style={{
            flex: 1,
            background: 'rgba(8, 10, 14, 0.7)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
            overflowY: 'auto'
          }}>
            {filteredSpots.map(spot => {
              const isSelected = selectedSpot?.id === spot.id;
              const isAvailable = spot.status === 'available';

              return (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: isSelected 
                      ? '#e35204' 
                      : spot.status === 'available' 
                      ? 'rgba(34, 197, 94, 0.4)' 
                      : spot.status === 'reserved' 
                      ? 'rgba(234, 179, 8, 0.4)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    background: isSelected 
                      ? 'rgba(227, 82, 4, 0.25)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 16px rgba(227, 82, 4, 0.4)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: '15px', color: '#ffffff' }}>
                      №{spot.number}
                    </span>
                    {spot.hasCharger && (
                      <Zap size={14} color="#38bdf8" />
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {spot.typeName}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginTop: 'auto' }}>
                    {spot.area} м²
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ff8e52' }}>
                    {(spot.price / 1000000).toFixed(2)} млн ₽
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Parking Spot Spec Sheet */}
        {selectedSpot && (
          <div className="kiosk-glass kiosk-scroll" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto'
          }}>
            <div>
              <span className="kiosk-code-badge" style={{ marginBottom: '8px' }}>
                Уровень {selectedSpot.level} • Машиноместо №{selectedSpot.number}
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>
                {selectedSpot.typeName}
              </h2>
            </div>

            {/* Price Box */}
            <div style={{
              padding: '18px',
              borderRadius: '14px',
              background: 'rgba(227, 82, 4, 0.1)',
              border: '1px solid rgba(227, 82, 4, 0.3)'
            }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                Стоимость места
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {selectedSpot.price.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ fontSize: '13px', color: '#ff8e52', marginTop: '4px', fontWeight: 700 }}>
                {Math.round(selectedSpot.price / selectedSpot.area).toLocaleString('ru-RU')} ₽/м²
              </div>
            </div>

            {/* Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Площадь</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{selectedSpot.area} м²</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Статус</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: selectedSpot.status === 'available' ? '#4ade80' : '#facc15', marginTop: '2px' }}>
                  {selectedSpot.status === 'available' ? 'Свободно' : 'Забронировано'}
                </div>
              </div>
            </div>

            {/* Parking Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Оснащение паркинга:
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                • Прямой скоростной лифт с этажа квартиры<br />
                • Круглосуточное видеонаблюдение и охрана<br />
                • Система автоматического считывания номеров<br />
                • Отопление и приточно-вытяжная вентиляция
              </div>
            </div>

            {/* Booking action */}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                onClick={() => handleBookSpot(selectedSpot)}
                disabled={selectedSpot.status !== 'available'}
                className="kiosk-btn kiosk-btn--green"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  opacity: selectedSpot.status === 'available' ? 1 : 0.5
                }}
              >
                <ShieldCheck size={18} />
                <span>Забронировать машиноместо</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
