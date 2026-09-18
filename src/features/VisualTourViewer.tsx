import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCw,
  Eye,
  Camera,
  Maximize,
  Maximize2,
  X,
  Compass,
  ArrowRight,
  Home,
  Check,
  Building2
} from 'lucide-react';
import { Flat, ExperienceConfig } from '../lib/experience';
import { siteUrl, navigateTo } from '../lib/site';
import {
  SHATTYQ_VISUAL_ANGLES,
  resolveVisualAngle,
  getSectionPlansSummary,
  VisualAngle
} from '../data/shattyqVisualData';
import { PanoramaViewer } from './PanoramaViewer';
import '../styles/visual-tour.css';

interface VisualTourViewerProps {
  flats: Flat[];
  config?: ExperienceConfig;
  initialRotateId?: string;
  onSectionSelect?: (section: number) => void;
  onConsult?: (topic: string) => void;
}

export function VisualTourViewer({
  flats,
  config,
  initialRotateId,
  onSectionSelect,
  onConsult
}: VisualTourViewerProps) {
  // Read rotateId and view parameters from current URL if present
  const [currentAngle, setCurrentAngle] = useState<VisualAngle>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rotateParam = urlParams.get('rotateId') || initialRotateId;
    return resolveVisualAngle(rotateParam);
  });

  const [activeRoomFilter, setActiveRoomFilter] = useState<number | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'model' | '360'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === '360' || urlParams.get('mode') === '360') {
        return '360';
      }
    }
    return 'model';
  });
  const [is360Open, setIs360Open] = useState<boolean>(false);

  // Keep URL in sync with rotateId without full page reload
  const toggleAngle = () => {
    const nextAngle = currentAngle.id === 'cam5' ? SHATTYQ_VISUAL_ANGLES[1] : SHATTYQ_VISUAL_ANGLES[0];
    setCurrentAngle(nextAngle);
    const url = new URL(window.location.href);
    url.searchParams.set('rotateId', nextAngle.rotateId);
    window.history.replaceState({}, '', url.toString());
  };

  const open360Tour = () => {
    setIs360Open(true);
    const url = new URL(window.location.href);
    url.searchParams.set('view', '360');
    window.history.replaceState({}, '', url.toString());
  };

  const close360Tour = () => {
    setIs360Open(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url.toString());
  };

  const handleSectionClick = (sectionId: number) => {
    setSelectedSection(sectionId);
    if (onSectionSelect) {
      onSectionSelect(sectionId);
    } else {
      navigateTo(`/visual/section/${sectionId}`);
    }
  };

  // Compute summary for hovered or selected section
  const targetSectionId = hoveredSection || selectedSection;
  const targetSection = currentAngle.sections.find((s) => s.id === targetSectionId);
  const sectionSummary = useMemo(() => {
    if (!targetSectionId) return null;
    return getSectionPlansSummary(flats, targetSectionId);
  }, [flats, targetSectionId]);

  // Check which sections have flats matching the active room filter
  const isSectionDimmed = (sectionId: number) => {
    if (activeRoomFilter === null) return false;
    const matching = flats.filter((f) => f.section === sectionId && f.rooms === activeRoomFilter);
    return matching.length === 0;
  };

  // Panoramic tour datasets
  const tourPanoramas = useMemo(() => {
    if (config?.panoramas && config.panoramas.length > 0) {
      return config.panoramas;
    }
    return [
      {
        id: 'pano_250',
        title: 'Общий вид 360° (Аэросъёмка)',
        src: '/images/3d_tour/pano_250_4k.jpg',
        poster: '/images/3d_tour/pano_250_preview.jpg',
        initialYaw: -100,
        initialPitch: -50,
        links: [
          { target: 'cam_5', yaw: -100, pitch: -50 },
          { target: 'cam_6', yaw: -80, pitch: -50 }
        ]
      },
      {
        id: 'cam_5',
        title: 'Фасад с проспекта 360°',
        src: '/images/3d_tour/cam_5_4k.jpg',
        poster: '/images/3d_tour/cam_5_preview.jpg',
        initialYaw: -100,
        initialPitch: -28,
        links: [
          { target: 'cam_6', yaw: -108, pitch: -7 },
          { target: 'pano_250', yaw: -100, pitch: 45 }
        ]
      },
      {
        id: 'cam_6',
        title: 'Двор и бульвар 360°',
        src: '/images/3d_tour/cam_6_4k.jpg',
        poster: '/images/3d_tour/cam_6_preview.jpg',
        initialYaw: -80,
        initialPitch: -28,
        links: [
          { target: 'cam_5', yaw: -80, pitch: -8 },
          { target: 'pano_250', yaw: -80, pitch: 45 }
        ]
      }
    ];
  }, [config?.panoramas]);

  return (
    <div className="visual-tour-container masterplan-stage" role="region" aria-label="3D-визуализатор жилого комплекса Shattyq">
      {/* Top Bar: Title, Angle info, and 360 Launch */}
      <div className="visual-top-bar">
        <div className="visual-title-badge">
          <Compass size={16} color="#ff6a00" />
          <span>{currentAngle.title}</span>
          <span style={{ opacity: 0.6 }}>· {currentAngle.subtitle}</span>
        </div>

        {/* Mode switcher: 2.5D visualizer vs. 360 panorama */}
        <div className="visual-view-mode-toggle" role="group" aria-label="Режим отображения">
          <button
            type="button"
            className={`visual-mode-toggle-btn ${viewMode === 'model' ? 'is-active' : ''}`}
            onClick={() => setViewMode('model')}
          >
            <Building2 size={14} />
            <span>3D-ракурс</span>
          </button>
          <button
            type="button"
            className={`visual-mode-toggle-btn ${viewMode === '360' ? 'is-active' : ''}`}
            onClick={() => setViewMode('360')}
          >
            <Camera size={14} />
            <span>Панорама 360°</span>
          </button>
        </div>

        <button
          type="button"
          className="visual-tour-360-btn"
          onClick={open360Tour}
          aria-label="Развернуть 360-тур во весь экран"
        >
          <Maximize size={15} />
          <span>Во весь экран</span>
        </button>
      </div>

      {/* Main Visualizer Stage (SVG + Image Overlay OR Inline 360 Panorama) */}
      <div className="visual-stage-wrap">
        {viewMode === '360' ? (
          <PanoramaViewer
            panoramas={tourPanoramas}
            selectedId={currentAngle.id === 'cam6' ? 'cam_6' : 'cam_5'}
            inline
            onClose={() => setViewMode('model')}
          />
        ) : (
          <>
            <svg
          viewBox={`0 0 ${currentAngle.width} ${currentAngle.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="visual-canvas-svg"
        >
          {/* High-definition Architectural Render Background */}
          <image
            href={siteUrl(currentAngle.image)}
            x="0"
            y="0"
            width={currentAngle.width}
            height={currentAngle.height}
            preserveAspectRatio="xMidYMid meet"
            className="visual-bg-image"
          />

          {/* Interactive Section Polygons Layer */}
          <g className="visual-sections-layer">
            {currentAngle.sections.map((section) => {
              const isHovered = hoveredSection === section.id;
              const isSelected = selectedSection === section.id;
              const dimmed = isSectionDimmed(section.id);

              return (
                <polygon
                  key={section.id}
                  points={section.points}
                  className={`visual-section-polygon ${
                    isHovered || isSelected ? 'is-active' : ''
                  } ${dimmed ? 'is-dimmed' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Выбрать секцию ${section.id}`}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => handleSectionClick(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSectionClick(section.id);
                    }
                  }}
                />
              );
            })}
          </g>

          {/* Section Badges */}
          <g className="visual-badges-layer">
            {currentAngle.sections.map((section) => (
              <foreignObject
                key={`badge-${section.id}`}
                x={section.badgePos.x}
                y={section.badgePos.y}
                width="240"
                height="48"
                style={{ overflow: 'visible' }}
              >
                <button
                  type="button"
                  className={`visual-section-badge ${
                    hoveredSection === section.id || selectedSection === section.id ? 'is-active' : ''
                  }`}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => handleSectionClick(section.id)}
                  aria-label={`Выбрать секцию ${section.id}`}
                >
                  <span className="badge-dot" />
                  <span>{section.label}</span>
                  <span className="badge-subtitle">({section.floors})</span>
                </button>
              </foreignObject>
            ))}
          </g>

          {/* POI Hotspot Pins */}
          <g className="visual-poi-layer">
            {currentAngle.poiPins.map((poi) => (
              <foreignObject
                key={poi.id}
                x={poi.x}
                y={poi.y}
                width="220"
                height="44"
                style={{ overflow: 'visible' }}
              >
                <button
                  type="button"
                  className={`visual-poi-pin type-${poi.type}`}
                  onClick={poi.type === '360' ? () => setViewMode('360') : undefined}
                  aria-label={poi.label}
                >
                  {poi.type === '360' ? <Camera size={14} /> : <Home size={13} />}
                  <span>{poi.label}</span>
                </button>
              </foreignObject>
            ))}
          </g>
        </svg>

        {/* Floating Tooltip Card on Hover / Select */}
        {targetSection && sectionSummary && (
          <div
            className="visual-floating-card"
            style={{
              left: Math.min(
                Math.max(20, (targetSection.badgePos.x / currentAngle.width) * 100),
                70
              ) + '%',
              top: Math.min(
                Math.max(10, (targetSection.badgePos.y / currentAngle.height) * 100 + 5),
                65
              ) + '%'
            }}
          >
            <div className="visual-card-header">
              <span className="visual-card-title">{targetSection.label}</span>
              <span className="visual-card-badge">{targetSection.floors}</span>
            </div>

            <div className="visual-card-info">
              <div className="visual-card-row">
                <span>Вариантов планировок:</span>
                <strong>{sectionSummary.totalPlans}</strong>
              </div>
              <div className="visual-card-row">
                <span>Площади:</span>
                <strong>
                  {sectionSummary.minArea} – {sectionSummary.maxArea} м²
                </strong>
              </div>
              <div className="visual-card-row">
                <span>Статус:</span>
                <strong style={{ color: '#16a34a' }}>Открыто бронирование</strong>
              </div>
            </div>

            <div className="visual-card-rooms">
              {sectionSummary.roomLabels.map((tag) => (
                <span key={tag} className="visual-card-room-tag">
                  {tag}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="visual-card-action"
              onClick={() => handleSectionClick(targetSection.id)}
            >
              <span>Выбрать квартиру на этаже</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Bottom Bar: Room Filter and Rotate Button */}
        <div className="visual-bottom-bar">
          {/* Room Filter (Stavni Obvodny Style) */}
          <div className="visual-room-filter" role="group" aria-label="Фильтр по комнатам">
            <button
              type="button"
              className={`visual-room-filter-btn ${activeRoomFilter === null ? 'is-active' : ''}`}
              onClick={() => setActiveRoomFilter(null)}
            >
              Все
            </button>
            <button
              type="button"
              className={`visual-room-filter-btn ${activeRoomFilter === 1 ? 'is-active' : ''}`}
              onClick={() => setActiveRoomFilter(activeRoomFilter === 1 ? null : 1)}
            >
              1к
            </button>
            <button
              type="button"
              className={`visual-room-filter-btn ${activeRoomFilter === 2 ? 'is-active' : ''}`}
              onClick={() => setActiveRoomFilter(activeRoomFilter === 2 ? null : 2)}
            >
              2к
            </button>
            <button
              type="button"
              className={`visual-room-filter-btn ${activeRoomFilter === 3 ? 'is-active' : ''}`}
              onClick={() => setActiveRoomFilter(activeRoomFilter === 3 ? null : 3)}
            >
              3к
            </button>
            <button
              type="button"
              className={`visual-room-filter-btn ${activeRoomFilter === 4 ? 'is-active' : ''}`}
              onClick={() => setActiveRoomFilter(activeRoomFilter === 4 ? null : 4)}
            >
              4к
            </button>
          </div>

          {/* Change Angle Button ("Сменить ракурс") */}
          <button
            type="button"
            className="visual-rotate-control"
            onClick={toggleAngle}
            aria-label="Сменить ракурс здания"
            title="Сменить угол обзора комплекса"
          >
            <RotateCw size={15} />
            <span>Сменить ракурс</span>
          </button>
        </div>
          </>
        )}
      </div>

      {/* 360° Spherical Tour Modal */}
      {is360Open && (
        <div className="visual-panorama-overlay" role="dialog" aria-label="Виртуальный 360-тур">
          <PanoramaViewer
            panoramas={tourPanoramas}
            selectedId={currentAngle.id === 'cam6' ? 'cam_6' : 'cam_5'}
            onClose={close360Tour}
          />
        </div>
      )}
    </div>
  );
}
