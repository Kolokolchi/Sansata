import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { apartments } from '../data/apartmentsData';
import { Star, Trash2, Download, Send, ArrowRight, Layers, Check } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { 
    favorites, 
    toggleFavorite, 
    openBookingModal, 
    openCallbackModal,
    openLightbox,
    navigateTo 
  } = useAppStore();

  const favoriteFlats = apartments.filter(f => favorites.includes(f.id));

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
          marginBottom: '32px'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginBottom: '8px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')}>Главная</span> / Избранное
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Избранные квартиры</h1>
            <div style={{ fontSize: '15px', color: 'var(--color-additional-1)', marginTop: '4px' }}>
              В вашем списке: <strong>{favoriteFlats.length}</strong> {favoriteFlats.length === 1 ? 'квартира' : 'квартир'}
            </div>
          </div>

          {favoriteFlats.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn--primary"
                onClick={openCallbackModal}
              >
                <Send size={16} /> Отправить подборку менеджеру
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => navigateTo('parametric-search')}
              >
                <Layers size={16} /> Добавить ещё квартиры
              </button>
            </div>
          )}
        </div>

        {favoriteFlats.length === 0 ? (
          /* Empty state */
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '80px 20px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(227, 82, 4, 0.1)',
              color: 'var(--color-brand-base)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Star size={32} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
              У вас пока нет сохранённых квартир
            </h3>
            <p style={{ color: 'var(--color-additional-1)', maxWidth: '460px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Нажимайте на звёздочку рядом с любой квартирой в каталоге, чтобы добавить её в список сравнения.
            </p>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigateTo('parametric-search')}
            >
              Перейти к выбору квартир <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Populated State */
          <div>
            {/* Cards Grid */}
            <div className="flats-grid" style={{ marginBottom: '48px' }}>
              {favoriteFlats.map(flat => (
                <div key={flat.id} className="flat-card">
                  <button
                    className="flat-card__favorite is-favorite"
                    onClick={() => toggleFavorite(flat.id)}
                    title="Удалить из избранного"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div 
                    className="flat-card__plan-wrap"
                    onClick={() => openLightbox(flat.planUrl, `${flat.roomTypeName} №${flat.number}`)}
                  >
                    <img src={flat.planUrl} alt={flat.roomTypeName} className="flat-card__plan-img" />
                  </div>

                  <h3 className="flat-card__title">{flat.roomTypeName} №{flat.number}</h3>

                  <div className="flat-card__specs">
                    <div className="flat-card__spec-item">
                      <div>Площадь</div>
                      <div className="flat-card__spec-value">{flat.area} м²</div>
                    </div>
                    <div className="flat-card__spec-item">
                      <div>Этаж / Секция</div>
                      <div className="flat-card__spec-value">{flat.floor} / {flat.totalFloors} (Секц. {flat.section})</div>
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
              ))}
            </div>

            {/* Comparison Table */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Сравнительная таблица</h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--color-additional-1)' }}>Параметр</th>
                      {favoriteFlats.map(f => (
                        <th key={f.id} style={{ padding: '12px 16px', fontWeight: 800 }}>
                          {f.roomTypeName} №{f.number}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Общая площадь</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.area} м²</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Жилая площадь</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.livingArea} м²</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Кухня</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.kitchenArea} м²</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Этаж</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.floor} из {f.totalFloors}</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Секция</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.section}</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Окна</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.windowViewName}</td>)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Санузлы</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.bathroomsCount}</td>)}
                    </tr>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Стоимость за м²</td>
                      {favoriteFlats.map(f => <td key={f.id} style={{ padding: '14px 16px' }}>{f.pricePerMeter.toLocaleString('ru-RU')} ₽</td>)}
                    </tr>
                    <tr>
                      <td style={{ padding: '16px', fontWeight: 800, fontSize: '16px' }}>Итоговая стоимость</td>
                      {favoriteFlats.map(f => (
                        <td key={f.id} style={{ padding: '16px', fontWeight: 800, fontSize: '18px', color: 'var(--color-brand-base)' }}>
                          {f.price.toLocaleString('ru-RU')} ₽
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
