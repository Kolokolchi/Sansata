import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Heart, MapPin, Printer, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { safPlans as safData, safHero } from './lib/safMaterials';
import { SafMaterials } from './features/SafMaterials';
import { SafStockSnapshot } from './features/SafStockSnapshot';
import { SafPlanEvidence } from './features/SafPlanEvidence';
import { navigateTo, sitePath, siteUrl } from './lib/site';
import './styles/saf-workspace.css';
import './styles/sensata-home.css';
import { SensataFooter } from './features/SensataFooter';
import sensataLogo from './assets/sensata-logo.png';
import safLogo from './assets/saf-logo.svg';
import safGoldLogo from './assets/saf-logo-gold.svg';
import { SafApartmentViewer } from './features/SafApartmentViewer';
import { SafVisualJourney } from './features/SafVisualJourney';
import { SafApartmentPage } from './features/SafApartmentPage';
import { safApartmentById } from './lib/safInventory';
import './styles/saf-journey.css';
import { SafNavigation } from './features/SafNavigation';
import './styles/saf-selection-shell.css';
import { SafVisualSelector } from './features/SafVisualSelector';
import { SafChessboard } from './features/SafChessboard';
import { SafChessboardShortcut } from './features/SafChessboardShortcut';
import { SafShortlist } from './features/SafShortlist';
import { SafLanding } from './features/SafLanding';
import { groupSafPlans, parseOptionalBound, SAF_BLOCKS, SAF_ROOMS, safLevelLabel } from './lib/safSelection';

type PublishedPlan = (typeof safData.plans)[number];
type SortOrder = 'area-asc' | 'area-desc' | 'rooms';
type ResultView = 'cards' | 'table';

const heroImage = safHero;
const projectAddress = 'Алматы, пр. Аль-Фараби — ул. Розыбакиева';
const projects = [{
  id: 'saf', href: '/saf/avenue', name: 'SAF Avenue', city: 'АЛМАТЫ',
  address: projectAddress, image: heroImage, logo: safLogo,
  note: 'Планировки загружены из публичного каталога SAF Avenue. Наличие и цены проверяются отдельно.',
}];
const savedKey = 'sensata-saf-saved-plans';
const compareKey = 'sensata-saf-compare-plans';
const favoriteApartmentsKey = 'saf-favorite-apartments';
const comparedApartmentsKey = 'saf-compare-apartments';
const pageSize = 18;
const noticeDurationMs = 3200;
const retiredPaths = new Set([
  '/parametric-search', '/visual/free', '/favorite', '/audiogid', '/cloud-tour',
  '/mortgage', '/how-to-buy', '/finishing', '/progress', '/documents', '/location',
  '/contacts', '/privacy', '/policy', '/akcii', '/news'
]);
const retiredPrefixes = ['/visual/section/', '/flat-classic/', '/flat/', '/akcii/', '/news/'];
const safCatalog = groupSafPlans(safData.plans);
const selectionUpdatePrefix = 'saf-selection-update:';
type SelectionUpdate = { key: string; code: string; selected: boolean; time: number };

function isStoredCode(key: string, code: unknown): code is string {
  return typeof code === 'string' && (key === favoriteApartmentsKey || key === comparedApartmentsKey ? safApartmentById.has(code) : safCatalog.byCode.has(code));
}

function readSelectionUpdates(key: string): SelectionUpdate[] {
  const updates: SelectionUpdate[] = [];
  for (const name of Object.keys(localStorage)) {
    if (!name.startsWith(`${selectionUpdatePrefix}${key}:`)) continue;
    try {
      const value = JSON.parse(localStorage.getItem(name) || 'null') as Partial<SelectionUpdate> | null;
      if (value && isStoredCode(key, value.code) && typeof value.selected === 'boolean' && typeof value.time === 'number' && Number.isFinite(value.time)) {
        updates.push({ key: name, code: value.code, selected: value.selected, time: value.time });
      }
    } catch { /* Ignore a malformed pending update without clearing the saved selection. */ }
  }
  return updates.sort((a, b) => a.time - b.time || a.key.localeCompare(b.key));
}

