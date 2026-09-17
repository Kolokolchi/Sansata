import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  Heart,
  Download,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Share2,
  Check,
  Scale,
  X,
  Printer,
  Box,
  Search
} from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';
import { Flat, ExperienceConfig, areaLabel, money, statusLabel } from '../lib/experience';
import {SelectionModes} from './Journey';

const Scene = lazy(() => import('./SceneViewer').then((m) => ({ default: m.SceneViewer })));

interface CatalogProps {
  flats: Flat[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onConsult: (topic: string) => void;
  config: ExperienceConfig;
}

interface PlanCardProps {
  flat: Flat;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  compare?: string[];
  onCompare?: (id: string) => void;
}

export function PlanCard({
  flat: p,
  favorites,
  toggleFavorite,
  compare,
  onCompare
}: PlanCardProps) {
  const isFavorite = favorites.includes(p.id);

  return (
    <article className="plan-card">
      <div className="plan-top">
        <span>{p.rooms}-комнатная</span>
        <button
          className={`icon ${isFavorite ? 'saved' : ''}`}
          aria-label={`${isFavorite ? 'Удалить из избранного' : 'В избранное'}: ${p.id}`}
          onClick={() => toggleFavorite(p.id)}
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <a
        className="plan-image"
        href={siteUrl(`/flat/${p.id}`)}
        onClick={(e) => {
          e.preventDefault();
          navigateTo(`/flat/${p.id}`);
        }}
      >
        <img
          src={siteUrl(p.image)}
          loading="lazy"
          alt={`Планировка ${p.id}, ${p.rooms} комнаты, секция ${p.section}, этаж ${p.floor}`}
        />
      </a>

      <div className="catalog-meta">
        <span>
          Секция {p.section} · {p.floor} этаж
        </span>
        <strong>{areaLabel(p)}</strong>
        <small>{statusLabel[p.status]}</small>
      </div>

      <div className="plan-bottom">
        <div>
          <small>Вариант {p.id.split('-')[1]}</small>
          <strong>{p.price === null ? 'Цена по запросу' : money(p.price)}</strong>
        </div>
        <a
          className="icon"
          href={siteUrl(`/flat/${p.id}`)}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(`/flat/${p.id}`);
          }}
          aria-label={`Открыть ${p.id}`}
        >
          <ArrowUpRight />
        </a>
      </div>

      {onCompare && (
        <button
          className={`compare-button ${compare?.includes(p.id) ? 'active' : ''}`}
          onClick={() => onCompare(p.id)}
        >
          <Scale size={16} />
          {compare?.includes(p.id) ? 'В сравнении' : 'Сравнить'}
        </button>
      )}
    </article>
  );
}

