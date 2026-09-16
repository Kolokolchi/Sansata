import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apartments } from '../data/apartmentsData';
import { RoomType, Apartment } from '../types';
import { Star, ChevronRight, Maximize2, ArrowRight } from 'lucide-react';

export const FlatsShowcaseSection: React.FC = () => {
  const { 
    navigateTo, 
    toggleFavorite, 
    isFavorite, 
    openLightbox,
    openBookingModal,
    setFilters
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<RoomType | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  const tabs = [
    { id: 'all', label: 'Все квартиры' },
    { id: 'studio', label: 'Студии' },
    { id: '1k', label: '1-комнатные' },
    { id: '2k', label: '2-комнатные' },
    { id: '3k', label: '3-комнатные' }
  ];

  // Filter flats for showcase
  const filteredFlats = apartments.filter(f => {
    if (activeTab === 'all') return true;
    return f.roomType === activeTab;
  });

  const visibleFlats = showAll ? filteredFlats.slice(0, 12) : filteredFlats.slice(0, 6);

  const handleGoToCatalog = (roomType?: RoomType) => {
    if (roomType) {
      setFilters({ roomTypes: [roomType] });
    }
    navigateTo('parametric-search');
  };

  return (
    <section className="section" id="flats">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-tag">Планировочные решения</span>
            <h2 className="section-title">Квартиры в STAVNI Обводный</h2>
            <p className="section-subtitle">
              Функциональные евро-планировки с высокими потолками 3 метра, мастер-спальнями и теплыми лоджиями.
            </p>
          </div>

          <button
            className="btn btn--secondary"
            onClick={() => handleGoToCatalog()}
          >
            Все 382 квартиры в каталоге <ArrowRight size={16} />
          </button>
        </div>

        {/* Room Tabs */}
        <div className="flats-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flats-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setShowAll(false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Flats Grid */}
        <div className="flats-grid">
          {visibleFlats.map(flat => {
            const fav = isFavorite(flat.id);

            return (
              <div key={flat.id} className="flat-card">
                {/* Favorite Star */}
                <button
                  className={`flat-card__favorite ${fav ? 'is-favorite' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(flat.id);
                  }}
                  title={fav ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  <Star size={18} fill={fav ? 'currentColor' : 'none'} />
                </button>

                {/* Plan Preview */}
                <div 
                  className="flat-card__plan-wrap"
                  onClick={() => openLightbox(flat.planUrl, `${flat.roomTypeName} №${flat.number}`, `Площадь: ${flat.area} м², Секция ${flat.section}, Этаж ${flat.floor}`)}
                  title="Нажмите для увеличения планировки"
                >
                  <img 
                    src={flat.planUrl} 
                    alt={`Планировка ${flat.roomTypeName}`} 
                    className="flat-card__plan-img"
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--color-additional-1)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Maximize2 size={12} /> Увеличить
                  </div>
                </div>

                {/* Tags */}
                <div className="flat-card__tags">
                  {flat.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="flat-card__tag">{tag}</span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="flat-card__title">
                  {flat.roomTypeName} №{flat.number}
                </h3>

                {/* Specs */}
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

                {/* Price Row */}
                <div className="flat-card__price-row">
                  <div>
                    <div className="flat-card__price">
                      {flat.price.toLocaleString('ru-RU')} ₽
                    </div>
                    {flat.discountPercent && (
                      <div className="flat-card__price-old">
                        {flat.basePrice.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </div>
                  <div className="flat-card__price-sqm">
                    {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => openBookingModal(flat)}
                  >
                    Забронировать
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleGoToCatalog(flat.roomType)}
                    title={`Смотреть все ${flat.roomTypeName.toLowerCase()} квартиры`}
                  >
                    Все {flat.roomType} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle show all / collapse */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            className="btn btn--secondary btn--lg"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Скрыть часть планировок' : 'Показать больше планировок'}
          </button>
        </div>
      </div>
    </section>
  );
};
