import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { gallerySlides } from '../data/galleryData';
import { ChevronLeft, ChevronRight, Box, Maximize2 } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const { openPlanoplanModal, openLightbox } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? gallerySlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === gallerySlides.length - 1 ? 0 : prev + 1));
  };

  const current = gallerySlides[currentIndex];

  return (
    <section className="section section--grey" id="gallery">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-tag">Визуализации</span>
            <h2 className="section-title">Галерея проекта</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-circle" 
              onClick={prevSlide}
              aria-label="Предыдущий слайд"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="btn-circle" 
              onClick={nextSlide}
              aria-label="Следующий слайд"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Main Slider Viewport */}
        <div className="gallery-slider">
          <div 
            className="gallery-slider__track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {gallerySlides.map((slide, idx) => (
              <div 
                key={slide.id}
                className="gallery-slide"
                style={{ backgroundImage: `url('${slide.imageUrl}')` }}
              >
                <div className="gallery-slide__overlay">
                  <div>
                    <div 
                      className="gallery-slide__caption"
                      dangerouslySetInnerHTML={{ __html: slide.caption }}
                    />
                    {slide.subtitle && (
                      <div style={{ fontSize: '15px', opacity: 0.8, marginTop: '6px' }}>
                        {slide.subtitle}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {slide.has3dTour && (
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => openPlanoplanModal(slide.planoplanUid)}
                      >
                        <Box size={16} /> 3D-Тур по проекту
                      </button>
                    )}
                    <button
                      className="btn btn--outline-white btn--sm"
                      onClick={() => openLightbox(slide.imageUrl, slide.title, slide.subtitle)}
                      title="Развернуть во весь экран"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom pagination dots & counter */}
        <div className="gallery-controls">
          <div className="gallery-dots">
            {gallerySlides.map((_, idx) => (
              <div
                key={idx}
                className={`gallery-dot ${idx === currentIndex ? 'is-active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-additional-1)' }}>
            {currentIndex + 1} / {gallerySlides.length}
          </div>
        </div>
      </div>
    </section>
  );
};
