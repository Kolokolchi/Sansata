import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apartments } from '../../data/apartmentsData';
import { RoomType } from '../../types';
import { 
  Search, 
  RotateCcw, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

export const KioskSearchModal: React.FC = () => {
  const { 
    setKioskSection, 
    openKioskFlatDetail, 
    openBookingModal, 
    toggleFavorite, 
    isFavorite 
  } = useAppStore();

  const [selectedRooms, setSelectedRooms] = useState<RoomType[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(35000000);
  const [minArea, setMinArea] = useState<number>(25);
  const [maxArea, setMaxArea] = useState<number>(95);
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = ['Кухня-гостиная', 'Вид во двор', 'Закрытый балкон', 'Мастер-спальня', '2 санузла', 'Панорамные окна'];

  const filtered = apartments.filter(flat => {
    if (selectedRooms.length > 0 && !selectedRooms.includes(flat.roomType)) return false;
    if (flat.price > maxPrice) return false;
    if (flat.area < minArea || flat.area > maxArea) return false;
    if (selectedSection !== 'all' && flat.section !== selectedSection) return false;
    if (selectedTag !== 'all' && !flat.tags.includes(selectedTag)) return false;
    return true;
  });

  const toggleRoom = (r: RoomType) => {
    setSelectedRooms(prev => 
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const handleReset = () => {
    setSelectedRooms([]);
    setMaxPrice(45000000);
    setMinArea(21);
    setMaxArea(95);
    setSelectedSection('all');
    setSelectedTag('all');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '16px'
    }}>
      {/* Top Filter Bar */}
      <div className="kiosk-glass" style={{
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Room pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
            Комнатность:
          </span>
          {[
            { id: 'studio' as RoomType, label: 'Студия' },
            { id: '1k' as RoomType, label: '1к' },
            { id: '2k' as RoomType, label: '2к' },
            { id: '3k' as RoomType, label: '3к' },
            { id: '4k' as RoomType, label: '4к' }
          ].map(r => {
            const active = selectedRooms.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleRoom(r.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: active ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                  background: active ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Price Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            До <strong style={{ color: '#ff8e52' }}>{(maxPrice / 1000000).toFixed(1)} млн ₽</strong>
          </div>
          <input 
            type="range" 
            min="11000000" 
            max="45000000" 
            step="500000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: '#e35204', cursor: 'pointer' }}
          />
        </div>

        {/* Section Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
            Секция:
          </span>
          {['all', 1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSection(s as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedSection === s ? '#e35204' : 'rgba(255,255,255,0.08)',
                background: selectedSection === s ? 'rgba(227, 82, 4, 0.25)' : 'transparent',
                color: selectedSection === s ? '#ff8e52' : '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {s === 'all' ? 'Все' : s}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="kiosk-btn"
          style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '10px' }}
        >
          <RotateCcw size={14} />
          <span>Сбросить</span>
        </button>
      </div>

      {/* Results Header & Grid */}
      <div className="kiosk-glass kiosk-scroll" style={{
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="kiosk-code-badge">
              B3 • РЕЗУЛЬТАТЫ ПОИСКА
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              Найдено {filtered.length} квартир
            </span>
          </div>

          {/* Quick tag filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedTag === tag ? '#e35204' : 'rgba(255,255,255,0.08)',
                  background: selectedTag === tag ? '#e35204' : 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Flats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map(flat => {
            const fav = isFavorite(flat.id);
            return (
              <div
                key={flat.id}
                className="kiosk-flat-card"
                onClick={() => openKioskFlatDetail(flat.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="kiosk-code-badge">
                    Секция {flat.section} • {flat.floor} этаж
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

                <div className="kiosk-flat-card__plan">
                  <img src={flat.planUrl} alt={flat.roomTypeName} />
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
                    {flat.roomTypeName} №{flat.number}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                    {flat.area} м² • {flat.tags[0]}
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                    {flat.price.toLocaleString('ru-RU')} ₽
                  </div>
                  <div style={{ fontSize: '11px', color: '#ff8e52' }}>
                    {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                  </div>
                </div>

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
      </div>
    </div>
  );
};
