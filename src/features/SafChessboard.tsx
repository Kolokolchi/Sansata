import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw, Search, X } from 'lucide-react';
import { compareSafLevels, groupSafPlans, parseOptionalBound, SAF_BLOCKS, SAF_ROOMS, safLevelLabel } from '../lib/safSelection';
import { navigateTo, siteUrl } from '../lib/site';
import '../styles/saf-chessboard.css';

type Plan = { code: string; rooms: number; area: number; image: string };
type View = 'compact' | 'expanded' | 'units' | 'plans';
type RouteState = { block: number | null; level: string | null; plan: string | null; view: View };

// This route displays published layout variants. It does not manufacture apartment lots.
const officialBoard = 'https://www.sensata.kz/project/saf-avenue#/catalog/house/154814/smallGrid?filter=property.type:property&filter=property.status:AVAILABLE';
const views: { id: View; label: string }[] = [
  { id: 'compact', label: 'Шахматка' },
  { id: 'expanded', label: 'Шахматка +' },
  { id: 'units', label: 'Помещения' },
  { id: 'plans', label: 'Планировки' },
];

function readRoute(catalog: ReturnType<typeof groupSafPlans<Plan>>): RouteState {
  const query = new URLSearchParams(location.search);
  const blockValue = Number(query.get('block'));
  const block = Number.isInteger(blockValue) && blockValue >= 1 && blockValue <= 7 ? blockValue : null;
  const levelValue = query.get('level');
  const level = levelValue && /^(?:E|T)\d+$/.test(levelValue) ? levelValue : null;
  const planValue = query.get('plan');
  const plan = planValue && catalog.byCode.has(planValue) ? planValue : null;
  const planPlace = plan ? catalog.byCode.get(plan)?.place : null;
  const viewValue = query.get('view');
  const view = views.find((item) => item.id === viewValue)?.id || 'compact';
  return { block: planPlace?.block || block, level: planPlace?.level || level, plan, view };
}

