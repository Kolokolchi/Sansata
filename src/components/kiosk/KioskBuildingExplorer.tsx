import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apartments } from '../../data/apartmentsData';
import { 
  Building2, 
  Layers, 
  ArrowLeft, 
  Star, 
  Box, 
  ChevronRight, 
  Sparkles, 
  Filter, 
  ShieldCheck,
  Check
} from 'lucide-react';

export const KioskBuildingExplorer: React.FC = () => {
  const { 
    kioskBuildingId, 
    setKioskBuildingId, 
    kioskFloorId, 
    setKioskFloorId, 
    openKioskFlatDetail, 
    openBookingModal, 
    toggleFavorite, 
    isFavorite,
    setKioskPointType,
    timeOfDay
  } = useAppStore();

  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  const sectionsConfig = [
    { id: 1, name: 'Секция 1', totalFloors: 9, minPrice: 11200000, freeFlats: 64 },
    { id: 2, name: 'Секция 2', totalFloors: 11, minPrice: 12500000, freeFlats: 88 },
    { id: 3, name: 'Секция 3', totalFloors: 11, minPrice: 13100000, freeFlats: 92 },
    { id: 4, name: 'Секция 4', totalFloors: 9, minPrice: 11800000, freeFlats: 68 },
    { id: 5, name: 'Секция 5', totalFloors: 8, minPrice: 11900000, freeFlats: 56 }
  ];

  const currentSection = sectionsConfig.find(s => s.id === kioskBuildingId) || sectionsConfig[0];

  // Get flats for selected section and floor
  const floorFlats = apartments.filter(f => 
    f.section === kioskBuildingId && 
    f.floor === kioskFloorId &&
    (selectedRoomFilter === 'all' || f.roomType === selectedRoomFilter)
  );

  // All flats for this section
  const allSectionFlats = apartments.filter(f => f.section === kioskBuildingId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '16px',
      position: 'relative'
    }}>
      {/* Top Nav & Breadcrumb Controls */}
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
        {/* Back button to masterplan */}
        <button
          onClick={() => setKioskPointType('building')}
          className="kiosk-btn"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} />
          <span>Назад к точкам генплана</span>
        </button>

        {/* Section Switcher (Переключение корпуса) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
            Корпус / Секция:
          </span>
          {sectionsConfig.map(sec => (
            <button
              key={sec.id}
              onClick={() => setKioskBuildingId(sec.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: kioskBuildingId === sec.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: kioskBuildingId === sec.id ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: kioskBuildingId === sec.id ? '0 4px 14px rgba(227, 82, 4, 0.4)' : 'none'
              }}
            >
              Секция {sec.id}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
          Свободно: <strong style={{ color: '#ff8e52' }}>{currentSection.freeFlats}</strong> квартир
        </div>
      </div>

      {/* Main Grid: Left Floor Selector (Нарезка этажей) & Right Floor Plan Flats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Vertical Floor Selector */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#ff8e52' }}>
              Выбор этажа
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              1 - {currentSection.totalFloors} эт.
            </span>
          </div>

          {Array.from({ length: currentSection.totalFloors }, (_, i) => currentSection.totalFloors - i).map(floorNum => {
            const isSelected = kioskFloorId === floorNum;
            const flatsOnFloor = allSectionFlats.filter(f => f.floor === floorNum);

            return (
              <div
                key={floorNum}
                onClick={() => setKioskFloorId(floorNum)}
                onMouseEnter={() => setHoveredFloor(floorNum)}
                onMouseLeave={() => setHoveredFloor(null)}
                className={`kiosk-floor-slice ${isSelected ? 'is-active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isSelected ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#ffffff'
                  }}>
                    {floorNum}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>
                      {floorNum} этаж
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {flatsOnFloor.length} планировок
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff8e52' }}>
                    от {((flatsOnFloor[0]?.price || 12000000) / 1000000).toFixed(1)}M ₽
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Floor Apartment Board & Filter */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto'
        }}>
          {/* Header of floor board */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Квартиры на {kioskFloorId} этаже (Секция {kioskBuildingId})
              </h3>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                Нажмите на квартиру для открытия карточки с инсоляцией и 3D-туром
              </div>
            </div>

            {/* Room filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'Все' },
                { id: 'studio', label: 'Студии' },
                { id: '1k', label: '1-комн.' },
                { id: '2k', label: '2-комн.' },
                { id: '3k', label: '3-комн.' }
              ].map(rf => (
                <button
                  key={rf.id}
                  onClick={() => setSelectedRoomFilter(rf.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedRoomFilter === rf.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                    background: selectedRoomFilter === rf.id ? 'rgba(227, 82, 4, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedRoomFilter === rf.id ? '#ff8e52' : '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {floorFlats.map(flat => {
              const fav = isFavorite(flat.id);
              return (
                <div
                  key={flat.id}
                  className="kiosk-flat-card"
                  onClick={() => openKioskFlatDetail(flat.id)}
                >
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="kiosk-code-badge">
                      №{flat.number}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(flat.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: fav ? '#e35204' : 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Star size={18} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Plan thumbnail */}
                  <div className="kiosk-flat-card__plan">
                    <img src={flat.planUrl} alt={flat.roomTypeName} />
                  </div>

                  {/* Title & Specs */}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
                      {flat.roomTypeName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                      {flat.area} м² • Потолки {flat.ceilingHeight}м
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                      {flat.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div style={{ fontSize: '11px', color: '#ff8e52' }}>
                      {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                    </div>
                  </div>

                  {/* Action Buttons: Забронировать & О квартире */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookingModal(flat);
                      }}
                      className="kiosk-btn kiosk-btn--green"
                      style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '8px' }}
                    >
                      <ShieldCheck size={14} />
                      <span>Бронь</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openKioskFlatDetail(flat.id);
                      }}
                      className="kiosk-btn"
                      style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}
                    >
                      О квартире
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {floorFlats.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px'
            }}>
              По выбранным фильтрам на данном этаже нет квартир.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
