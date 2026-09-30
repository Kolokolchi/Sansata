import { SafVisualFloor, residentialObservations } from './SafVisualFloor';
import { safMediaUrl } from '../lib/safMaterials';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { compareSafLevels, groupSafPlans, SAF_BLOCKS, SAF_ROOMS, safLevelLabel } from '../lib/safSelection';
import { navigateTo, siteUrl } from '../lib/site';

type Plan = { code: string; rooms: number; area: number; image: string };

function selectVisualPath(to: string) {
  history.pushState(null, '', siteUrl(to));
  window.dispatchEvent(new PopStateEvent('popstate'));
  document.querySelector('.saf-mode-switch')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function VisualLink({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return <a href={siteUrl(to)} className={className} onClick={(event) => {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      if (to.startsWith('/saf/visual')) selectVisualPath(to);
      else navigateTo(to);
    }
  }}>{children}</a>;
}

export function SafVisualSelector({ plans, block, level, floor }: { plans: Plan[]; block: number | null; level: string | null; floor: number | null }) {
  const [angle, setAngle] = useState(0);
  const [rooms, setRooms] = useState<number[]>([]);
  const catalog = useMemo(() => groupSafPlans(plans), [plans]);
  const blocks = SAF_BLOCKS.map((number) => ({ number, plans: catalog.byBlock.get(number) || [] }));
  const blockPlans = block ? catalog.byBlock.get(block) || [] : [];
  const blockLevels = block ? catalog.byBlockLevel.get(block) : undefined;
  const levels = [...(blockLevels?.keys() || [])].sort(compareSafLevels);
  const activeLevel = level && levels.includes(level) ? level : null;
  const levelPlans = activeLevel ? blockLevels?.get(activeLevel) || [] : [];
  const shownPlans = levelPlans.filter((plan) => !rooms.length || rooms.includes(plan.rooms));
  const go = (next: string) => { setRooms([]); selectVisualPath(next); };

  return <section className={`saf-visual${block ? " is-block" : ""}`} aria-label="Выбор на 3D-схеме">
    <div className="saf-visual-heading"><div><span className="saf-kicker">ВЫБОР НА СХЕМЕ</span><h2>Выберите секцию</h2><p>Далее — этаж, квартира и конструктор.</p></div><div className="saf-visual-angle"><span>Визуализация комплекса</span><button type="button" onClick={() => setAngle((value) => (value + 1) % 2)}><RotateCcw size={17} /> Сменить ракурс</button></div></div>
    <div className={`saf-visual-scene angle-${angle}`} role="group" aria-label="Блоки SAF Avenue">
      <img className="saf-scene-render" src={safMediaUrl(angle === 1 ? 'https://static.tildacdn.pro/tild6333-3737-4034-b062-636361323936/freepik__img1-create.jpeg' : 'https://static.tildacdn.pro/tild6233-6431-4039-a432-316635333165/C_33jpg.jpeg')} alt="Визуализация комплекса SAF Avenue" />
      <div className="saf-visual-scene-inner">{blocks.map(({ number }) => <button type="button" key={number} className={`saf-block ${block === number ? 'selected' : ''}`} aria-pressed={block === number} aria-label={`Секция ${number}`} onClick={() => go(`/saf/visual/block/${number}`)}><strong>Секция {number}</strong><small>{residentialObservations.filter(unit => unit.section === String(number)).length} квартир</small></button>)}</div>
      <span className="saf-visual-scene-caption">7 жилых секций · количество квартир по снимку 28.09.2026<br />Панель выбора не обозначает положение секций. Интерактивные контуры не опубликованы</span>
    </div>
    <div className="saf-visual-path"><VisualLink to="/saf/visual">SAF Avenue</VisualLink>{block && <><ArrowRight size={14} /><VisualLink to={`/saf/visual/block/${block}`}>Блок {block}</VisualLink></>}{activeLevel && <><ArrowRight size={14} /><strong>{safLevelLabel(activeLevel)}</strong></>}</div>
    {block && !level ? <SafVisualFloor block={block} floor={floor} /> : block ? <div className="saf-visual-content"><div className="saf-visual-levels"><div className="saf-visual-subhead"><h3>Блок {block}</h3><span>{blockPlans.length} вариантов в каталоге</span><VisualLink to={`/saf/materials?tab=floors&block=${block}`}>Официальные схемы этажей ↗</VisualLink></div><p>Выберите уровень</p><div className="saf-level-list" role="group" aria-label={`Уровни блока ${block}`}>{levels.map((item) => <VisualLink key={item} to={`/saf/visual/block/${block}/level/${item}`} className={item === activeLevel ? 'active' : ''}>{safLevelLabel(item)}<span>{blockLevels?.get(item)?.length || 0}</span></VisualLink>)}</div></div>
      <div className="saf-visual-plans">{activeLevel ? <><div className="saf-visual-subhead"><div><span className="saf-kicker">БЛОК {block} / {activeLevel}</span><h3>{safLevelLabel(activeLevel)}</h3></div><span>{shownPlans.length} из {levelPlans.length} вариантов</span></div><p className="saf-visual-disclaimer">Планировки расположены списком без привязки к координатам на этаже. Номера квартир, наличие и цены требуют подтверждения.</p><div className="saf-visual-room-filter" role="group" aria-label="Фильтр комнатности">{SAF_ROOMS.filter((count) => levelPlans.some((plan) => plan.rooms === count)).map((count) => <button type="button" key={count} aria-pressed={rooms.includes(count)} onClick={() => setRooms((current) => current.includes(count) ? current.filter((item) => item !== count) : [...current, count])}>{count} комн.</button>)}{rooms.length > 0 && <button type="button" onClick={() => setRooms([])}>Все</button>}</div><div className="saf-visual-plan-grid">{shownPlans.map((plan) => <VisualLink key={plan.code} to={`/saf/plan/${encodeURIComponent(plan.code)}?from=visual`} className="saf-visual-plan"><img src={plan.image} alt={`Планировка ${plan.code}`} loading="lazy" /><span><strong>{plan.rooms}-комнатная · {plan.area.toLocaleString('ru-RU')} м²</strong><small>{plan.code}</small></span><ArrowRight size={17} /></VisualLink>)}</div>{shownPlans.length === 0 && <p>Для выбранной комнатности вариантов нет.</p>}</> : <div className="saf-visual-prompt"><ArrowLeft size={23} /><h3>Выберите уровень блока {block}</h3><p>Доступны только уровни с опубликованными вариантами.</p></div>}</div></div> : <div className="saf-visual-prompt"><h3>Начните с выбора секции</h3><p>Выберите секцию в панели над визуализацией, затем этаж и квартиру.</p></div>}
  </section>;
}
