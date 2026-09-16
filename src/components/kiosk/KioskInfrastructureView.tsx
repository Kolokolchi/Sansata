import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { infrastructureItems, infrastructureCategories } from '../../data/infrastructureData';
import { InfrastructureItem } from '../../types';
import { 
  MapPin, 
  Navigation, 
  ArrowLeft, 
  Utensils, 
  ShoppingBag, 
  Trees, 
  GraduationCap, 
  Dumbbell, 
  Camera, 
  Clock, 
  Car, 
  Footprints 
} from 'lucide-react';

export const KioskInfrastructureView: React.FC = () => {
  const { setKioskSection } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InfrastructureItem>(infrastructureItems[0]);
  const [activeRadius, setActiveRadius] = useState<number | 'all'>('all');

  const filteredItems = infrastructureItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (activeRadius !== 'all' && item.walkTimeMinutes && item.walkTimeMinutes > activeRadius) return false;
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'metro': return <Navigation size={15} color="#38bdf8" />;
      case 'restaurants': return <Utensils size={15} color="#fb923c" />;
      case 'shops': return <ShoppingBag size={15} color="#facc15" />;
      case 'parks': return <Trees size={15} color="#4ade80" />;
      case 'schools': return <GraduationCap size={15} color="#c084fc" />;
      case 'sport': return <Dumbbell size={15} color="#f472b6" />;
      case 'sightseeing': return <Camera size={15} color="#a78bfa" />;
      default: return <MapPin size={15} color="#ff8e52" />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '16px'
    }}>
      {/* Top Bar with Category Filter & Radiuses */}
      <div className="kiosk-glass" style={{
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Back button */}
        <button
          onClick={() => setKioskSection('genplan')}
          className="kiosk-btn"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} />
          <span>Генплан</span>
        </button>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedCategory === 'all' ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
              background: selectedCategory === 'all' ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Все ({infrastructureItems.length})
          </button>

          {infrastructureCategories.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: active ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                  background: active ? 'rgba(227, 82, 4, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: active ? '#ff8e52' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Walking Radius Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Footprints size={15} color="#ff8e52" />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Пешком:</span>
          {[5, 10, 15].map(min => (
            <button
              key={min}
              onClick={() => setActiveRadius(activeRadius === min ? 'all' : min)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeRadius === min ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: activeRadius === min ? '#e35204' : 'transparent',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              до {min} мин
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Map Visual & Right POI List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Map Box with STAVNI Center Pin */}
        <div className="kiosk-glass" style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          <img 
            src="/images/vokzal_1853.jpg" 
            alt="Район Обводного канала"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,12,16,0.9) 0%, rgba(10,12,16,0.3) 50%, rgba(10,12,16,0.7) 100%)',
            pointerEvents: 'none'
          }} />

          {/* STAVNI Complex Pin */}
          <div style={{
            position: 'absolute',
            left: '48%',
            top: '46%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20
          }}>
            <div className="kiosk-pin-ring" style={{ borderColor: '#e35204' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, #e35204 0%, #ff6b2b 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '14px',
              boxShadow: '0 8px 30px rgba(227, 82, 4, 0.6)'
            }}>
              <MapPin size={18} />
              <span>ЖК STAVNI</span>
            </div>
          </div>

          {/* Overlay Detail of Selected POI */}
          {selectedItem && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(12, 14, 20, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(227, 82, 4, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getCategoryIcon(selectedItem.category)}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#ff8e52', fontWeight: 800, textTransform: 'uppercase' }}>
                    {selectedItem.categoryName}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    {selectedItem.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {selectedItem.address}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
                {selectedItem.walkTimeMinutes && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Пешком</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
                      {selectedItem.walkTimeMinutes} мин
                    </div>
                  </div>
                )}
                {selectedItem.driveTimeMinutes && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>На авто</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#60a5fa' }}>
                      {selectedItem.driveTimeMinutes} мин
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Scrollable POI Cards */}
        <div className="kiosk-glass kiosk-scroll" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="kiosk-code-badge">
              B6 • ИНФРАСТРУКТУРА
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              {filteredItems.length} локаций рядом
            </span>
          </div>

          {filteredItems.map(item => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: isSelected ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(227, 82, 4, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {item.categoryName}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {item.walkTimeMinutes ? (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>
                      {item.walkTimeMinutes} мин
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>
                      {item.driveTimeMinutes} мин
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {item.walkTimeMinutes ? 'пешком' : 'на авто'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
