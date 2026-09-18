import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Box,
  SlidersHorizontal,
  Compass,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Flat, ExperienceConfig, areaLabel, money } from '../lib/experience';
import { siteUrl, sitePath, navigateTo } from '../lib/site';
import { floorPath, sectionPath, journeyRoute, matchingPlans } from '../lib/journey';
import '../styles/journey.css';
import { SelectionImage } from './SelectionImage';
import { SelectionImage as SelectionImageData } from '../types';
import { getFloorPlanMedia } from '../data/floorPlansData';
import { VisualTourViewer } from './VisualTourViewer';

export function JourneyLink({
  to,
  children,
  className = ''
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={siteUrl(to)}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          navigateTo(to);
        }
      }}
    >
      {children}
    </a>
  );
}

export function SelectionModes({ active = 'route' }: { active?: 'route' | 'free' | 'catalog' }) {
  return (
    <nav className="selection-modes" aria-label="Способ выбора квартиры">
      <JourneyLink to="/visual" className={active === 'route' ? 'active' : ''}>
        На генплане
      </JourneyLink>
      <JourneyLink to="/parametric-search" className={active === 'catalog' ? 'active' : ''}>
        <SlidersHorizontal size={15} />
        По параметрам
      </JourneyLink>
      <JourneyLink to="/visual/free" className={active === 'free' ? 'active' : ''}>
        <Box size={15} />
        Свободный 3D
      </JourneyLink>
    </nav>
  );
}

export function Masterplan({
  flats,
  selected = 0,
  onSection,
  media
}: {
  flats: Flat[];
  selected?: number;
  onSection: (s: number) => void;
  media?: SelectionImageData;
}) {
  const [angle, setAngle] = useState(0);

  if (media) {
    return (
      <SelectionImage
        data={media}
        selected={String(selected)}
        label={(id) => `Выбрать секцию ${id}`}
        onSelect={(id) => onSection(Number(id))}
      />
    );
  }

  return (
    <VisualTourViewer
      flats={flats}
      onSectionSelect={onSection}
    />
  );
}