export function Catalog({
  flats,
  favorites,
  toggleFavorite,
  onConsult,
  config,
  onlyFavorites = false
}: CatalogProps & { onlyFavorites?: boolean }) {
  const queryParams = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

  const [rooms, setRooms] = useState<number[]>(
    queryParams.get('rooms')?.split(',').map(Number).filter((n) => [2, 3, 4].includes(n)) || []
  );
  const [section, setSection] = useState(queryParams.get('section') || '');
  const [floor, setFloor] = useState(queryParams.get('floor') || '');
  const [minArea, setMinArea] = useState(queryParams.get('minArea') || '');
  const [maxArea, setMaxArea] = useState(queryParams.get('maxArea') || '');
  const [maxPrice, setMaxPrice] = useState(queryParams.get('maxPrice') || '');
  const [sort, setSort] = useState(queryParams.get('sort') || 'rooms');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Синхронизация состояния фильтра с URL search params
  useEffect(() => {
    if (typeof location === 'undefined') return;
    const url = new URL(location.href);
    const fields: Record<string, string> = {
      rooms: rooms.join(','),
      section,
      floor,
      minArea,
      maxArea,
      maxPrice,
      sort
    };

    Object.entries(fields).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    });

    history.replaceState(null, '', url);
  }, [rooms, section, floor, minArea, maxArea, maxPrice, sort]);

  const displayedFlats = flats
    .filter(
      (p) =>
        (!onlyFavorites || favorites.includes(p.id)) &&
        (!rooms.length || rooms.includes(p.rooms)) &&
        (!section || p.section === Number(section)) &&
        (!floor || p.floor === Number(floor)) &&
        (!minArea || (p.area !== null && p.area >= Number(minArea))) &&
        (!maxArea || (p.area !== null && p.area <= Number(maxArea))) &&
        (!maxPrice || (p.price !== null && p.price <= Number(maxPrice)))
    )
    .sort((a, b) => {
      if (sort === 'area') return (a.area ?? Infinity) - (b.area ?? Infinity);
      if (sort === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === 'floor') return a.floor - b.floor;
      return a.rooms - b.rooms;
    });

  const handleResetFilters = () => {
    setRooms([]);
    setSection('');
    setFloor('');
    setMinArea('');
    setMaxArea('');
    setMaxPrice('');
    setSort('rooms');
  };

  const handleToggleCompare = (id: string) => {
    setNotice('');
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        setNotice('Можно сравнить до трёх планировок. Уберите один вариант.');
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="experience-page">
      <SelectionModes active="catalog"/><div className="page-heading">
        <span className="eyebrow">SHATTYQ / {onlyFavorites ? 'ИЗБРАННОЕ' : 'ВЫБОР КВАРТИРЫ'}</span>
        <h1>{onlyFavorites ? 'Ваши избранные планировки' : 'Найдите свою квартиру'}</h1>
        <p>
          Планы из официального каталога Shattyq. Этаж и секция указаны на чертежах; опубликованный вариант
          не означает свободную квартиру.
        </p>
      </div>

      <div className="catalog-switch">
        <a
          className="button outline"
          href={siteUrl('/visual')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/visual');
          }}
        >
          <Box size={18} /> Выбрать на 3D-плане
        </a>
        <a
          className="button outline"
          href={siteUrl(onlyFavorites ? '/parametric-search' : '/favorite')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(onlyFavorites ? '/parametric-search' : '/favorite');
          }}
        >
          <Heart size={18} />
          {onlyFavorites ? 'Весь каталог' : `Избранное (${favorites.length})`}
        </a>
      </div>

      <div className="catalog-layout">
        <aside className="filters">
          <h3>
            <SlidersHorizontal size={20} /> Параметры
          </h3>

          <label>Количество комнат</label>
          <div className="room-options">
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                aria-pressed={rooms.includes(num)}
                className={rooms.includes(num) ? 'active' : ''}
                onClick={() =>
                  setRooms((prev) =>
                    prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]
                  )
                }
              >
                {num}
              </button>
            ))}
          </div>

          <label htmlFor="section-filter">Секция</label>
          <select
            id="section-filter"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">Все секции</option>
            {[1, 2].map((num) => (
              <option key={num} value={num}>
                Секция {num}
              </option>
            ))}
          </select>

          <label htmlFor="floor-filter">Этаж на чертеже</label>
          <select
            id="floor-filter"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          >
            <option value="">Все этажи</option>
            {[...new Set(flats.map((p) => p.floor))]
              .sort((a, b) => a - b)
              .map((num) => (
                <option key={num} value={num}>
                  {num} этаж
                </option>
              ))}
          </select>

          <label>Площадь, м²</label>
          <div className="range-inputs">
            <input
              aria-label="Площадь от"
              type="number"
              min="0"
              placeholder="От"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
            <input
              aria-label="Площадь до"
              type="number"
              min="0"
              placeholder="До"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
          <small>
            ≈ — сумма площадей помещений на чертеже. Варианты без оцифрованной площади скрываются при фильтрации.
          </small>

          <label htmlFor="price-filter">Бюджет до, ₸</label>
          <input
            id="price-filter"
            type="number"
            min="0"
            step="1000000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Любой"
          />
          <small>Опубликованные цены пока отсутствуют. При заданном бюджете варианты без цены не отображаются.</small>

          <button className="text-link" onClick={handleResetFilters}>
            <X size={15} /> Сбросить фильтры
          </button>

          <button className="button blue" onClick={() => onConsult('Подбор квартиры по параметрам')}>
            Помочь с выбором <ArrowUpRight size={16} />
          </button>
        </aside>

        <div className="catalog-results">
          <div className="catalog-results-head">
            <span role="status">Найдено: {displayedFlats.length}</span>

            <label>
              <span className="sr-only">Сортировка</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rooms">По комнатности</option>
                <option value="area">По площади</option>
                <option value="floor">По этажу</option>
                <option value="price">По цене</option>
              </select>
            </label>

            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                aria-label="Карточки"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                aria-label="Список"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {notice && (
            <p className="form-error" role="status">
              {notice}
            </p>
          )}

          {displayedFlats.length === 0 ? (
            <div className="empty">
              <Search />
              <h3>{onlyFavorites && !favorites.length ? 'Пока ничего не сохранено' : 'Подходящих планировок нет'}</h3>
              <p>
                {maxPrice
                  ? 'Цены не загружены. Уберите бюджет или запросите подбор.'
                  : 'Измените параметры или откройте полный каталог.'}
              </p>
              <button className="button outline" onClick={handleResetFilters}>
                Сбросить параметры
              </button>
              {onlyFavorites && (
                <a
                  className="button blue"
                  href={siteUrl('/parametric-search')}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/parametric-search');
                  }}
                >
                  Перейти в каталог
                </a>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="plan-grid">
              {displayedFlats.map((p) => (
                <PlanCard
                  key={p.id}
                  flat={p}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  compare={compareList}
                  onCompare={handleToggleCompare}
                />
              ))}
            </div>
          ) : (
            <div className="flat-table">
              <table>
                <thead>
                  <tr>
                    <th>Планировка</th>
                    <th>Секция / этаж</th>
                    <th>Площадь</th>
                    <th>Стоимость</th>
                    <th>Сохранить</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFlats.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <a
                          href={siteUrl(`/flat/${p.id}`)}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo(`/flat/${p.id}`);
                          }}
                        >
                          {p.rooms}-комнатная · {p.id.split('-')[1]}
                        </a>
                      </td>
                      <td>
                        {p.section} / {p.floor}
                      </td>
                      <td>{areaLabel(p)}</td>
                      <td>{p.price === null ? 'По запросу' : money(p.price)}</td>
                      <td>
                        <button
                          className="icon"
                          aria-label={`Избранное ${p.id}`}
                          onClick={() => toggleFavorite(p.id)}
                        >
                          <Heart
                            size={18}
                            fill={favorites.includes(p.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {compareList.length > 0 && (
        <div className="compare-bar">
          <Scale size={20} />
          <span>В сравнении: {compareList.length} / 3</span>
          <button className="button blue" onClick={() => setIsCompareOpen(true)}>
            Сравнить
          </button>
          <button
            className="icon"
            aria-label="Очистить сравнение"
            onClick={() => {
              setCompareList([]);
              setIsCompareOpen(false);
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {isCompareOpen && (
        <Compare
          plans={flats.filter((p) => compareList.includes(p.id))}
          close={() => setIsCompareOpen(false)}
        />
      )}
    </div>
  );
}

function Compare({ plans, close }: { plans: Flat[]; close: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal wide compare-modal"
      aria-label="Сравнение планировок"
      onCancel={close}
    >
      <button className="icon modal-close" aria-label="Закрыть сравнение" onClick={close}>
        <X />
      </button>
      <h2>Сравните своё пространство</h2>

      <div className="compare-table">
        <table>
          <tbody>
            <tr>
              <th>План</th>
              {plans.map((p) => (
                <td key={p.id}>
                  <a
                    href={siteUrl(`/flat/${p.id}`)}
                    onClick={(e) => {
                      e.preventDefault();
                      close();
                      navigateTo(`/flat/${p.id}`);
                    }}
                  >
                    <img src={siteUrl(p.image)} alt={p.id} />
                  </a>
                </td>
              ))}
            </tr>

            {[
              ['Комнаты', (p: Flat) => p.rooms],
              ['Секция / этаж', (p: Flat) => `${p.section} / ${p.floor}`],
              ['Площадь', (p: Flat) => areaLabel(p)],
              ['Стоимость', (p: Flat) => (p.price === null ? 'По запросу' : money(p.price))],
              ['Наличие', (p: Flat) => statusLabel[p.status]]
            ].map(([title, fn]) => (
              <tr key={title as string}>
                <th>{title as string}</th>
                {plans.map((p) => (
                  <td key={p.id}>{(fn as (p: Flat) => React.ReactNode)(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </dialog>
  );
}

export function FlatPage({
  flats,
  favorites,
  toggleFavorite,
  onConsult,
  config,
  id
}: CatalogProps & { id: string }) {
  const plan = flats.find((v) => v.id === id);
  const [isZoomed, setIsZoomed] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  if (!plan) {
    return (
      <div className="experience-page empty">
        <h1>Планировка не найдена</h1>
        <a
          className="button blue"
          href={siteUrl('/parametric-search')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/parametric-search');
          }}
        >
          Вернуться в каталог
        </a>
      </div>
    );
  }

  const isFav = favorites.includes(plan.id);

  return (
    <div className="experience-page flat-page">
      <a
        className="text-link"
        href={siteUrl('/parametric-search')}
        onClick={(e) => {
          e.preventDefault();
          navigateTo('/parametric-search');
        }}
      >
        <ArrowLeft size={17} /> Все планировки
      </a>

      <div className="flat-page-head">
        <div>
          <span className="eyebrow">SHATTYQ · ВАРИАНТ {plan.id.split('-')[1]}</span>
          <h1>{plan.rooms}-комнатная квартира</h1>
        </div>

        <button className="button outline" onClick={() => toggleFavorite(plan.id)}>
          <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
          {isFav ? 'В избранном' : 'В избранное'}
        </button>
      </div>

      <div className="flat-detail-layout">
        <div>
          <div className="tabs feature-tabs">
            <button className={!show3d ? 'active' : ''} onClick={() => setShow3d(false)}>
              План квартиры
            </button>
            <button className={show3d ? 'active' : ''} onClick={() => setShow3d(true)}>
              Демонстрация 3D-тура
            </button>
          </div>

          {show3d ? (
            <Suspense fallback={<div className="loading-panel">Загрузка 3D…</div>}>
              <Scene config={config} section={0} floor={0} interior />
            </Suspense>
          ) : (
            <div className={`large-plan ${isZoomed ? 'is-zoomed' : ''}`}>
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                aria-label={isZoomed ? 'Уменьшить план' : 'Увеличить план'}
              >
                <img src={siteUrl(plan.image)} alt={`Чертёж ${plan.rooms}-комнатной квартиры Shattyq`} />
              </button>
            </div>
          )}

          <div className="flat-actions">
            <a
              className="text-link"
              href={siteUrl(plan.image)}
              download={`Shattyq-${plan.id}.jpg`}
            >
              <Download size={17} /> Скачать план
            </a>
            <button className="text-link" onClick={() => window.print()}>
              <Printer size={17} /> Печать / PDF
            </button>
            <button
              className="text-link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setShareNotice('Ссылка скопирована');
                } catch {
                  setShareNotice('Ссылка: ' + location.href);
                }
              }}
            >
              <Share2 size={17} /> Поделиться
            </button>
          </div>

          {shareNotice && <p role="status">{shareNotice}</p>}
        </div>

        <aside className="flat-summary">
          <span className="status-chip">{statusLabel[plan.status]}</span>
          <h2>{plan.price === null ? 'Цена по запросу' : money(plan.price)}</h2>

          <dl>
            <div>
              <dt>Комнат</dt>
              <dd>{plan.rooms}</dd>
            </div>
            <div>
              <dt>Секция</dt>
              <dd>{plan.section}</dd>
            </div>
            <div>
              <dt>Этаж на чертеже</dt>
              <dd>{plan.floor}</dd>
            </div>
            <div>
              <dt>Площадь</dt>
              <dd>{areaLabel(plan)}</dd>
            </div>
          </dl>

          {plan.areaKind === 'calculated' && plan.area !== null && (
            <p className="muted-note">
              Ориентир: сумма площадей помещений с учётом указанного коэффициента лоджии. Договорную
              площадь подтвердит менеджер.
            </p>
          )}

          <div className="feature-chips">
            {plan.features.map((feature) => (
              <span key={feature}>
                <Check size={13} />
                {feature}
              </span>
            ))}
          </div>

          <button
            className="button blue"
            onClick={() =>
              onConsult(
                `Планировка ${plan.id}: ${plan.rooms} комнаты, секция ${plan.section}, этаж ${plan.floor}`
              )
            }
          >
            Запросить стоимость <ArrowUpRight size={17} />
          </button>

          <a
            className="button outline"
            href={siteUrl(`/mortgage${plan.price ? '?price=' + plan.price : ''}`)}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(`/mortgage${plan.price ? '?price=' + plan.price : ''}`);
            }}
          >
            Рассчитать платёж
          </a>

          <p className="muted-note">Это опубликованная планировка, не подтверждение наличия конкретной квартиры.</p>
        </aside>
      </div>

      <h2 className="related-title">Другие варианты</h2>
      <div className="plan-grid">
        {flats
          .filter((v) => v.rooms === plan.rooms && v.id !== plan.id)
          .slice(0, 3)
          .map((v) => (
            <PlanCard
              key={v.id}
              flat={v}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ))}
      </div>
    </div>
  );
}

export function VisualSelector({ flats, favorites, toggleFavorite, onConsult, config }: CatalogProps) {
  const [section, setSection] = useState(1);
  const [floor, setFloor] = useState(7);

  const matchedFlats = flats.filter((p) => p.section === section && p.floor === floor);

  return (
    <div className="experience-page visual-page"><SelectionModes active="free"/>
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ВЫБОР НА 3D-ПЛАНЕ</span>
        <h1>От дома — к вашей квартире.</h1>
        <p>
          Нажмите на этаж в сцене или выберите его в панели. Планировки привязаны к секциям и этажам,
          указанным на оригинальных чертежах.
        </p>
      </div>

      <div className="visual-layout">
        <Suspense fallback={<div className="loading-panel">Загрузка 3D…</div>}>
          <Scene
            config={config}
            section={section}
            floor={floor}
            onSelect={(s, f) => {
              setSection(s);
              setFloor(f);
            }}
          />
        </Suspense>

        <aside className="visual-sidebar">
          <h3>Выберите секцию</h3>
          <div className="room-options">
            {[1, 2].map((num) => (
              <button
                className={section === num ? 'active' : ''}
                key={num}
                aria-pressed={section === num}
                onClick={() => setSection(num)}
              >
                {num}
              </button>
            ))}
          </div>

          <h3>Этаж</h3>
          <div className="floor-options">
            {Array.from({ length: 9 }, (_, i) => 9 - i).map((num) => (
              <button
                key={num}
                className={floor === num ? 'active' : ''}
                onClick={() => setFloor(num)}
                aria-pressed={floor === num}
              >
                {num}
                <span>{flats.filter((p) => p.section === section && p.floor === num).length || '—'}</span>
              </button>
            ))}
          </div>
          <small>Число справа — опубликованные варианты планировок, не остатки продаж.</small>

          <a
            className="text-link"
            href={siteUrl('/parametric-search')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/parametric-search');
            }}
          >
            Поиск по параметрам <ArrowUpRight size={16} />
          </a>
        </aside>
      </div>

      <div className="visual-result-title">
        <h2>
          Секция {section} · {floor} этаж
        </h2>
        <span role="status">Опубликовано вариантов: {matchedFlats.length}</span>
      </div>

      {matchedFlats.length ? (
        <div className="plan-grid">
          {matchedFlats.map((p) => (
            <PlanCard
              key={p.id}
              flat={p}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Планы этого этажа пока не опубликованы</h3>
          <p>Выберите этаж с доступными чертежами или запросите информацию.</p>
          <button
            className="button blue"
            onClick={() => onConsult(`Секция ${section}, этаж ${floor}`)}
          >
            Запросить планировку <ArrowUpRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
