import { useEffect, useMemo, useState } from 'react';
import { safApartmentPath } from '../lib/safInventory';
import snapshot from '../data/saf-stock-snapshot.json';
import { navigateTo, siteUrl } from '../lib/site';
import { safPlans } from '../lib/safMaterials';
import '../styles/saf-materials.css';

const labels: Record<string, string> = { available: 'Свободно', reserved: 'Бронь', sold: 'Продано', unknown: 'Неизвестно' };
const plans = new Map(safPlans.plans.map(plan => [plan.code, plan]));
const sections = [...new Set(snapshot.observations.map(item => item.section))].sort((a, b) => Number(a) - Number(b));
const observedDate = new Date(snapshot.observedAt).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty', dateStyle: 'short', timeStyle: 'short' });
function readFilters() {
  const query = new URLSearchParams(location.search);
  return { section: query.get('section') || '', floor: query.get('floor') || '', status: query.get('status') || '', kind: query.get('kind') || '', search: query.get('search') || '', view: query.get('view') === 'table' ? 'table' : 'board' };
}

export function SafStockSnapshot() {
  const [filters, setFilters] = useState(readFilters);
  useEffect(() => { const sync = () => setFilters(readFilters()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  const update = (change: Partial<typeof filters>) => {
    const next = { ...filters, ...change };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
    history.pushState(null, '', siteUrl(`/saf/stock?${query}`));
    setFilters(next);
  };
  const filtered = useMemo(() => snapshot.observations.filter(item =>
    (!filters.section || item.section === filters.section) && (!filters.floor || item.floor === Number(filters.floor)) &&
    (!filters.status || item.observedStatus === filters.status) && (!filters.kind || item.kind === filters.kind) &&
    (!filters.search || `${item.number} ${item.planCode || ''}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [filters]);
  const floors = [...new Set(snapshot.observations.filter(item => !filters.section || item.section === filters.section).map(item => item.floor))].sort((a, b) => b - a);
  const columns = filters.section ? sections.filter(section => section === filters.section) : sections;
  const rows = filters.floor ? floors.filter(floor => floor === Number(filters.floor)) : floors;
  const cells = new Map<string, typeof filtered>();
  for (const item of filtered) { const key = `${item.section}/${item.floor}`; const cell = cells.get(key) || []; cell.push(item); cells.set(key, cell); }
  const selectedId = new URLSearchParams(location.search).get('unit');
  const selected = snapshot.observations.find(item => item.id === selectedId);
  const [open, setOpen] = useState(selected?.id || '');
  useEffect(() => { setOpen(selected?.id || ''); }, [selected?.id]);
  const detail = snapshot.observations.find(item => item.id === open);
  const detailPlan = detail?.planCode ? plans.get(detail.planCode) : undefined;
  useEffect(() => { if (open) document.querySelector('.saf-stock-detail')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [open]);
  const show = (id: string) => { const query = new URLSearchParams(location.search); query.set('unit', id); history.pushState(null, '', siteUrl(`/saf/stock?${query}`)); setOpen(id); };
  return <main className="saf-materials saf-stock">
    <a className="saf-material-back" href={siteUrl('/saf/chessboard')} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); navigateTo('/saf/chessboard'); } }}>← К планировкам и конструктору</a>
    <div className="saf-material-heading"><div><span className="saf-kicker">SAF AVENUE / СНИМОК ШАХМАТКИ</span><h1>Помещения по этажам.</h1><p>Секции, этажи и номера из публичной шахматки застройщика.</p></div><a href="https://saf.sensata.kz/avenue" target="_blank" rel="noopener noreferrer">Проверить у застройщика ↗</a></div>
    <div className="saf-source-notice"><strong>Снимок на {observedDate} (Алматы). Не актуальное наличие.</strong><p>Статусы и цены ниже зафиксированы на дату проверки. Текущее наличие и стоимость требуют подтверждения. Это не бронирование. Секция 8 содержит коммерческие помещения; жилые квартиры находятся в секциях 1–7.</p></div>
    <div className="saf-stock-summary"><span><b>348</b> квартир</span><span><b>16</b> коммерческих помещений</span><span><b>276</b> свободно в снимке</span><span><b>86</b> продано</span><span><b>2</b> в брони</span></div>
    <div className="saf-stock-filters">
      <label>Секция<select aria-label="Секция" value={filters.section} onChange={event => update({ section: event.target.value, floor: '' })}><option value="">Все секции</option>{sections.map(section => <option key={section}>{section}</option>)}</select></label>
      <label>Этаж<select aria-label="Этаж" value={filters.floor} onChange={event => update({ floor: event.target.value })}><option value="">Все этажи</option>{floors.map(floor => <option key={floor}>{floor}</option>)}</select></label>
      <label>Тип помещения<select aria-label="Тип помещения" value={filters.kind} onChange={event => update({ kind: event.target.value })}><option value="">Все помещения</option><option value="residential">Квартиры</option><option value="commercial">Коммерческие</option></select></label>
      <label>Статус в снимке<select aria-label="Статус в снимке" value={filters.status} onChange={event => update({ status: event.target.value })}><option value="">Все статусы</option>{Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label>Номер или код<input aria-label="Номер или код" type="search" value={filters.search} onChange={event => update({ search: event.target.value })} /></label>
    </div>
    <div className="saf-material-toolbar"><strong aria-live="polite">Найдено: {filtered.length}</strong><button type="button" onClick={() => update({ section: '', floor: '', kind: '', status: '', search: '' })}>Сбросить</button><button type="button" aria-pressed={filters.view === 'board'} onClick={() => update({ view: 'board' })}>По этажам</button><button type="button" aria-pressed={filters.view === 'table'} onClick={() => update({ view: 'table' })}>Таблица</button></div>
    <div className="saf-stock-legend">Статус на дату снимка: {Object.entries(labels).map(([status, label]) => <span key={status}><i className={status} />{label}</span>)}</div>
    {!filtered.length ? <p role="status">Помещений с такими параметрами в снимке нет.</p> : <div className="saf-stock-scroll" tabIndex={0} role="region" aria-label="Помещения по секциям и этажам">
      {filters.view === 'board' ? <table className="saf-stock-matrix"><thead><tr><th>Этаж</th>{columns.map(section => <th key={section}>Секция {section}</th>)}</tr></thead><tbody>{rows.map(floor => <tr key={floor}><th scope="row">{floor}</th>{columns.map(section => <td key={section}><div>{(cells.get(`${section}/${floor}`) || []).map(item => <button type="button" key={item.id} className={item.observedStatus} onClick={() => show(item.id)} aria-label={`Секция ${section}, этаж ${floor}, № ${item.number}, ${labels[item.observedStatus]} на дату снимка`} title={`№ ${item.number} · ${item.rooms} комн. · ${item.area} м² · ${labels[item.observedStatus]} на дату снимка`}><b>№ {item.number}</b><span>{item.kind === 'commercial' ? 'НП' : `${item.rooms}к`} · {item.area} м²</span></button>)}</div></td>)}</tr>)}</tbody></table> : <table className="saf-stock-table"><thead><tr><th>№</th><th>Секция</th><th>Этаж</th><th>Тип</th><th>Комнат</th><th>м²</th><th>Статус в снимке</th><th>Цена в снимке, ₸</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><button type="button" onClick={() => show(item.id)}>{item.number}</button></td><td>{item.section}</td><td>{item.floor}</td><td>{item.kind === 'commercial' ? 'НП' : 'Квартира'}</td><td>{item.rooms}</td><td>{item.area}</td><td>{labels[item.observedStatus]}</td><td>{item.observedPrice?.toLocaleString('ru-RU') || 'Не опубликована'}</td></tr>)}</tbody></table>}
    </div>}
    <p className="saf-material-note">Положение ячейки — место в шахматке, а не контур квартиры на плане этажа. Схемы этажей доступны в <a href={siteUrl('/saf/materials?tab=floors')}>материалах проекта</a>.</p>
    {detail && <section className="saf-stock-detail" aria-label={`Помещение № ${detail.number}`}><div><span className="saf-kicker">СЕКЦИЯ {detail.section} / ЭТАЖ {detail.floor}</span><h2>{detail.kind === 'commercial' ? 'Помещение' : 'Квартира'} № {detail.number}</h2><p>{detail.rooms} комн. · {detail.area} м²</p><p><strong>{labels[detail.observedStatus]}</strong> на {observedDate}</p><p>Цена в снимке: {detail.observedPrice ? `${detail.observedPrice.toLocaleString('ru-RU')} ₸` : 'не опубликована'}</p><p>Текущее наличие и цена уточняются.</p>{detail.kind === 'residential' && <p><a className="saf-primary-link" href={siteUrl(safApartmentPath(detail.id))}>Карточка квартиры · все виды →</a></p>}{detailPlan ? <a className="saf-primary-link" href={siteUrl(`/saf/plan/${detailPlan.code}`)}>Открыть планировку в конструкторе →</a> : <p>Связанный план в опубликованной выборке не найден. Совпадение площади не подтверждает планировку.</p>}</div>{detailPlan && <img src={detailPlan.image} alt={`Планировка ${detailPlan.code}`} />}</section>}
  </main>;
}
