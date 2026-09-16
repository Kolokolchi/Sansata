import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apartments } from '../data/apartmentsData';
import { RoomType, Apartment } from '../types';
import { 
  Star, 
  Grid, 
  List, 
  RotateCcw, 
  Maximize2, 
  ArrowUpDown, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  Compass
} from 'lucide-react';

export const ParametricSearchPage: React.FC = () => {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    toggleFavorite, 
    isFavorite, 
    openLightbox,
    openBookingModal,
    navigateTo 
  } = useAppStore();

  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const roomOptions: { type: RoomType; label: string }[] = [
    { type: 'studio', label: 'Студия' },
    { type: '1k', label: '1к' },
    { type: '2k', label: '2к' },
    { type: '3k', label: '3к' }
  ];

  const toggleRoomType = (type: RoomType) => {
    setFilters(prev => {
      const exists = prev.roomTypes.includes(type);
      return {
        ...prev,
        roomTypes: exists 
          ? prev.roomTypes.filter(t => t !== type)
          : [...prev.roomTypes, type]
      };
    });
    setPage(1);
  };

  const toggleSection = (sec: number) => {
    setFilters(prev => {
      const exists = prev.sections.includes(sec);
      return {
        ...prev,
        sections: exists 
          ? prev.sections.filter(s => s !== sec)
          : [...prev.sections, sec]
      };
    });
    setPage(1);
  };

  const toggleFeature = (feat: string) => {
    setFilters(prev => {
      const exists = prev.features.includes(feat);
      return {
        ...prev,
        features: exists 
          ? prev.features.filter(f => f !== feat)
          : [...prev.features, feat]
      };
    });
    setPage(1);
  };

  // Filter & Sort Logic
  const filteredFlats = useMemo(() => {
    return apartments.filter(flat => {
      // Room type
      if (filters.roomTypes.length > 0 && !filters.roomTypes.includes(flat.roomType)) {
        return false;
      }
      // Price
      if (flat.price < filters.minPrice || flat.price > filters.maxPrice) {
        return false;
      }
      // Area
      if (flat.area < filters.minArea || flat.area > filters.maxArea) {
        return false;
      }
      // Floor
      if (flat.floor < filters.minFloor || flat.floor > filters.maxFloor) {
        return false;
      }
      // Section
      if (filters.sections.length > 0 && !filters.sections.includes(flat.section)) {
        return false;
      }
      // Features
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(f => 
          flat.tags.some(t => t.toLowerCase().includes(f.toLowerCase()))
        );
        if (!hasAllFeatures) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortField === 'price') {
        return filters.sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      }
      if (filters.sortField === 'area') {
        return filters.sortOrder === 'asc' ? a.area - b.area : b.area - a.area;
      }
      if (filters.sortField === 'floor') {
        return filters.sortOrder === 'asc' ? a.floor - b.floor : b.floor - a.floor;
      }
      return 0;
    });
  }, [filters]);

  const totalPages = Math.ceil(filteredFlats.length / itemsPerPage);
  const paginatedFlats = filteredFlats.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const featureOptions = [
    'Кухня-гостиная',
    'Мастер-спальня',
    'Вид во двор',
    'Вид на улицу',
    'Санузлов: 2',
    'Лоджия'
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 20px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--color-additional-bg)' }}>
      <div className="container">
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginBottom: '8px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')}>Главная</span> / Поиск квартир
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Выбор квартиры по параметрам</h1>
            <div style={{ fontSize: '15px', color: 'var(--color-additional-1)', marginTop: '4px' }}>
              Найдено: <strong>{filteredFlats.length}</strong> из {apartments.length} квартир
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn--outline-white"
              style={{ background: '#ffffff', color: 'var(--color-brand-text)', border: '1px solid var(--color-border)' }}
              onClick={() => navigateTo('visual')}
            >
              <Compass size={16} color="var(--color-brand-base)" /> Выбор на 3D-плане
            </button>
            <button
              className="btn btn--secondary"
              onClick={resetFilters}
            >
              <RotateCcw size={15} /> Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px'
        }}>
          {/* Row 1: Rooms, Price, Area, Floor */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Rooms */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-additional-1)', display: 'block', marginBottom: '8px' }}>
                Количество комнат
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {roomOptions.map(opt => {
                  const isSel = filters.roomTypes.includes(opt.type);
                  return (
                    <button
                      key={opt.type}
                      onClick={() => toggleRoomType(opt.type)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 'var(--radius-md)',
                        background: isSel ? 'var(--color-brand-base)' : 'var(--color-additional-bg)',
                        color: isSel ? '#ffffff' : 'var(--color-brand-text)',
                        border: '1px solid var(--color-border)',
                        fontWeight: 700,
                        fontSize: '14px',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-additional-1)', marginBottom: '8px' }}>
                <span>Стоимость, ₽</span>
                <span style={{ color: 'var(--color-brand-base)' }}>
                  от {(filters.minPrice / 1000000).toFixed(1)} до {(filters.maxPrice / 1000000).toFixed(1)} млн
                </span>
              </div>
              <input
                type="range"
                min="11000000"
                max="45000000"
                step="500000"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ maxPrice: Number(e.target.value) })}
                className="calc-range"
              />
            </div>

            {/* Area Range */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-additional-1)', marginBottom: '8px' }}>
                <span>Площадь, м²</span>
                <span style={{ color: 'var(--color-brand-base)' }}>
                  от {filters.minArea} до {filters.maxArea} м²
                </span>
              </div>
              <input
                type="range"
                min="21"
                max="93"
                step="1"
                value={filters.maxArea}
                onChange={(e) => setFilters({ maxArea: Number(e.target.value) })}
                className="calc-range"
              />
            </div>

            {/* Floor Range */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-additional-1)', marginBottom: '8px' }}>
                <span>Этаж</span>
                <span style={{ color: 'var(--color-brand-base)' }}>
                  до {filters.maxFloor} этажа
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="11"
                step="1"
                value={filters.maxFloor}
                onChange={(e) => setFilters({ maxFloor: Number(e.target.value) })}
                className="calc-range"
              />
            </div>
          </div>

          {/* Row 2: Sections & Feature Tags */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border)'
          }}>
            {/* Sections */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-additional-1)', marginRight: '4px' }}>Секция:</span>
              {[1, 2, 3, 4, 5].map(sec => {
                const isSel = filters.sections.includes(sec);
                return (
                  <button
                    key={sec}
                    onClick={() => toggleSection(sec)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: isSel ? 'var(--color-brand-base)' : 'var(--color-additional-bg)',
                      color: isSel ? '#ffffff' : 'var(--color-brand-text)',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {featureOptions.map((feat, idx) => {
                const isSel = filters.features.includes(feat);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleFeature(feat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: isSel ? 'rgba(227, 82, 4, 0.15)' : 'var(--color-additional-bg)',
                      border: `1px solid ${isSel ? 'var(--color-brand-base)' : 'transparent'}`,
                      color: isSel ? 'var(--color-brand-base)' : 'var(--color-additional-1)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {isSel ? `✓ ${feat}` : `+ ${feat}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toolbar: Sorting & View Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-additional-1)' }}>Сортировка:</span>
            <select
              value={`${filters.sortField}_${filters.sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_') as [any, any];
                setFilters({ sortField: field, sortOrder: order });
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-brand-text)'
              }}
            >
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="area_asc">По возрастанию площади</option>
              <option value="area_desc">По убыванию площади</option>
              <option value="floor_asc">По этажу (возр.)</option>
            </select>
          </div>

          {/* View Mode Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-circle ${filters.viewMode === 'grid' ? 'btn--primary' : ''}`}
              style={{ width: '38px', height: '38px' }}
              onClick={() => setFilters({ viewMode: 'grid' })}
              title="Плиточный вид"
            >
              <Grid size={18} />
            </button>
            <button
              className={`btn-circle ${filters.viewMode === 'table' ? 'btn--primary' : ''}`}
              style={{ width: '38px', height: '38px' }}
              onClick={() => setFilters({ viewMode: 'table' })}
              title="Табличный вид"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Results Container */}
        {filteredFlats.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '60px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Квартир по вашему запросу не найдено</h3>
            <p style={{ color: 'var(--color-additional-1)', marginBottom: '20px' }}>Попробуйте расширить диапазон цен или снять часть фильтров.</p>
            <button className="btn btn--primary" onClick={resetFilters}>Сбросить все фильтры</button>
          </div>
        ) : filters.viewMode === 'grid' ? (
          /* Grid View */
          <div className="flats-grid">
            {paginatedFlats.map(flat => {
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
                      color: 'var(--color-additional-1)'
                    }}>
                      <Maximize2 size={12} /> Увеличить
                    </div>
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
        ) : (
          /* Table View */
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            overflowX: 'auto',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--color-additional-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '16px' }}>План</th>
                  <th style={{ padding: '16px' }}>Квартира</th>
                  <th style={{ padding: '16px' }}>Площадь</th>
                  <th style={{ padding: '16px' }}>Этаж</th>
                  <th style={{ padding: '16px' }}>Секция</th>
                  <th style={{ padding: '16px' }}>Особенности</th>
                  <th style={{ padding: '16px' }}>Стоимость</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFlats.map(flat => {
                  const fav = isFavorite(flat.id);
                  return (
                    <tr key={flat.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', width: '80px' }}>
                        <img 
                          src={flat.planUrl} 
                          alt="План" 
                          style={{ width: '56px', height: '56px', objectFit: 'contain', cursor: 'pointer' }}
                          onClick={() => openLightbox(flat.planUrl, `${flat.roomTypeName} №${flat.number}`)}
                        />
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700 }}>
                        {flat.roomTypeName} №{flat.number}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        {flat.area} м²
                      </td>
                      <td style={{ padding: '16px' }}>
                        {flat.floor} / {flat.totalFloors}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {flat.section}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {flat.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="flat-card__tag">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-brand-base)', fontSize: '16px' }}>
                          {flat.price.toLocaleString('ru-RU')} ₽
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-additional-1)' }}>
                          {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn-circle"
                            style={{ width: '36px', height: '36px' }}
                            onClick={() => toggleFavorite(flat.id)}
                          >
                            <Star size={16} fill={fav ? 'var(--color-brand-base)' : 'none'} color={fav ? 'var(--color-brand-base)' : 'currentColor'} />
                          </button>
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => openBookingModal(flat)}
                          >
                            Бронь
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: page === p ? 'var(--color-brand-base)' : '#ffffff',
                  color: page === p ? '#ffffff' : 'var(--color-brand-text)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