export function FloorMap({
  flats,
  section,
  floor,
  selected,
  onSelect,
  rooms = [],
  media,
  favorites = [],
  onToggleFavorite
}: {
  media?: SelectionImageData;
  flats: Flat[];
  section: number;
  floor: number;
  selected?: string;
  onSelect: (p: Flat) => void;
  rooms?: number[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}) {
  const plans = matchingPlans(flats, section, floor);
  // Используем переданный медиа либо эталонный SVG-план этажа
  const activeMedia = media || getFloorPlanMedia(section, floor);

  if (!plans.length) {
    return (
      <div className="floor-map">
        <div className="floor-map-heading">
          <span>СЕКЦИЯ {section} / ЭТАЖ {floor}</span>
          <span>Схема вариантов · не поэтажный чертёж</span>
        </div>
        <div className="floor-empty">
          <h3>Чертежи этого этажа пока не опубликованы</h3>
          <p>Выберите этаж с отмеченными вариантами.</p>
        </div>
      </div>
    );
  }

  if (activeMedia) {
    return (
      <div className="floor-map floor-map-visual-wrap">
        <div className="floor-map-heading">
          <span>СЕКЦИЯ {section} / ЭТАЖ {floor}</span>
          <span className="floor-map-sub">Интерактивный чертёж этажа</span>
        </div>
        <SelectionImage
          data={activeMedia}
          selected={selected}
          label={(id) => `Выбрать планировку ${id}`}
          disabled={activeMedia.regions
            .filter((r) => !plans.some((p) => p.id === r.id && (!rooms.length || rooms.includes(p.rooms))))
            .map((r) => r.id)}
          flats={flats}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onSelect={(id) => {
            const p = plans.find((item) => item.id === id) || flats.find((item) => item.id === id);
            if (p) onSelect(p);
          }}
        />
        <div className="floor-legend">
          <i /> Доступная планировка <i className="picked" /> Выбранная <span>Наличие уточняется</span>
        </div>

        <div className="floor-diagram" style={{ marginTop: '28px' }}>
          <div className="floor-core">
            <span>↕</span>
            <span>
              ЛИФТЫ
              <br />И ХОЛЛ
            </span>
            <div className="stairs" />
          </div>
          {plans.map((p, i) => {
            const faded = rooms.length > 0 && !rooms.includes(p.rooms);
            return (
              <button
                key={p.id}
                disabled={faded}
                className={`floor-unit unit-${i} ${selected === p.id ? 'selected' : ''}`}
                onClick={() => onSelect(p)}
                aria-label={`Выбрать планировку ${p.id}, ${p.rooms} комнаты`}
              >
                <img src={siteUrl(p.image)} alt={`Оригинальная планировка ${p.id}`} />
                <span className="unit-label">
                  <strong>{p.rooms}к</strong>
                  <span>
                    Вариант {p.id.split('-')[1]}
                    <small>{areaLabel(p)}</small>
                  </span>
                  <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback диаграмма
  return (
    <div className="floor-map">
      <div className="floor-map-heading">
        <span>СЕКЦИЯ {section} / ЭТАЖ {floor}</span>
        <span>Схема вариантов · не поэтажный чертёж</span>
      </div>
      <div className="floor-diagram">
        <div className="floor-core">
          <span>↕</span>
          <span>
            ЛИФТЫ
            <br />И ХОЛЛ
          </span>
          <div className="stairs" />
        </div>
        {plans.map((p, i) => {
          const faded = rooms.length > 0 && !rooms.includes(p.rooms);
          return (
            <button
              key={p.id}
              disabled={faded}
              className={`floor-unit unit-${i} ${selected === p.id ? 'selected' : ''}`}
              onClick={() => onSelect(p)}
              aria-label={`Выбрать планировку ${p.id}, ${p.rooms} комнаты`}
            >
              <img src={siteUrl(p.image)} alt={`Оригинальная планировка ${p.id}`} />
              <span className="unit-label">
                <strong>{p.rooms}к</strong>
                <span>
                  Вариант {p.id.split('-')[1]}
                  <small>{areaLabel(p)}</small>
                </span>
                <ArrowRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {!plans.length && (
        <div className="floor-empty">
          <h3>Чертежи этого этажа пока не опубликованы</h3>
          <p>Выберите этаж с отмеченными вариантами.</p>
        </div>
      )}
      <div className="floor-legend">
        <i /> Опубликованный вариант <i className="picked" /> Выбранный вариант <span>Наличие уточняется</span>
      </div>
    </div>
  );
}

export function FloorRail({
  flats,
  section,
  floor,
  onFloor
}: {
  flats: Flat[];
  section: number;
  floor: number;
  onFloor: (f: number) => void;
}) {
  return (
    <div className="floor-rail" aria-label="Выбор этажа">
      <button
        aria-label="Этаж выше"
        disabled={floor === 9}
        onClick={() => onFloor(Math.min(9, floor + 1))}
      >
        <ChevronUp />
      </button>
      {Array.from({ length: 9 }, (_, i) => 9 - i).map((f) => (
        <button
          key={f}
          aria-label={`Этаж ${f}`}
          aria-pressed={f === floor}
          className={`${f === floor ? 'active' : ''} ${matchingPlans(flats, section, f).length ? 'has-plans' : ''}`}
          onClick={() => onFloor(f)}
        >
          {f}
          <small>{matchingPlans(flats, section, f).length || '—'}</small>
        </button>
      ))}
      <button
        aria-label="Этаж ниже"
        disabled={floor === 1}
        onClick={() => onFloor(Math.max(1, floor - 1))}
      >
        <ChevronDown />
      </button>
    </div>
  );
}

export interface JourneyProps {
  flats: Flat[];
  config: ExperienceConfig;
  onConsult: (s: string) => void;
  favorites?: string[];
  toggleFavorite?: (id: string) => void;
}

export function Journey({
  flats,
  config,
  onConsult,
  favorites = [],
  toggleFavorite
}: JourneyProps) {
  const route = journeyRoute(sitePath());
  const [rooms, setRooms] = useState<number[]>([]);
  const [hoverFloor, setHoverFloor] = useState<number | null>(null);

  if (!route) {
    return (
      <div className="experience-page">
        <h1>Такой секции или этажа нет</h1>
        <JourneyLink to="/visual">Вернуться на генплан</JourneyLink>
      </div>
    );
  }

  const { section, floor } = route;
  const current = hoverFloor ? matchingPlans(flats, section, hoverFloor, rooms) : [];

  return (
    <div className="journey-page">
      <div className="journey-top">
        <nav className="journey-crumbs" aria-label="Маршрут выбора">
          <JourneyLink to={floor ? sectionPath(section) : '/visual'}>
            <ArrowLeft size={18} />
          </JourneyLink>
          <JourneyLink to="/visual">Генплан</JourneyLink>
          {section > 0 && (
            <>
              <span>/</span>
              <JourneyLink to={sectionPath(section)}>Секция {section}</JourneyLink>
            </>
          )}
          {floor > 0 && (
            <>
              <span>/</span>
              <div className="journey-floor-crumb">
                <strong>Этаж {floor}</strong>
                <div className="floor-quick-arrows" role="group" aria-label="Смена этажа">
                  <button
                    type="button"
                    disabled={floor <= 1}
                    onClick={() => navigateTo(floorPath(section, Math.max(1, floor - 1)))}
                    aria-label="Предыдущий этаж"
                    className="floor-nav-arrow"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={floor >= 9}
                    onClick={() => navigateTo(floorPath(section, Math.min(9, floor + 1)))}
                    aria-label="Следующий этаж"
                    className="floor-nav-arrow"
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </nav>
        <SelectionModes />
      </div>

      <div className="journey-title">
        <span className="eyebrow">
          SHATTYQ /{' '}
          {floor
            ? '03 — ВЫБЕРИТЕ КВАРТИРУ'
            : section
            ? '02 — ВЫБЕРИТЕ ЭТАЖ'
            : '01 — ВЫБЕРИТЕ СЕКЦИЮ'}
        </span>
        <h1>
          {floor
            ? `Квартира начинается с выбора.`
            : section
            ? `Секция ${section}. Ваш уровень жизни.`
            : 'Найдите своё место в Shattyq.'}
        </h1>
      </div>

      {!section ? (
        <Masterplan
          media={config.selectionMedia?.masterplan}
          flats={rooms.length ? flats.filter((p) => rooms.includes(p.rooms)) : flats}
          onSection={(s) => navigateTo(sectionPath(s))}
        />
      ) : !floor ? (
        config.selectionMedia?.facades?.[section] ? (
          <SelectionImage
            data={config.selectionMedia.facades[section]}
            label={(id) => `Выбрать этаж ${id}`}
            onSelect={(id) => navigateTo(floorPath(section, Number(id)))}
          />
        ) : (
          <div className="facade-stage">
            <img
              src={siteUrl('/sensata/hero.jpg')}
              alt={`Рендер Shattyq — выбор этажа секции ${section}`}
            />
            <div className="facade-shade" />
            <div className="facade-floors">
              {Array.from({ length: 9 }, (_, i) => 9 - i).map((f) => {
                const count = matchingPlans(flats, section, f, rooms).length;
                return (
                  <button
                    key={f}
                    onMouseEnter={() => setHoverFloor(f)}
                    onFocus={() => setHoverFloor(f)}
                    onClick={() => navigateTo(floorPath(section, f))}
                    className={count ? 'has-plans' : ''}
                    aria-label={`Выбрать этаж ${f}, вариантов ${count}`}
                  >
                    <strong>{f}</strong>
                    <span>этаж</span>
                    <small>{count ? `${count} варианта` : 'Планы ожидаются'}</small>
                    <ArrowRight size={16} />
                  </button>
                );
              })}
            </div>
            <aside className="facade-summary">
              <span>СЕКЦИЯ {section}</span>
              <h2>{hoverFloor ? `${hoverFloor} этаж` : 'Выберите этаж'}</h2>
              <p>
                {hoverFloor
                  ? `Опубликовано вариантов: ${current.length}`
                  : 'Наведите на этаж или выберите его нажатием.'}
              </p>
              {[2, 3, 4].map((n) => (
                <div key={n}>
                  <span>{n}-комнатные</span>
                  <strong>{current.filter((p) => p.rooms === n).length || '—'}</strong>
                </div>
              ))}
              <small>Числа обозначают чертежи в каталоге, не остатки продаж.</small>
            </aside>
            <span className="visual-disclaimer">Навигационная схема на рендере · положение этажей условное</span>
          </div>
        )
      ) : (
        <div className="floor-stage">
          <FloorMap
            media={config.selectionMedia?.floorPlans?.[`${section}-${floor}`]}
            flats={flats}
            section={section}
            floor={floor}
            rooms={rooms}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelect={(p) => navigateTo(`/flat/${p.id}?view=tour&from=floor`)}
          />
          <FloorRail
            flats={flats}
            section={section}
            floor={floor}
            onFloor={(f) => navigateTo(floorPath(section, f))}
          />
        </div>
      )}

      <div className="journey-bottom">
        <div className="journey-rooms">
          <span>Комнат</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={rooms.includes(n) ? 'active' : ''}
              aria-pressed={rooms.includes(n)}
              onClick={() =>
                setRooms((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]))
              }
            >
              {n}к
            </button>
          ))}
          {rooms.length > 0 && <button onClick={() => setRooms([])}>Все</button>}
        </div>
        <p>Генплан → секция → этаж → квартира</p>
        <button
          className="text-link"
          onClick={() =>
            onConsult(
              `Подбор Shattyq${section ? `, секция ${section}` : ''}${floor ? `, этаж ${floor}` : ''}`
            )
          }
        >
          Помочь с выбором <ArrowRight size={16} />
        </button>
      </div>

      {floor > 0 && (
        <div className="floor-list">
          {matchingPlans(flats, section, floor, rooms).map((p) => (
            <JourneyLink key={p.id} to={`/flat/${p.id}?view=tour&from=floor`}>
              <strong>
                {p.rooms}-комнатная · вариант {p.id.split('-')[1]}
              </strong>
              <span>{areaLabel(p)}</span>
              <span>{p.price ? money(p.price) : 'Цена по запросу'}</span>
              <ArrowRight size={18} />
            </JourneyLink>
          ))}
        </div>
      )}
    </div>
  );
}