function readCodes(key: string, updates?: SelectionUpdate[]): string[] {
  try {
    let value: unknown = [];
    try { value = JSON.parse(localStorage.getItem(key) || '[]'); } catch { /* Recover corrupt JSON through the next valid update. */ }
    const codes = new Set(Array.isArray(value) ? value.filter((code): code is string => isStoredCode(key, code)) : []);
    for (const update of updates || readSelectionUpdates(key)) {
      if (update.selected) codes.add(update.code); else codes.delete(update.code);
    }
    return [...codes];
  } catch { return []; }
}

function flushStoredCodes(key: string, setCodes: React.Dispatch<React.SetStateAction<string[]>>) {
  const flush = () => {
    try {
      const updates = readSelectionUpdates(key);
      if (!updates.length) return;
      localStorage.setItem(key, JSON.stringify(readCodes(key, updates)));
      for (const update of updates) localStorage.removeItem(update.key);
      setCodes(readCodes(key));
    } catch { /* Pending updates remain durable; unavailable storage leaves selection in memory. */ }
  };
  if (navigator.locks) void navigator.locks.request(`saf-selection:${key}`, flush).catch(flush);
  else flush();
}

function toggleStoredCode(key: string, code: string, setCodes: React.Dispatch<React.SetStateAction<string[]>>) {
  try {
    const selected = !readCodes(key).includes(code);
    const time = Math.max(Date.now(), ...readSelectionUpdates(key).map(update => update.time + 1));
    const updateKey = `${selectionUpdatePrefix}${key}:${time}:${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    // Persist the intent synchronously so reload cannot discard a queued lock request.
    localStorage.setItem(updateKey, JSON.stringify({ code, selected, time }));
    setCodes(readCodes(key));
    flushStoredCodes(key, setCodes);
  } catch {
    setCodes(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
  }
}

function formatArea(area: number): string {
  return `${area.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м²`;
}

function planHref(code: string): string { return `/saf/plan/${encodeURIComponent(code)}`; }

function AppLink({ to, children, className = '', label }: { to: string; children: React.ReactNode; className?: string; label?: string }) {
  return <a className={className} href={siteUrl(to)} aria-label={label} onClick={(event) => {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); navigateTo(to);
    }
  }}>{children}</a>;
}

function PlanCard({ plan, saved, compared, onSave, onCompare }: {
  plan: PublishedPlan; saved: boolean; compared: boolean; onSave: () => void; onCompare: () => void;
}) {
  return <article className="saf-plan-card">
    <div className="saf-plan-card-top"><span>{plan.rooms}-комнатная</span><button type="button" aria-label={`${saved ? 'Убрать из подборки' : 'Добавить в подборку'} ${plan.code}`} onClick={onSave}><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button></div>
    <AppLink to={planHref(plan.code)} className="saf-plan-image" label={`Открыть планировку ${plan.code}`}><img src={plan.image} loading="lazy" alt={`Планировка ${plan.code}`} /></AppLink>
    <div className="saf-plan-card-info"><small>{plan.code}</small><strong>{formatArea(plan.area)}</strong><span>Наличие уточняется</span></div>
    <div className="saf-plan-card-actions"><button type="button" className={compared ? 'selected' : ''} onClick={onCompare}>{compared ? <Check size={16} /> : <span className="saf-plus">+</span>} Сравнить</button><AppLink to={planHref(plan.code)} label={`Подробнее о ${plan.code}`}><ArrowUpRight size={19} /></AppLink></div>
  </article>;
}

export default function App() {
  const [path, setPath] = useState(() => sitePath());
  const [search, setSearch] = useState(() => location.search);
  const [saved, setSaved] = useState<string[]>(() => readCodes(savedKey));
  const [compared, setCompared] = useState<string[]>(() => readCodes(compareKey));
  const [favoriteApartments, setFavoriteApartments] = useState<string[]>(() => readCodes(favoriteApartmentsKey));
  const [comparedApartments, setComparedApartments] = useState<string[]>(() => readCodes(comparedApartmentsKey));
  const [rooms, setRooms] = useState<number[]>([]);
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOrder>('area-asc');
  const [savedOnly, setSavedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [resultView, setResultView] = useState<ResultView>('cards');
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]);
  const [minFloor, setMinFloor] = useState('');
  const [maxFloor, setMaxFloor] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { const onPopState = () => { setPath(sitePath()); setSearch(location.search); }; window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), noticeDurationMs); return () => window.clearTimeout(timeout); }, [notice]);
  useEffect(() => { setVisibleCount(pageSize); }, [rooms, minArea, maxArea, query, sort, savedOnly, selectedBlocks, minFloor, maxFloor]);

  useEffect(() => {
    flushStoredCodes(savedKey, setSaved);
    flushStoredCodes(compareKey, setCompared);
    flushStoredCodes(favoriteApartmentsKey, setFavoriteApartments);
    flushStoredCodes(comparedApartmentsKey, setComparedApartments);
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      const key = event.key?.startsWith(selectionUpdatePrefix) ? event.key.slice(selectionUpdatePrefix.length).split(':')[0] : event.key;
      if (key === null || key === savedKey) setSaved(readCodes(savedKey));
      if (key === null || key === compareKey) setCompared(readCodes(compareKey));
      if (key === null || key === favoriteApartmentsKey) setFavoriteApartments(readCodes(favoriteApartmentsKey));
      if (key === null || key === comparedApartmentsKey) setComparedApartments(readCodes(comparedApartmentsKey));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const normalizedPath = path.replace(/\/$/, '') || '/';
  const isRoot = normalizedPath === '/' || normalizedPath === '/index.html';
  const isLegacyTourEntry = isRoot && new URLSearchParams(search).get('view') === '360';
  const isHome = normalizedPath === '/projects' || (isRoot && !isLegacyTourEntry);
  const isFavorites = normalizedPath === '/saf/favorites';
  const isCompare = normalizedPath === '/saf/compare';
  const isLanding = normalizedPath === '/saf/avenue';
  const isVisualEntry = normalizedPath === '/visual' || isLegacyTourEntry;
  let planCode = '';
  if (normalizedPath.startsWith('/saf/plan/')) {
    try { planCode = decodeURIComponent(normalizedPath.slice('/saf/plan/'.length)); } catch { planCode = ''; }
  }
  let apartmentId = '';
  if (normalizedPath.startsWith('/saf/apartment/')) { try { apartmentId = decodeURIComponent(normalizedPath.slice('/saf/apartment/'.length)); } catch { /* Malformed link stays not found. */ } }
  const selectedApartment = safApartmentById.get(apartmentId);
  const selectedPlan = safCatalog.byCode.get(planCode)?.plan;
  const selectedLocation = selectedPlan ? safCatalog.byCode.get(selectedPlan.code)?.place : null;
  const detailSource = new URLSearchParams(location.search).get('from');
  const returnQuery = new URLSearchParams(location.search);
  const returnSection = returnQuery.get('section');
  const returnFloor = returnQuery.get('floor');
  const detailBack = detailSource === 'visual' && /^[1-7]$/.test(returnSection || '') && /^\d+$/.test(returnFloor || '') ? `/saf/visual/block/${returnSection}/floor/${returnFloor}` : detailSource === 'chessboard' ? '/saf/chessboard' : selectedLocation && detailSource === 'visual'
    ? `/saf/visual/block/${selectedLocation.block}/level/${selectedLocation.level}` : '/saf';
  const visualMatch = /^\/saf\/visual(?:\/block\/([1-7]))?(?:\/(?:level\/([ET]\d+)|floor\/(\d+)))?$/.exec(normalizedPath);
  const isVisual = isVisualEntry || !!visualMatch;
  const isChessboard = normalizedPath === '/saf/chessboard';
  const isMaterials = normalizedPath === '/saf/materials';
  const isStock = normalizedPath === '/saf/stock';
  const visualBlock = visualMatch?.[1] ? Number(visualMatch[1]) : null;
  const visualLevel = visualMatch?.[2] || null;
  const isLegacy = retiredPaths.has(normalizedPath) || retiredPrefixes.some((prefix) => normalizedPath.startsWith(prefix));
  const isTour = normalizedPath === '/tour';
  const isNotFound = !isFavorites && !isCompare && !isHome && !isLanding && normalizedPath !== '/saf' && !isVisual && !isChessboard && !isMaterials && !isStock && !selectedPlan && !selectedApartment && !isLegacy && !isTour;
  useEffect(() => {
    document.title = isFavorites ? 'Избранное · SAF Avenue' : isCompare ? 'Сравнение · SAF Avenue' : isLanding ? 'SAF Avenue · Привилегия приватной жизни' : isHome ? 'Выбор объекта | Sensata' : isNotFound ? 'Страница не найдена | Sensata'
      : selectedApartment ? `Квартира № ${selectedApartment.number} · SAF Avenue` : isMaterials ? 'Материалы проекта · SAF Avenue' : isStock ? 'Снимок помещений · SAF Avenue' : selectedPlan ? `${selectedPlan.code} · SAF Avenue | Sensata` : 'SAF Avenue · Конфигуратор планировок | Sensata';
  }, [isFavorites, isCompare, isLanding, isHome, isNotFound, isMaterials, isStock, selectedPlan, selectedApartment]);
  const filtered = useMemo(() => {
    const lower = parseOptionalBound(minArea, 0);
    const upper = parseOptionalBound(maxArea, Number.POSITIVE_INFINITY);
    const firstFloor = parseOptionalBound(minFloor, 0);
    const lastFloor = parseOptionalBound(maxFloor, Number.POSITIVE_INFINITY);
    const text = query.trim().toLowerCase();
    const savedCodes = new Set(saved);
    const chosenRooms = new Set(rooms);
    const chosenBlocks = new Set(selectedBlocks);
    return safCatalog.entries.filter(({ plan, place }) => {
      const floor = place.level.startsWith('E') ? Number(place.level.slice(1)) : null;
      return (!rooms.length || chosenRooms.has(plan.rooms)) && plan.area >= lower && plan.area <= upper &&
        (!text || plan.code.toLowerCase().includes(text)) && (!savedOnly || savedCodes.has(plan.code)) &&
        (!selectedBlocks.length || chosenBlocks.has(place.block)) &&
        ((!minFloor && !maxFloor) || (floor !== null && floor >= firstFloor && floor <= lastFloor));
    }).map(({ plan }) => plan).sort((a, b) => sort === 'area-desc' ? b.area - a.area : sort === 'rooms' ? a.rooms - b.rooms || a.area - b.area : a.area - b.area);
  }, [rooms, minArea, maxArea, query, sort, savedOnly, saved, selectedBlocks, minFloor, maxFloor]);

  const toggleSaved = (code: string) => toggleStoredCode(savedKey, code, setSaved);
  const toggleCompared = (code: string) => toggleStoredCode(compareKey, code, setCompared);
  const toggleFavoriteApartment = (id: string) => toggleStoredCode(favoriteApartmentsKey, id, setFavoriteApartments);
  const toggleComparedApartment = (id: string) => toggleStoredCode(comparedApartmentsKey, id, setComparedApartments);
  const resetFilters = () => { setRooms([]); setMinArea(''); setMaxArea(''); setQuery(''); setSort('area-asc'); setSavedOnly(false); setSelectedBlocks([]); setMinFloor(''); setMaxFloor(''); };
  const copyPlanLink = async (code: string) => {
    try { await navigator.clipboard.writeText(new URL(siteUrl(planHref(code)), location.origin).href); setNotice('Ссылка на планировку скопирована.'); }
    catch { setNotice('Скопируйте адрес страницы из браузера.'); }
  };

  return <div className={`saf-app${isHome ? ' sensata-home-page' : ''}${isChessboard ? ' sensata-chessboard-page' : ''}${isVisual && !visualLevel ? ' saf-journey-page' : ''}`}>
    {isHome ? <header className="sensata-header"><AppLink to="/" label="К выбору объектов"><img src={sensataLogo} alt="Sensata Group" /></AppLink><nav aria-label="Основная навигация"><a href="#projects" className="active">Наши проекты</a><a href="https://www.sensata.kz/contacts" target="_blank" rel="noopener noreferrer">Контакты</a></nav><a className="sensata-header-phone" href="tel:700"><strong>700</strong><span>Единый колл-центр<br />(отдел продаж)</span></a></header> : <header className="saf-header">
      <AppLink to="/" className="saf-brand" label="На главную"><img className="saf-company-logo" src={sensataLogo} alt="Sensata Group" /></AppLink>
      <SafNavigation path={normalizedPath} favoriteCount={saved.length + favoriteApartments.length} compareCount={compared.length + comparedApartments.length} />
      <AppLink to="/saf/avenue" className="saf-header-project" label="SAF Avenue"><img src={safGoldLogo} alt="SAF Avenue" /></AppLink>
    </header>}

    {isFavorites || isCompare ? <SafShortlist mode={isCompare ? 'compare' : 'favorites'} saved={saved} compared={compared} favoriteApartments={favoriteApartments} comparedApartments={comparedApartments} onSave={toggleSaved} onCompare={toggleCompared} onFavoriteApartment={toggleFavoriteApartment} onCompareApartment={toggleComparedApartment} /> : isLanding ? <SafLanding /> : isHome ? <main className="saf-home" id="projects">
      <div className="saf-home-intro"><span className="saf-kicker">НАШИ ПРОЕКТЫ</span><h1>Выберите объект<span>.</span></h1><p>Найдите пространство для своей жизни.<br />Выберите проект и познакомьтесь с его планировками.</p><div className="saf-home-count"><strong>{String(projects.length).padStart(2, '0')}</strong><span>{projects.length === 1 ? 'объект' : 'объектов'} в рабочем пространстве</span></div></div>
      <div className={`saf-project-grid${projects.length > 1 ? ' multi' : ''}`}>{projects.map((project, index) => <div className="saf-project-entry" key={project.id}><AppLink to={project.href} className="saf-project-card"><div className="saf-project-photo" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,24,27,.72), rgba(13,24,27,.06)), url(${project.image})` }} /><div className="saf-project-content"><span className="saf-project-index">{String(index + 1).padStart(2, '0')} / {project.city}</span><div><img className="saf-project-logo" src={project.logo} alt={project.name} /><h2>{project.name}</h2><p><MapPin size={17} /> {project.address}</p></div><span className="saf-project-open">Открыть проект <ArrowUpRight size={21} /></span></div></AppLink><p className="saf-home-footnote">{project.note}</p></div>)}</div>
    </main> : selectedApartment ? <SafApartmentPage key={selectedApartment.id} unit={selectedApartment} favorite={favoriteApartments.includes(selectedApartment.id)} compared={comparedApartments.includes(selectedApartment.id)} onFavorite={() => toggleFavoriteApartment(selectedApartment.id)} onCompare={() => toggleComparedApartment(selectedApartment.id)} /> : isVisual && !visualLevel ? <SafVisualJourney section={visualBlock ? String(visualBlock) : null} floor={visualMatch?.[3] ? Number(visualMatch[3]) : null} /> : isMaterials ? <SafMaterials /> : isStock ? <SafStockSnapshot /> : selectedPlan ? <main className="saf-detail">
      <div className="saf-breadcrumbs"><AppLink to="/projects">Объекты</AppLink><span>/</span><AppLink to="/saf">SAF Avenue</AppLink><span>/</span><span>{selectedPlan.code}</span></div>
      <div className="saf-detail-heading"><AppLink to={detailBack} className="saf-back"><ArrowLeft size={18} /> К планировкам</AppLink><span className="saf-kicker">SAF AVENUE / КАРТОЧКА ПЛАНИРОВКИ</span><h1>{selectedPlan.rooms}-комнатная планировка</h1><p>Код в публичном каталоге: {selectedPlan.code}</p>{selectedLocation && <div className="saf-detail-context"><AppLink to={`/saf/visual/block/${selectedLocation.block}/level/${selectedLocation.level}`}>На {safLevelLabel(selectedLocation.level).toLowerCase()} · блок {selectedLocation.block}</AppLink><AppLink to="/saf/visual">На 3D-схеме блоков</AppLink><AppLink to="/saf">По параметрам</AppLink></div>}</div>
      <div className="saf-detail-grid"><SafApartmentViewer key={selectedPlan.code} code={selectedPlan.code} rooms={selectedPlan.rooms} image={selectedPlan.image} /><aside className="saf-detail-panel"><span className="saf-panel-kicker">ПАРАМЕТРЫ</span><div className="saf-detail-fact"><span>Комнат</span><strong>{selectedPlan.rooms}</strong></div><div className="saf-detail-fact"><span>Общая площадь</span><strong>{formatArea(selectedPlan.area)}</strong></div><div className="saf-detail-fact"><span>Код планировки</span><strong>{selectedPlan.code}</strong></div><div className="saf-detail-availability"><span className="saf-status-dot" /> Наличие и цена уточняются</div><p>Это планировка из публичного каталога. Карточка не подтверждает наличие конкретной квартиры.</p><div className="saf-detail-actions"><button type="button" onClick={() => toggleSaved(selectedPlan.code)}><Heart size={18} fill={saved.includes(selectedPlan.code) ? 'currentColor' : 'none'} />{saved.includes(selectedPlan.code) ? 'В подборке' : 'В подборку'}</button><button type="button" onClick={() => toggleCompared(selectedPlan.code)}><Check size={18} />{compared.includes(selectedPlan.code) ? 'Убрать из сравнения' : 'Сравнить'}</button><button type="button" onClick={() => copyPlanLink(selectedPlan.code)}><Copy size={18} />Скопировать ссылку</button><button type="button" onClick={() => window.print()}><Printer size={18} />Печать</button></div>{compared.includes(selectedPlan.code) && <AppLink to="/saf/compare" className="saf-source-link">Смотреть сравнение <ArrowRight size={16} /></AppLink>}<a className="saf-source-link" href="https://saf.sensata.kz/quiz" target="_blank" rel="noopener noreferrer">Открыть официальный каталог <ArrowUpRight size={16} /></a></aside></div>
      <SafPlanEvidence code={selectedPlan.code} />
    </main> : isChessboard ? <SafChessboard plans={safData.plans} /> : isTour ? <main className="saf-detail"><div className="saf-breadcrumbs"><AppLink to="/saf">SAF Avenue · Все планировки</AppLink></div><h1>3D-просмотр квартиры</h1><p>Исследуйте интерьер и переключайте ракурсы. Для выбора планировки откройте конфигуратор.</p><SafApartmentViewer code="demo" rooms={2} image={safData.plans[0].image} /></main> : isLegacy ? <main className="saf-legacy"><span className="saf-kicker">SENSATA / РАБОЧЕЕ ПРОСТРАНСТВО</span><h1>Раздел обновлён.</h1><p>Перейдите к подбору планировок SAF Avenue.</p><AppLink to="/saf" className="saf-primary-link">Открыть конфигуратор <ArrowRight size={18} /></AppLink></main> : (normalizedPath === '/saf' || isVisual) ? <main className="saf-workspace">
      <div className="saf-breadcrumbs"><AppLink to="/projects">Объекты</AppLink><span>/</span><span>SAF Avenue</span></div>
      <div className="saf-selection-heading" id="saf-catalog"><div><span className="saf-kicker">SAF AVENUE / ВЫБОР КВАРТИРЫ</span><h1>{isVisual ? 'Квартиры на 3D-плане' : 'Поиск квартир по параметрам'}</h1></div><p>Актуальное наличие и цены уточняются</p></div>
      <div className="saf-mode-switch" role="navigation" aria-label="Способ выбора планировки"><AppLink to="/saf/visual" className={isVisual ? 'active' : ''}>На 3D-плане</AppLink><AppLink to="/saf" className={!isVisual ? 'active' : ''}>По параметрам</AppLink></div>
      {isVisual ? <SafVisualSelector plans={safData.plans} block={visualBlock} level={visualLevel} floor={visualMatch?.[3] ? Number(visualMatch[3]) : null} /> : <div className="saf-configurator"><aside className="saf-filters" aria-label="Фильтры планировок"><div className="saf-filter-heading"><span><SlidersHorizontal size={18} /> Параметры</span><button type="button" onClick={resetFilters}><RotateCcw size={15} /> Сбросить</button></div><div className="saf-filter-group"><strong>Комнат</strong><div className="saf-room-options">{[0, ...SAF_ROOMS].map((value) => <button type="button" key={value} className={value === 0 ? (rooms.length === 0 ? 'selected' : '') : (rooms.includes(value) ? 'selected' : '')} aria-pressed={value === 0 ? rooms.length === 0 : rooms.includes(value)} onClick={() => setRooms((current) => value === 0 ? [] : current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}>{value || 'Все'}</button>)}</div></div><div className="saf-filter-group"><strong>Площадь, м²</strong><div className="saf-area-inputs"><label>От<input inputMode="decimal" type="number" min="0" value={minArea} onChange={(event) => setMinArea(event.target.value)} placeholder="0" /></label><label>До<input inputMode="decimal" type="number" min="0" value={maxArea} onChange={(event) => setMaxArea(event.target.value)} placeholder="∞" /></label></div></div><div className="saf-filter-group"><label className="saf-search-label" htmlFor="saf-code-search">Код планировки</label><div className="saf-search"><Search size={17} /><input id="saf-code-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, KV-P1" /></div></div><button type="button" className="saf-advanced-toggle" aria-expanded={advancedFilters} onClick={() => setAdvancedFilters((value) => !value)}>{advancedFilters ? 'Простой фильтр' : 'Расширенный фильтр'}</button>{advancedFilters && <div className="saf-advanced-fields"><strong>Блок</strong><div className="saf-block-filters">{SAF_BLOCKS.map((number) => <label key={number}><input type="checkbox" checked={selectedBlocks.includes(number)} onChange={() => setSelectedBlocks((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number])} />{number}</label>)}</div><strong>Этаж (коды E)</strong><div className="saf-area-inputs"><label>От<input aria-label="Этаж от" type="number" min="1" value={minFloor} onChange={(event) => setMinFloor(event.target.value)} placeholder="—" /></label><label>До<input aria-label="Этаж до" type="number" min="1" value={maxFloor} onChange={(event) => setMaxFloor(event.target.value)} placeholder="—" /></label></div><p>Цена и особенности не фильтруются: проверенных данных SAF для них нет.</p></div>}<label className="saf-saved-filter"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} /><Heart size={17} /> Только подборка <span>{saved.length}</span></label><p className="saf-filter-note">Планы из открытого каталога не являются подтверждённым реестром квартир.</p></aside>
        <section className="saf-results" aria-label="Результаты подбора">
          <div className="saf-results-head"><div><span className="saf-kicker">ПОДБОР</span><h2>Планировки <span>{filtered.length}</span></h2></div><div className="saf-results-tools"><label>Сортировка<select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}><option value="area-asc">Площадь: по возрастанию</option><option value="area-desc">Площадь: по убыванию</option><option value="rooms">Комнатность</option></select></label><div className="saf-result-view" role="group" aria-label="Вид результатов"><button type="button" aria-pressed={resultView === 'table'} onClick={() => setResultView('table')}>Таблица</button><button type="button" aria-pressed={resultView === 'cards'} onClick={() => setResultView('cards')}>Карточки</button></div></div></div>
          {filtered.length ? <>{resultView === 'cards' ? <div className="saf-plan-grid">{filtered.slice(0, visibleCount).map((plan) => <PlanCard key={plan.code} plan={plan} saved={saved.includes(plan.code)} compared={compared.includes(plan.code)} onSave={() => toggleSaved(plan.code)} onCompare={() => toggleCompared(plan.code)} />)}</div> : <div className="saf-plan-table-wrap"><table className="saf-plan-table"><thead><tr><th>Планировка</th><th>Блок</th><th>Уровень</th><th>Комнат</th><th>Площадь</th><th>Наличие</th><th>Действия</th></tr></thead><tbody>{filtered.slice(0, visibleCount).map((plan) => { const codeLocation = safCatalog.byCode.get(plan.code)?.place; return <tr key={plan.code}><td><AppLink to={planHref(plan.code)}><img src={plan.image} alt="" loading="lazy" /><span>{plan.code}</span></AppLink></td><td>{codeLocation ? `P${codeLocation.block}` : '—'}</td><td>{codeLocation ? safLevelLabel(codeLocation.level) : '—'}</td><td>{plan.rooms}</td><td>{formatArea(plan.area)}</td><td>Уточняется</td><td><button type="button" aria-label={`${saved.includes(plan.code) ? 'Убрать из подборки' : 'Добавить в подборку'} ${plan.code}`} onClick={() => toggleSaved(plan.code)}><Heart size={17} fill={saved.includes(plan.code) ? 'currentColor' : 'none'} /></button><button type="button" aria-label={`${compared.includes(plan.code) ? 'Убрать из сравнения' : 'Сравнить'} ${plan.code}`} onClick={() => toggleCompared(plan.code)}>{compared.includes(plan.code) ? <Check size={17} /> : '+'}</button></td></tr>; })}</tbody></table></div>}{visibleCount < filtered.length && <button type="button" className="saf-load-more" onClick={() => setVisibleCount((count) => count + pageSize)}>Показать ещё <span>{Math.min(visibleCount, filtered.length)} из {filtered.length}</span><ArrowRight size={17} /></button>}</> : <div className="saf-empty"><h3>Планировки не найдены</h3><p>Измените параметры или сбросьте фильтры.</p><button type="button" onClick={resetFilters}>Сбросить фильтры</button></div>}
        </section>
      </div>}
      {compared.length > 0 && <div className="saf-compare-bar"><div><strong>Сравнение</strong><span>Выбрано планировок: {compared.length}</span></div><div className="saf-compare-codes">{compared.slice(0, 3).map((code) => <span key={code}>{code}<button type="button" onClick={() => toggleCompared(code)} aria-label={`Убрать ${code} из сравнения`}><X size={14} /></button></span>)}{compared.length > 3 && <span>Ещё {compared.length - 3}</span>}</div><button type="button" onClick={() => navigateTo('/saf/compare')}>Смотреть сравнение <ArrowRight size={17} /></button></div>}
    </main> : <main className="saf-legacy"><span className="saf-kicker">SENSATA / РАБОЧЕЕ ПРОСТРАНСТВО</span><h1>Страница не найдена.</h1><p>Проверьте адрес или откройте каталог планировок SAF Avenue.</p><AppLink to="/saf" className="saf-primary-link">Открыть конфигуратор <ArrowRight size={18} /></AppLink></main>}
    {!isChessboard && <SafChessboardShortcut />}
    {isHome ? <SensataFooter /> : <footer className="saf-footer"><span>© Sensata · SAF Avenue</span><span>Планировочные материалы: <a href="https://saf.sensata.kz/quiz" target="_blank" rel="noopener noreferrer">официальный каталог SAF Avenue</a></span></footer>}
    {notice && <div className="saf-toast" role="status">{notice}</div>}
  </div>;
}
