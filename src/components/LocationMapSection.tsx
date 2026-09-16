import React, { useState, useEffect, useRef } from 'react';
import { infrastructureItems } from '../data/infrastructureData';
import { InfrastructureItem } from '../types';
import { MapPin, Navigation, Footprints, Car, Layers, Check } from 'lucide-react';

export const LocationMapSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<InfrastructureItem | null>(infrastructureItems[0]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'all', label: 'Вся инфраструктура' },
    { id: 'metro', label: 'Метро' },
    { id: 'restaurants', label: 'Кафе / Рестораны' },
    { id: 'shops', label: 'Магазины и ТЦ' },
    { id: 'parks', label: 'Парки и скверы' },
    { id: 'schools', label: 'Школы и сады' },
    { id: 'sightseeing', label: 'Достопримечательности' }
  ];

  const filteredItems = infrastructureItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <section className="section section--grey" id="location">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Окружение</span>
          <h2 className="section-title">Расположение и инфраструктура</h2>
          <p className="section-subtitle">
            Санкт-Петербург, набережная Обводного канала, 118А. Престижный Адмиралтейский район со сложившейся богатой инфраструктурой.
          </p>
        </div>

        {/* Category Filters */}
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '28px'
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`flats-tab ${selectedCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Map and Info Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Map Viewport */}
          <div style={{ position: 'relative', minHeight: '520px', background: '#e5e3df' }}>
            {/* Embedded Yandex Map iframe */}
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=30.306000%2C59.907500&z=15&pt=30.306000,59.907500,pm2rdm"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ position: 'absolute', inset: 0, border: 0 }}
              title="Карта расположения ЖК STAVNI Обводный"
            />

            {/* STAVNI Complex Pin Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              <div style={{
                background: 'var(--color-brand-base)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: '0 6px 20px rgba(227,82,4,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}>
                <MapPin size={16} fill="white" /> ЖК STAVNI Обводный
              </div>
            </div>
          </div>

          {/* Side POI List / Selected Item Details */}
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '520px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-additional-1)', marginBottom: '16px' }}>
              Объекты рядом ({filteredItems.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredItems.map(item => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(227, 82, 4, 0.08)' : 'var(--color-additional-bg)',
                      border: `1px solid ${isSelected ? 'var(--color-brand-base)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-base)', textTransform: 'uppercase' }}>
                        {item.categoryName}
                      </span>
                      {item.walkTimeMinutes && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--color-additional-1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Footprints size={12} /> {item.walkTimeMinutes} мин
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-text)', marginBottom: '4px' }}>
                      {item.name}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-additional-1)' }}>
                      {item.address}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
