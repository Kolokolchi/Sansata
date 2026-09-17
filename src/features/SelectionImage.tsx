import {SelectionImage as ImageData} from '../types';
import {siteUrl} from '../lib/site';
import {Point, pointInPolygon, calculateCentroid} from '../lib/geometry';

export type {Point};
export {pointInPolygon, calculateCentroid};

export function SelectionImage({
  data,
  selected,
  label,
  onSelect,
  disabled = []
}: {
  data: ImageData;
  selected?: string;
  label: (id: string) => string;
  onSelect: (id: string) => void;
  disabled?: string[];
}) {
  return (
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
      {data.regions.map(region => {
        const isDisabled = disabled.includes(region.id);
        const isSelected = selected === region.id;
        const centroid = calculateCentroid(region.points);
        const shortLabel = region.id.replace(/^shattyq-/, '');

        return (
          <g key={region.id} className="selection-region-group">
            <polygon
              className="selection-polygon"
              points={region.points.map(p => p.join(',')).join(' ')}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={label(region.id)}
              aria-disabled={isDisabled}
              aria-pressed={isSelected}
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: isDisabled ? 'none' : 'visiblePainted' }}
              onClick={() => {
                if (!isDisabled) onSelect(region.id);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isDisabled) onSelect(region.id);
                }
              }}
            >
              <title>{label(region.id)}</title>
            </polygon>
            <g
              className={`selection-tooltip-marker ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
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
  );
}

