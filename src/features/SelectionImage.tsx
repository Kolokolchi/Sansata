import React, { useState, useEffect } from 'react';
import type { SelectionImage as ImageData } from '../types';
import { siteUrl } from '../lib/site';
import { Point, pointInPolygon, calculateCentroid } from '../lib/geometry';

export type { Point };
export { pointInPolygon, calculateCentroid };

export interface SelectionImageProps {
  data: ImageData;
  viewBox?: string;
  selected?: string;
  label: (id: string) => string;
  onSelect: (id: string) => void;
  disabled?: string[];
}

export function SelectionImage({
  data,
  viewBox,
  selected,
  label,
  onSelect,
  disabled = []
}: SelectionImageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // Clear the section hover when leaving keyboard interaction.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoveredId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<SVGPolygonElement>, regionId: string) => {
    if (isMobile) return;
    setHoveredId(regionId);
  };

  const handlePointerLeave = () => {
    if (isMobile) return;
    setHoveredId(null);
  };

  return (
    <div className="selection-image-container">
      <svg
        className="selection-image"
        viewBox={viewBox || `0 0 ${data.width} ${data.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Интерактивный чертёж"
      >
        <image
          href={siteUrl(data.image)}
          x="0"
          y="0"
          width={data.width}
          height={data.height}
          preserveAspectRatio="none"
          style={{ pointerEvents: 'none' }}
        />
        {data.regions.map((region) => {
          const isDisabled = disabled.includes(region.id);
          const isSelected = selected === region.id;
          const isHovered = hoveredId === region.id;
          const isDimmed = hoveredId !== null && !isHovered;
          const centroid = calculateCentroid(region.points);
          const shortLabel = region.id;

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
                  if (!isDisabled) onSelect(region.id);
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

    </div>
  );
}
