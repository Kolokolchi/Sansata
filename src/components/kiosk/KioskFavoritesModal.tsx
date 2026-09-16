import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apartments } from '../../data/apartmentsData';
import { 
  Star, 
  Trash2, 
  Download, 
  QrCode, 
  ShieldCheck, 
  ArrowLeft, 
  ChevronRight,
  Share2
} from 'lucide-react';

export const KioskFavoritesModal: React.FC = () => {
  const { 
    favorites, 
    toggleFavorite, 
    openKioskFlatDetail, 
    openBookingModal, 
    showSuccessModal,
    setKioskSection 
  } = useAppStore();

  const favoriteFlats = apartments.filter(f => favorites.includes(f.id));

  const handleExportPdf = () => {
    showSuccessModal(
      'Буклет с избранными квартирами сформирован',
      'PDF-презентация с планировками, техническими параметрами и контактами офиса продаж подготовлена. Вы можете отсканировать QR-код на экране или распечатать буклет.'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="kiosk-code-badge">
            B5 • ИЗБРАННОЕ
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Сохраненные квартиры ({favoriteFlats.length})
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {favoriteFlats.length > 0 && (
            <button
              onClick={handleExportPdf}
              className="kiosk-btn kiosk-btn--primary"
              style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}
            >
              <Download size={15} />
              <span>Сформировать PDF-буклет</span>
            </button>
          )}

          <button
            onClick={() => setKioskSection('genplan')}
            className="kiosk-btn"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
          >
            <ArrowLeft size={15} />
            <span>Вернуться к генплану</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="kiosk-glass kiosk-scroll" style={{
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto'
      }}>
        {favoriteFlats.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {favoriteFlats.map(flat => (
              <div
                key={flat.id}
                className="kiosk-flat-card"
                onClick={() => openKioskFlatDetail(flat.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="kiosk-code-badge">
                    Секция {flat.section} • {flat.floor} эт.
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(flat.id);
                    }}
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      padding: '6px'
                    }}
                    title="Удалить из избранного"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="kiosk-flat-card__plan">
                  <img src={flat.planUrl} alt={flat.roomTypeName} />
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>
                    {flat.roomTypeName} №{flat.number}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                    Площадь: {flat.area} м² • Потолки {flat.ceilingHeight}м
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
                    {flat.price.toLocaleString('ru-RU')} ₽
                  </div>
                  <div style={{ fontSize: '12px', color: '#ff8e52' }}>
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
                    style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px' }}
                  >
                    <ShieldCheck size={16} />
                    <span>Забронировать</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openKioskFlatDetail(flat.id);
                    }}
                    className="kiosk-btn"
                    style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
                  >
                    О квартире
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '16px',
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.3)'
            }}>
              <Star size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                В избранном пока нет квартир
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '6px', maxWidth: '420px' }}>
                Нажимайте на значок звездочки при просмотре 3D-генплана или в поиске, чтобы добавить планировки в сравнение.
              </p>
            </div>

            <button
              onClick={() => setKioskSection('search')}
              className="kiosk-btn kiosk-btn--primary"
              style={{ padding: '12px 24px', borderRadius: '12px', marginTop: '8px' }}
            >
              <span>Перейти в подбор квартир</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
