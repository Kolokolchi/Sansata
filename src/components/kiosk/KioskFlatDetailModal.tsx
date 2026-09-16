import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apartments } from '../../data/apartmentsData';
import { 
  X, 
  Star, 
  Box, 
  Sun, 
  Compass, 
  Layers, 
  Check, 
  Maximize2, 
  ShieldCheck, 
  Sparkles,
  Calculator,
  Download,
  Share2
} from 'lucide-react';

export const KioskFlatDetailModal: React.FC = () => {
  const { 
    kioskSelectedFlatId, 
    closeKioskFlatDetail, 
    toggleFavorite, 
    isFavorite, 
    openBookingModal, 
    openPlanoplanModal,
    openLightbox,
    openMortgageModal,
    insolationHour,
    setInsolationHour
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'plan' | 'insolation' | 'floor'>('plan');

  if (!kioskSelectedFlatId) return null;

  const flat = apartments.find(f => f.id === kioskSelectedFlatId);
  if (!flat) return null;

  const fav = isFavorite(flat.id);

  // Calculate sun angle based on hour (8h to 20h)
  // 8h: morning sun (angle 45deg, yellow-orange)
  // 13h: zenith (angle 90deg, bright white-yellow)
  // 20h: evening sunset (angle 165deg, rich warm orange-red)
  const sunPercent = ((insolationHour - 8) / 12) * 100;
  const sunGlowColor = insolationHour < 11 
    ? 'rgba(255, 180, 50, 0.4)' 
    : insolationHour > 16 
    ? 'rgba(255, 90, 30, 0.45)' 
    : 'rgba(255, 220, 100, 0.35)';

  return (
    <div className="kiosk-modal-backdrop">
      <div 
        className="kiosk-glass-heavy"
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(12, 14, 18, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="kiosk-code-badge">
              B4 • О КВАРТИРЕ
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              {flat.roomTypeName} №{flat.number}
            </h2>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
              (Секция {flat.section}, {flat.floor} этаж)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Star Favorite Button */}
            <button
              onClick={() => toggleFavorite(flat.id)}
              className="kiosk-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '30px',
                fontSize: '13px',
                background: fav ? 'rgba(227, 82, 4, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                borderColor: fav ? '#e35204' : 'rgba(255, 255, 255, 0.15)',
                color: fav ? '#ff8e52' : '#ffffff'
              }}
            >
              <Star size={16} fill={fav ? 'currentColor' : 'none'} />
              <span>{fav ? 'В избранном' : 'В избранное'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={closeKioskFlatDetail}
              className="kiosk-btn kiosk-btn--icon"
              style={{ width: '38px', height: '38px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Canvas & Right Specs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Left Canvas: Plan / Insolation / Floor Layout */}
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(8, 10, 14, 0.6)',
            position: 'relative'
          }}>
            {/* Mode Switcher inside canvas */}
            <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
              <button
                onClick={() => setActiveTab('plan')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === 'plan' ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                2D Планировка
              </button>

              <button
                onClick={() => setActiveTab('insolation')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === 'insolation' ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sun size={14} />
                <span>Инсоляция (Солнце)</span>
              </button>

              <button
                onClick={() => setActiveTab('floor')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === 'floor' ? '#e35204' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={14} />
                <span>На этаже</span>
              </button>
            </div>

            {/* Plan Display Box */}
            <div style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
            }}>
              {/* Compass Widget in Top-Right */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(18, 20, 26, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                <Compass size={18} color="#e35204" />
                <span style={{ fontSize: '8px', fontWeight: 800, marginTop: '1px' }}>СЕВЕР</span>
              </div>

              {/* Sun Light Effect if Insolation Tab is active */}
              {activeTab === 'insolation' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at ${sunPercent}% 20%, ${sunGlowColor} 0%, rgba(255,255,255,0) 70%)`,
                  pointerEvents: 'none',
                  transition: 'background 0.3s ease'
                }} />
              )}

              <img 
                src={flat.planUrl} 
                alt={flat.roomTypeName} 
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  filter: activeTab === 'insolation' ? 'drop-shadow(0 0 10px rgba(255, 180, 50, 0.4))' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
            </div>

            {/* Insolation Hour Slider when active */}
            {activeTab === 'insolation' && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Время суток инсоляции:</span>
                  <strong style={{ color: '#ff8e52', fontSize: '15px' }}>{insolationHour}:00 ({insolationHour < 12 ? 'Утро' : insolationHour < 17 ? 'День' : 'Вечер'})</strong>
                </div>
                <input 
                  type="range" 
                  min="8" 
                  max="20" 
                  step="1"
                  value={insolationHour}
                  onChange={(e) => setInsolationHour(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#e35204', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  <span>08:00 (Восход)</span>
                  <span>14:00 (Зенит)</span>
                  <span>20:00 (Закат)</span>
                </div>
              </div>
            )}

            {/* Quick 3D Tour & Plan Zoom Triggers */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => openPlanoplanModal('2ee1019ddb3e8f756ad9aa354403604c_3d')}
                className="kiosk-btn kiosk-btn--primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '13px', borderRadius: '10px' }}
              >
                <Box size={16} />
                <span>Запустить 3D-тур квартиры</span>
              </button>

              <button
                onClick={() => openLightbox(flat.planUrl, `${flat.roomTypeName} №${flat.number}`, `Площадь: ${flat.area} м²`)}
                className="kiosk-btn"
                style={{ padding: '10px 16px', fontSize: '13px', borderRadius: '10px' }}
                title="Полноэкранный просмотр плана"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Right Specs & Price Sheet */}
          <div className="kiosk-scroll" style={{
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto'
          }}>
            {/* Price block */}
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'rgba(227, 82, 4, 0.1)',
              border: '1px solid rgba(227, 82, 4, 0.3)'
            }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.05em' }}>
                Стоимость квартиры
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {flat.price.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '14px', color: '#ff8e52', fontWeight: 700 }}>
                  {flat.pricePerMeter.toLocaleString('ru-RU')} ₽/м²
                </span>
                {flat.basePrice > flat.price && (
                  <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>
                    {flat.basePrice.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
            </div>

            {/* Key Specs Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Общая площадь</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{flat.area} м²</div>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Жилая площадь</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{flat.livingArea} м²</div>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Кухня</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{flat.kitchenArea} м²</div>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Потолки</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{flat.ceilingHeight} м</div>
              </div>
            </div>

            {/* Tags & Features */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Особенности планировки:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {flat.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Mortgage Quick Trigger */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Ипотека от 5.9%</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Платеж от {Math.round((flat.price * 0.8 * 0.0075)).toLocaleString('ru-RU')} ₽/мес
                </div>
              </div>
              <button
                onClick={() => openMortgageModal({ price: flat.price, flatNumber: flat.number })}
                className="kiosk-btn"
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
              >
                <Calculator size={14} />
                <span>Рассчитать</span>
              </button>
            </div>

            {/* Action Buttons: Green "Забронировать" highlighted according to mindmap */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
              <button
                onClick={() => {
                  closeKioskFlatDetail();
                  openBookingModal(flat);
                }}
                className="kiosk-btn kiosk-btn--green"
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: 800,
                  borderRadius: '14px'
                }}
              >
                <ShieldCheck size={20} />
                <span>Забронировать</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
