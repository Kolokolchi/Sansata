import React, { useState, useRef, useEffect } from 'react';
import { SelectionImage as ImageData, Flat } from '../types';
import { siteUrl } from '../lib/site';
import { areaLabel, money, statusLabel } from '../lib/experience';
import { Point, pointInPolygon, calculateCentroid } from '../lib/geometry';
import { Heart, ArrowRight, X } from 'lucide-react';

export type { Point };
export { pointInPolygon, calculateCentroid };

export interface SelectionImageProps {
  data: ImageData;
  selected?: string;
  label: (id: string) => string;
  onSelect: (id: string) => void;
  disabled?: string[];
  flats?: Flat[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

export function SelectionImage({
  data,
  selected,
  label,
  onSelect,
  disabled = [],
  flats = [],
  favorites = [],
  onToggleFavorite
}: SelectionImageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeMobileFlat, setActiveMobileFlat] = useState<Flat | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFlat = hoveredId ? flats.find((f) => f.id === hoveredId) : null;
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // Закрытие шторки по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMobileFlat(null);
        setHoveredId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<SVGPolygonElement>, regionId: string) => {
    if (isMobile) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTooltipPos({ x, y });
    }
    setHoveredId(regionId);
  };

  const handlePointerLeave = () => {
    if (isMobile) return;
    setHoveredId(null);
    setTooltipPos(null);
  };

  const handlePolygonClick = (regionId: string) => {
    const flat = flats.find((f) => f.id === regionId);
    if (isMobile && flat) {
      // На мобильных устройствах первый тап открывает нижнюю шторку
      setActiveMobileFlat(flat);
      return;
    }
    onSelect(regionId);
  };

  // Расчет безопасных координат тултипа, чтобы он не вылетал за границы контейнера
  const getTooltipStyle = () => {
    if (!tooltipPos || !containerRef.current) return { display: 'none' };
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const tooltipWidth = 260;
    const tooltipHeight = 220;

    let left = tooltipPos.x + 16;
    let top = tooltipPos.y - 40;

    if (left + tooltipWidth > containerWidth - 10) {
      left = Math.max(10, tooltipPos.x - tooltipWidth - 16);
    }
    if (top + tooltipHeight > containerHeight - 10) {
      top = Math.max(10, containerHeight - tooltipHeight - 10);
    }
    if (top < 10) {
      top = 10;
    }

    return {
      left: `${left}px`,
      top: `${top}px`
    };
  };

  return (
    <div className="selection-image-container" ref={containerRef}>
      <svg
        className="selection-image"
        viewBox={`0 0 ${data.width} ${data.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Интерактивный чертёж"
      >
        <image
          href={siteUrl(data.image)}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        />
        {data.regions.map((region) => {
          const isDisabled = disabled.includes(region.id);
          const isSelected = selected === region.id;
          const isHovered = hoveredId === region.id;
          const isDimmed = hoveredId !== null && !isHovered;
          const centroid = calculateCentroid(region.points);
          const shortLabel = region.id.replace(/^shattyq-/, '');

          return (
            <g key={region.id} className="selection-region-group">
              <polygon
                className={`selection-polygon selection-region ${isSelected ? 'selected' : ''} ${isHovered ? 'is-hovered' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
                points={region.points.map((p) => p.join(',')).join(' ')}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-label={label(region.id)}
                aria-disabled={isDisabled}
                aria-pressed={isSelected}
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: isDisabled ? 'none' : 'visiblePainted' }}
                onPointerMove={(e) => {
                  if (!isDisabled) handlePointerMove(e, region.id);
                }}
                onPointerLeave={handlePointerLeave}
                onClick={() => {
                  if (!isDisabled) handlePolygonClick(region.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isDisabled) onSelect(region.id);
                  }
                }}
              >
                <title>{label(region.id)}</title>
              </polygon>
              <g
                className={`selection-tooltip-marker ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isHovered ? 'is-hovered' : ''}`}
                transform={`translate(${centroid.x}, ${centroid.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <circle r="14" className="selection-tooltip-badge" />
                <text textAnchor="middle" dominantBaseline="central" className="selection-tooltip-text">
                  {shortLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Интерактивный плавающий HTML-тултип (Desktop Hover) */}
      {activeFlat && tooltipPos && !isMobile && (
        <div
          className="apartment-floating-tooltip"
          style={getTooltipStyle()}
          role="tooltip"
          aria-hidden={!activeFlat}
        >
          <div className="tooltip-thumb-wrap">
            <img
              src={siteUrl(activeFlat.image)}
              alt={`Планировка ${activeFlat.id}`}
              className="tooltip-thumb"
            />
            {onToggleFavorite && (
              <button
                type="button"
                className={`tooltip-fav-btn ${favorites.includes(activeFlat.id) ? 'active' : ''}`}
                aria-label={favorites.includes(activeFlat.id) ? 'Удалить из избранного' : 'В избранное'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(activeFlat.id);
                }}
              >
                <Heart size={15} fill={favorites.includes(activeFlat.id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <div className="tooltip-body">
            <div className="tooltip-title">
              <strong>{activeFlat.rooms}-комнатная</strong>
              <span>Вариант {activeFlat.id.split('-')[1]}</span>
            </div>
            <div className="tooltip-meta">
              <span className="tooltip-area">{areaLabel(activeFlat)}</span>
              <span className="tooltip-status">{statusLabel[activeFlat.status]}</span>
            </div>
            <div className="tooltip-price">
              {activeFlat.price ? money(activeFlat.price) : 'Цена по запросу'}
            </div>
            <div className="tooltip-cta">
              Кликните для просмотра <ArrowRight size={13} />
            </div>
          </div>
        </div>
      )}

      {/* Мобильная нижняя выдвижная шторка (Touch Bottom Sheet) */}
      {activeMobileFlat && (
        <div className="mobile-sheet-backdrop" onClick={() => setActiveMobileFlat(null)}>
          <div
            className="mobile-apartment-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Квартира ${activeMobileFlat.id}`}
          >
            <button
              type="button"
              className="mobile-sheet-close"
              onClick={() => setActiveMobileFlat(null)}
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
            <div className="mobile-sheet-content">
              <img
                src={siteUrl(activeMobileFlat.image)}
                alt={`Планировка ${activeMobileFlat.id}`}
                className="mobile-sheet-thumb"
              />
              <div className="mobile-sheet-details">
                <span className="mobile-sheet-tag">{statusLabel[activeMobileFlat.status]}</span>
                <h3>
                  {activeMobileFlat.rooms}-комнатная · Вариант {activeMobileFlat.id.split('-')[1]}
                </h3>
                <div className="mobile-sheet-specs">
                  <span>Секция {activeMobileFlat.section}</span>
                  <span>·</span>
                  <span>Этаж {activeMobileFlat.floor}</span>
                  <span>·</span>
                  <strong>{areaLabel(activeMobileFlat)}</strong>
                </div>
                <div className="mobile-sheet-price">
                  {activeMobileFlat.price ? money(activeMobileFlat.price) : 'Цена по запросу'}
                </div>
                <div className="mobile-sheet-actions">
                  <button
                    type="button"
                    className="button blue mobile-sheet-btn"
                    onClick={() => onSelect(activeMobileFlat.id)}
                  >
                    Перейти к квартире <ArrowRight size={16} />
                  </button>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      className={`icon mobile-sheet-fav ${favorites.includes(activeMobileFlat.id) ? 'saved' : ''}`}
                      onClick={() => onToggleFavorite(activeMobileFlat.id)}
                      aria-label="В избранное"
                    >
                      <Heart
                        size={20}
                        fill={favorites.includes(activeMobileFlat.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
