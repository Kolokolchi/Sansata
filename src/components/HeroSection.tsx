import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Navigation, Calendar, Sparkles, ArrowRight, Compass, Layers } from 'lucide-react';
import { promoOffers } from '../data/commonData';

const heroImages = [
  '/images/hero_facade.jpg',
  '/images/courtyard.jpg',
  '/images/grand_lobby.jpg'
];

export const HeroSection: React.FC = () => {
  const { navigateTo, openPromoModal } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const specialOffer = promoOffers[0];

  return (
    <section className="hero" id="main">
      {/* Background Slider */}
      <div className="hero__bg-slider">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`hero__slide ${idx === currentSlide ? 'is-active' : ''}`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}
      </div>

      <div className="hero__overlay" />

      {/* Hero Content */}
      <div className="container hero__content">
        <div style={{ maxWidth: '820px' }}>
          <h1 className="hero__title">
            Дом бизнес-класса
          </h1>

          {/* USP Badges */}
          <div className="hero__badges">
            <div className="hero__badge">
              <MapPin size={16} color="var(--color-brand-light)" />
              <span>Адмиралтейский район</span>
            </div>
            <div className="hero__badge">
              <Navigation size={16} color="var(--color-brand-light)" />
              <span>м. Балтийская — 10 минут</span>
            </div>
            <div className="hero__badge">
              <MapPin size={16} color="var(--color-brand-light)" />
              <span>наб. Обводного канала, 118А, лит. С</span>
            </div>
            <div className="hero__badge hero__badge-accent">
              <Calendar size={16} />
              <span>Срок сдачи: IV кв 2028</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row & Special Offer */}
        <div className="hero__bottom-row">
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigateTo('parametric-search')}
            >
              <Layers size={18} /> Выбрать по параметрам
            </button>
            <button
              className="btn btn--outline-white btn--lg"
              onClick={() => navigateTo('visual')}
            >
              <Compass size={18} /> Выбор на 3D-плане
            </button>
          </div>

          {/* Special Offer Floating Banner */}
          {specialOffer && (
            <div 
              className="hero__promo-card"
              onClick={() => openPromoModal(specialOffer)}
              title="Нажмите, чтобы узнать подробнее"
            >
              <div className="hero__promo-icon">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="hero__promo-title">{specialOffer.title}</div>
                <div className="hero__promo-subtitle">{specialOffer.description}</div>
              </div>
              <ArrowRight size={18} color="var(--color-brand-light)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
