import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apartments } from '../data/apartmentsData';
import { Compass, Box, Layers, ArrowRight, Star, Maximize2 } from 'lucide-react';

export const VisualSearchPage: React.FC = () => {
  const { navigateTo, openPlanoplanModal, openLightbox, openBookingModal, toggleFavorite, isFavorite } = useAppStore();
  
  const [activeSection, setActiveSection] = useState<number | null>(1);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [viewAngle, setViewAngle] = useState<'facade' | 'courtyard'>('facade');

  // Section stats & polygons
  const sectionsData = [
    { section: 1, floors: 9, minPrice: 11200000, freeFlats: 64, polygon: '80,280 250,260 250,75 80,95' },
    { section: 2, floors: 11, minPrice: 12500000, freeFlats: 88, polygon: '255,260 450,235 450,45 255,75' },
    { section: 3, floors: 11, minPrice: 13100000, freeFlats: 92, polygon: '455,235 635,235 635,45 455,45' },
    { section: 4, floors: 9, minPrice: 11800000, freeFlats: 68, polygon: '640,235 820,260 820,75 640,45' },
    { section: 5, floors: 8, minPrice: 11900000, freeFlats: 56, polygon: '825,260 985,280 985,105 825,75' },
  ];

  const sectionFlats = apartments.filter(f => activeSection === null || f.section === activeSection);

  const activeSecData = sectionsData.find(s => s.section === (hoveredSection || activeSection));

  const bgImage = viewAngle === 'facade' 
    ? '/images/facade_3d.jpg'
    : '/images/courtyard.jpg';

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 20px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--color-additional-bg)' }}>
      <div className="container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginBottom: '8px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')}>Главная</span> / 3D-выбор
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Выбор квартиры на 3D-плане</h1>
            <div style={{ fontSize: '15px', color: 'var(--color-additional-1)', marginTop: '4px' }}>
              Наведите курсор на фасад здания, чтобы выбрать секцию и увидеть планировки.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn--primary"
              onClick={() => openPlanoplanModal('2ee1019ddb3e8f756ad9aa354403604c_3d')}
            >
              <Box size={16} /> Полноэкранный 3D-тур
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => navigateTo('parametric-search')}
            >
              <Layers size={16} /> Поиск по параметрам
            </button>
          </div>
        </div>

        {/* 3D Visual Interactive Canvas Box */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '40px',
          position: 'relative'
        }}>
          {/* Top View Switcher */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 20,
            display: 'flex',
            gap: '8px',
            background: 'rgba(27, 20, 22, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            borderRadius: 'var(--radius-full)'
          }}>
            <button
              onClick={() => setViewAngle('facade')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                background: viewAngle === 'facade' ? 'var(--color-brand-base)' : 'transparent',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Вид с набережной
            </button>
            <button
              onClick={() => setViewAngle('courtyard')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                background: viewAngle === 'courtyard' ? 'var(--color-brand-base)' : 'transparent',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Вид со двора
            </button>
          </div>

          {/* Hover Section Info Card in top right */}
          {activeSecData && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 20,
              background: 'rgba(27, 20, 22, 0.85)',
              backdropFilter: 'blur(14px)',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              minWidth: '220px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-brand-light)', fontWeight: 800 }}>
                Секция {activeSecData.section}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                {activeSecData.floors} этажей
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                Свободно: <strong>{activeSecData.freeFlats}</strong> квартир
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-brand-light)', marginTop: '6px' }}>
                от {(activeSecData.minPrice / 1000000).toFixed(1)} млн ₽
              </div>
            </div>
          )}

          {/* Interactive SVG Facade Map */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
            <img 
              src={bgImage} 
              alt="Фасад ЖК STAVNI"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <svg
              viewBox="0 0 1060 360"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 10
              }}
            >
              {sectionsData.map(sec => {
                const isSelected = activeSection === sec.section;
                const isHovered = hoveredSection === sec.section;
                return (
                  <g key={sec.section}>
                    <polygon
                      points={sec.polygon}
                      fill={isSelected ? 'rgba(227, 82, 4, 0.45)' : isHovered ? 'rgba(227, 82, 4, 0.3)' : 'rgba(0, 0, 0, 0.15)'}
                      stroke={isSelected || isHovered ? 'var(--color-brand-base)' : 'rgba(255, 255, 255, 0.6)'}
                      strokeWidth={isSelected || isHovered ? '3' : '1.5'}
                      style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                      onMouseEnter={() => setHoveredSection(sec.section)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setActiveSection(sec.section)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Section Quick Buttons */}
          <div style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-additional-1)' }}>
                Выберите секцию:
              </span>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: activeSection === s ? 'var(--color-brand-base)' : 'var(--color-additional-bg)',
                    color: activeSection === s ? '#ffffff' : 'var(--color-brand-text)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Секция {s}
                </button>
              ))}
              <button
                onClick={() => setActiveSection(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: activeSection === null ? 'var(--color-brand-base)' : 'var(--color-additional-bg)',
                  color: activeSection === null ? '#ffffff' : 'var(--color-brand-text)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Все секции
              </button>
            </div>
          </div>
        </div>

        {/* Available Flats in Selected Section */}
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>
            {activeSection ? `Квартиры в секции ${activeSection}` : 'Все доступные квартиры'} ({sectionFlats.length})
          </h2>
        </div>

        <div className="flats-grid">
          {sectionFlats.slice(0, 8).map(flat => {
            const fav = isFavorite(flat.id);
            return (
              <div key={flat.id} className="flat-card">
                <button
                  className={`flat-card__favorite ${fav ? 'is-favorite' : ''}`}
                  onClick={() => toggleFavorite(flat.id)}
                >
                  <Star size={18} fill={fav ? 'currentColor' : 'none'} />
                </button>

                <div 
                  className="flat-card__plan-wrap"
                  onClick={() => openLightbox(flat.planUrl, `${flat.roomTypeName} №${flat.number}`, `Площадь: ${flat.area} м², Секция ${flat.section}, Этаж ${flat.floor}`)}
                >
                  <img src={flat.planUrl} alt={flat.roomTypeName} className="flat-card__plan-img" />
                </div>

                <div className="flat-card__tags">
                  {flat.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="flat-card__tag">{tag}</span>
                  ))}
                </div>

                <h3 className="flat-card__title">
                  {flat.roomTypeName} №{flat.number}
                </h3>

                <div className="flat-card__specs">
                  <div className="flat-card__spec-item">
                    <div>Площадь</div>
                    <div className="flat-card__spec-value">{flat.area} м²</div>
                  </div>
                  <div className="flat-card__spec-item">
                    <div>Этаж / Секция</div>
                    <div className="flat-card__spec-value">{flat.floor} из {flat.totalFloors} (Секц. {flat.section})</div>
                  </div>
                </div>

                <div className="flat-card__price-row">
                  <div>
                    <div className="flat-card__price">
                      {flat.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div className="flat-card__price-sqm">
                    {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                  </div>
                </div>

                <button
                  className="btn btn--primary btn--sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => openBookingModal(flat)}
                >
                  Забронировать
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