function setRoute(next: RouteState) {
  const query = new URLSearchParams();
  if (next.block) query.set('block', String(next.block));
  if (next.level) query.set('level', next.level);
  if (next.plan) query.set('plan', next.plan);
  if (next.view !== 'compact') query.set('view', next.view);
  history.pushState(null, '', siteUrl(`/saf/chessboard${query.size ? `?${query}` : ''}`));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function areaText(value: number) {
  return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м²`;
}

export function SafChessboard({ plans }: { plans: Plan[] }) {
  const catalog = useMemo(() => groupSafPlans(plans), [plans]);
  const [route, setCurrentRoute] = useState(() => readRoute(catalog));
  const closeRef = useRef<HTMLButtonElement>(null);
  const [rooms, setRooms] = useState<number[]>([]);
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'level' | 'area'>('level');
  useEffect(() => {
    const sync = () => setCurrentRoute(readRoute(catalog));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [catalog]);

  const update = (change: Partial<RouteState>) => setRoute({ ...route, ...change });
  const reset = () => { setRooms([]); setMinArea(''); setMaxArea(''); setSearch(''); setSort('level'); update({ block: null, level: null, plan: null }); };
  const selectedEntry = route.plan ? catalog.byCode.get(route.plan) : undefined;
  const selected = selectedEntry?.plan;
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRoute({ ...readRoute(catalog), plan: null });
      if (event.key !== 'Tab') return;
      const dialog = closeRef.current?.closest('[role="dialog"]');
      const focusable = [...(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, select') || [])];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [selected?.code, catalog]);
  const availableLevels = [...(route.block ? catalog.byBlockLevel.get(route.block)?.keys() || [] : [])].sort(compareSafLevels);
  const filtered = useMemo(() => {
    const min = parseOptionalBound(minArea, 0);
    const max = parseOptionalBound(maxArea, Infinity);
    const q = search.trim().toLocaleLowerCase('ru-RU');
    return catalog.entries.filter(({ plan, place }) =>
      (!route.block || place.block === route.block) && (!route.level || place.level === route.level) &&
      (!rooms.length || rooms.includes(plan.rooms)) && plan.area >= min && plan.area <= max &&
      (!q || plan.code.toLocaleLowerCase('ru-RU').includes(q))
    ).sort((a, b) => sort === 'area'
      ? a.plan.area - b.plan.area || a.plan.code.localeCompare(b.plan.code)
      : a.place.block - b.place.block || compareSafLevels(a.place.level, b.place.level) || a.plan.code.localeCompare(b.plan.code)
    ).map(({ plan }) => plan);
  }, [catalog, route.block, route.level, rooms, minArea, maxArea, search, sort]);
  const board = useMemo(() => {
    const cells = new Map<string, Plan[]>();
    const levels = new Set<string>();
    for (const plan of filtered) {
      const place = catalog.byCode.get(plan.code)!.place;
      const key = `${place.block}/${place.level}`;
      levels.add(place.level);
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(plan);
    }
    return {
      blocks: route.block ? [route.block] : SAF_BLOCKS,
      levels: [...levels].sort((a, b) => {
        if (a.startsWith('E') !== b.startsWith('E')) return a.startsWith('E') ? -1 : 1;
        return a.startsWith('E') ? Number(b.slice(1)) - Number(a.slice(1)) : Number(a.slice(1)) - Number(b.slice(1));
      }),
      cells,
    };
  }, [filtered, route.block, catalog]);

  return <main className="saf-chessboard">
    <div className="saf-breadcrumbs"><a href={siteUrl('/projects')} onClick={(event) => { event.preventDefault(); navigateTo('/projects'); }}>Объекты</a><span>/</span><a href={siteUrl('/saf')} onClick={(event) => { event.preventDefault(); navigateTo('/saf'); }}>SAF Avenue</a><span>/</span><span>Шахматка</span></div>
    <div className="saf-chessboard-heading"><div><span className="saf-kicker">SAF AVENUE / ВЫБОР НА СХЕМЕ</span><h1>Шахматка планировок.</h1><p>Выбирайте блок, уровень и опубликованный вариант. Эта схема составлена по кодам планировок и не показывает расположение, номера или наличие конкретных квартир.</p></div><a href={officialBoard} target="_blank" rel="noopener noreferrer">Официальная шахматка <ArrowUpRight size={18} /></a></div>
    <div className="saf-chessboard-note" role="note"><strong>Добавлен снимок 364 помещений от 28.09.2026.</strong><span>Номера, этажи и статусы на дату проверки доступны отдельно. Постоянная синхронизация наличия пока не подключена.</span><a href={siteUrl('/saf/stock')}>Открыть помещения по этажам →</a></div>
    <div className="saf-chessboard-toolbar"><div className="saf-chessboard-blocks" role="group" aria-label="Выбор блока"><button type="button" className={!route.block ? 'active' : ''} aria-pressed={!route.block} onClick={() => update({ block: null, level: null, plan: null })}>Все блоки</button>{SAF_BLOCKS.map((block) => <button type="button" key={block} className={route.block === block ? 'active' : ''} aria-pressed={route.block === block} onClick={() => update({ block, level: null, plan: null })}>Блок {block}</button>)}</div>
      {route.block && <div className="saf-chessboard-levels" role="group" aria-label="Выбор уровня"><button type="button" className={!route.level ? 'active' : ''} aria-pressed={!route.level} onClick={() => update({ level: null, plan: null })}>Все уровни</button>{availableLevels.map((level) => <button type="button" key={level} className={route.level === level ? 'active' : ''} aria-pressed={route.level === level} onClick={() => update({ level, plan: null })}>{safLevelLabel(level)}</button>)}</div>}
    </div>
    <div className="saf-chessboard-tabs" role="tablist" aria-label="Вид каталога">{views.map(({ id, label }, index) => <button role="tab" aria-selected={route.view === id} tabIndex={route.view === id ? 0 : -1} type="button" key={id} onClick={() => update({ view: id, plan: null })} onKeyDown={(event) => {
      const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : offset ? (index + offset + views.length) % views.length : -1;
      if (next < 0) return;
      event.preventDefault();
      update({ view: views[next].id, plan: null });
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }}>{label}</button>)}</div>
    <div className="saf-chessboard-body"><aside className="saf-chessboard-filters" aria-label="Фильтры"><div className="saf-filter-heading"><span>Параметры</span><button type="button" onClick={reset}><RotateCcw size={15} /> Сбросить</button></div><div className="saf-filter-group"><strong>Комнатность</strong><div className="saf-room-options">{[0, ...SAF_ROOMS].map((count) => <button type="button" key={count} className={count === 0 ? (!rooms.length ? 'selected' : '') : rooms.includes(count) ? 'selected' : ''} aria-pressed={count === 0 ? !rooms.length : rooms.includes(count)} onClick={() => setRooms((current) => count === 0 ? [] : current.includes(count) ? current.filter((room) => room !== count) : [...current, count])}>{count || 'Все'}</button>)}</div></div><div className="saf-filter-group"><strong>Площадь, м²</strong><div className="saf-area-inputs"><label>От<input type="number" min="0" value={minArea} onChange={(event) => setMinArea(event.target.value)} /></label><label>До<input type="number" min="0" value={maxArea} onChange={(event) => setMaxArea(event.target.value)} /></label></div></div><div className="saf-filter-group"><label className="saf-search-label" htmlFor="saf-board-search">Код варианта</label><div className="saf-search"><Search size={17} /><input id="saf-board-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="KV-P1-E2-S1" /></div></div><p>Фильтр цены и наличия появится после подключения подтверждённого реестра.</p></aside>
      <section className="saf-chessboard-content" role="tabpanel"><div className="saf-chessboard-results"><div><span className="saf-kicker">ПУБЛИЧНЫЕ ВАРИАНТЫ</span><h2>{route.view === 'units' ? 'Помещения' : route.view === 'plans' ? 'Планировки' : 'Выбор по уровням'} <small>{route.view === 'units' ? '—' : filtered.length}</small></h2></div>{route.view !== 'units' && <label>Сортировка <select value={sort} onChange={(event) => setSort(event.target.value as 'level' | 'area')}><option value="level">Блок и уровень</option><option value="area">Площадь</option></select></label>}</div>
        {route.view === 'units' ? <div className="saf-chessboard-unavailable"><h3>364 помещения в снимке шахматки</h3><p>348 квартир и 16 коммерческих помещений с секциями, этажами, номерами и статусами на 28.09.2026. Текущее наличие требует проверки.</p><a href={siteUrl(`/saf/stock${route.block ? `?section=${route.block}` : ""}`)}>Открыть снимок помещений <ArrowUpRight size={17} /></a></div> : filtered.length === 0 ? <div className="saf-chessboard-unavailable"><h3>Варианты не найдены</h3><p>Измените фильтры или выберите другой блок и уровень.</p><button type="button" onClick={reset}>Сбросить фильтры</button></div> : route.view === 'plans' ? <div className="saf-chessboard-table-wrap"><table><thead><tr><th>Вариант</th><th>Блок</th><th>Уровень</th><th>Комнат</th><th>Площадь</th><th>Просмотр</th></tr></thead><tbody>{filtered.map((plan) => { const place = catalog.byCode.get(plan.code)!.place; return <tr key={plan.code}><td><button type="button" onClick={() => update({ block: place.block, level: place.level, plan: plan.code })}>{plan.code}</button></td><td>{place.block}</td><td>{safLevelLabel(place.level)}</td><td>{plan.rooms}</td><td>{areaText(plan.area)}</td><td><button type="button" onClick={() => update({ block: place.block, level: place.level, plan: plan.code })}>Открыть <ArrowRight size={15} /></button></td></tr>; })}</tbody></table></div> : <div className={`saf-chessboard-grid ${route.view} ${route.block ? 'single-block' : ''}`}><table className="saf-chessboard-matrix"><thead><tr><th scope="col">Уровень</th>{board.blocks.map((block) => <th scope="col" key={block}>Блок {block}</th>)}</tr></thead><tbody>{board.levels.map((level) => <tr key={level}><th scope="row">{safLevelLabel(level)}</th>{board.blocks.map((block) => <td key={block}><div className="saf-chessboard-cells">{(board.cells.get(`${block}/${level}`) || []).map((plan) => <button type="button" key={plan.code} className={route.plan === plan.code ? 'selected' : ''} aria-pressed={route.plan === plan.code} aria-label={`${plan.code}, ${plan.rooms} комнаты, ${areaText(plan.area)}, наличие уточняется`} title={`${plan.code} · ${areaText(plan.area)} · наличие уточняется`} onClick={() => update({ block, level, plan: plan.code })}><strong>{route.view === 'compact' ? plan.rooms : `${plan.rooms} комн.`}</strong>{route.view === 'expanded' && <><span>{plan.code}</span><small>{areaText(plan.area)}</small></>}</button>)}</div></td>)}</tr>)}</tbody></table></div>}
      </section></div>
    {selected && <div className="saf-chessboard-backdrop" onClick={() => update({ plan: null })}><aside className="saf-chessboard-detail" role="dialog" aria-modal="true" aria-label={`Планировка ${selected.code}`} onClick={(event) => event.stopPropagation()}><button ref={closeRef} type="button" className="saf-chessboard-close" onClick={() => update({ plan: null })} aria-label="Закрыть карточку"><X size={22} /></button><span className="saf-kicker">ВАРИАНТ ПЛАНИРОВКИ</span><h2>{selected.code}</h2><img src={selected.image} alt={`Планировка ${selected.code}`} /><dl><div><dt>Комнатность</dt><dd>{selected.rooms}</dd></div><div><dt>Площадь</dt><dd>{areaText(selected.area)}</dd></div><div><dt>Блок / уровень</dt><dd>{selectedEntry?.place.block} / {safLevelLabel(selectedEntry!.place.level)}</dd></div><div><dt>Номер, цена, статус</dt><dd>Не подключены</dd></div></dl><p>Это опубликованный вариант планировки, а не карточка конкретной квартиры.</p><a href={siteUrl(`/saf/plan/${encodeURIComponent(selected.code)}?from=chessboard`)} onClick={(event) => { event.preventDefault(); navigateTo(`/saf/plan/${encodeURIComponent(selected.code)}?from=chessboard`); }}>Открыть 3D-просмотр <ArrowRight size={17} /></a><a className="saf-chessboard-official" href={officialBoard} target="_blank" rel="noopener noreferrer">Проверить наличие у Sensata <ArrowUpRight size={17} /></a></aside></div>}
    <a className="saf-chessboard-return" href={siteUrl('/saf')} onClick={(event) => { event.preventDefault(); navigateTo('/saf'); }}><ArrowLeft size={16} /> К конфигуратору</a>
  </main>;
}
