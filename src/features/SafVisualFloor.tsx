import snapshot from '../data/saf-stock-snapshot.json';
import { brochurePage, floorSheets } from '../lib/safBrochures';
import { safPlans } from '../lib/safMaterials';
import { navigateTo, siteUrl } from '../lib/site';

const statusLabels: Record<string, string> = { available: 'Свободно', sold: 'Продано', reserved: 'Бронь', unknown: 'Неизвестно' };
export const residentialObservations = snapshot.observations.filter(item => item.kind === 'residential');
const plans = new Map(safPlans.plans.map(plan => [plan.code, plan]));

export function SelectionLink({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return <a className={className} href={siteUrl(to)} onClick={event => {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) { event.preventDefault(); navigateTo(to); }
  }}>{children}</a>;
}

export function SafVisualFloor({ block, floor }: { block: number; floor: number | null }) {
  const units = residentialObservations.filter(item => item.section === String(block));
  const floors = [...new Set(units.map(item => item.floor))].sort((a, b) => b - a);
  const valid = floor !== null && floors.includes(floor);
  const selected = units.filter(item => item.floor === floor);
  const sheets = floorSheets.filter(sheet => sheet.blocks.includes(block));
  const exact = sheets.find(sheet => sheet.label.endsWith(`· ${floor} этаж`));
  const sheet = exact || sheets.find(item => item.label.includes('типовой'));
  return <div className="saf-visual-content" id="saf-floor-selection">
    <aside className="saf-visual-levels"><div className="saf-visual-subhead"><h3>Секция {block}</h3><span>{units.length} квартир в снимке</span></div><p>Выберите этаж</p>
      <div className="saf-level-list" role="group" aria-label={`Этажи секции ${block}`}>{floors.map(value => <SelectionLink key={value} to={`/saf/visual/block/${block}/floor/${value}`} className={floor === value ? 'active' : ''}>Этаж {value}<span>{units.filter(item => item.floor === value).length}</span></SelectionLink>)}</div>
      <p>Количество квартир по снимку от 28.09.2026, включая проданные.</p>
    </aside>
    <div className="saf-visual-plans">{valid ? <>
      <div className="saf-visual-subhead"><h3>Этаж {floor}</h3><span>{selected.length} квартир в снимке</span></div>
      <p className="saf-visual-disclaimer">Статусы на 28.09.2026. Актуальное наличие уточняется. Список квартир связан с секцией и этажом по данным источника; интерактивные контуры не опубликованы.</p>
      <div className="saf-floor-layout">{sheet && <SelectionLink className="saf-visual-floor-sheet" to={`/saf/materials?tab=brochure&document=residential&page=${sheet.page}`}><img src={brochurePage('residential', sheet.page)} alt={sheet.label} /><span>{sheet.label}{!exact ? ' · справочная схема, привязка к этому этажу не подтверждена' : ''} · Увеличить ↗</span></SelectionLink>}
      <div className="saf-floor-units">{selected.map(unit => {
        const plan = unit.planCode ? plans.get(unit.planCode) : undefined;
        const href = plan ? `/saf/plan/${encodeURIComponent(plan.code)}?from=visual&section=${block}&floor=${floor}` : `/saf/stock?section=${block}&floor=${floor}&unit=${encodeURIComponent(unit.id)}`;
        return <article className="saf-floor-unit" key={unit.id}>{plan && <SelectionLink to={href}><img src={plan.image} alt={`План квартиры № ${unit.number}`} loading="lazy" /></SelectionLink>}<strong>№ {unit.number} · {unit.rooms}-комнатная</strong><span>{unit.area.toLocaleString('ru-RU')} м²</span><small>{statusLabels[unit.observedStatus]} на 28.09.2026</small>{!plan && <small>Связь с изображением планировки не опубликована.</small>}<SelectionLink to={href}>{plan ? 'Планировка и конструктор' : 'Данные квартиры'} ↗</SelectionLink></article>;
      })}</div></div>
    </> : <div className="saf-visual-prompt"><h3>{floor === null ? `Выберите этаж секции ${block}` : 'Этаж отсутствует в снимке'}</h3><p>Откроются официальная схема и квартиры с номерами и площадями из источника.</p></div>}</div>
  </div>;
}
