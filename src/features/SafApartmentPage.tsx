import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, Download, Maximize, Heart, Printer, X } from 'lucide-react';
import { SafApartmentViewer } from './SafApartmentViewer';
import { SafMasterplan } from './SafMasterplan';
import { SafInteractiveFloor } from './SafInteractiveFloor';
import { SelectionLink } from './SafVisualFloor';
import { safPlans } from '../lib/safMaterials';
import { safFloorPath, safSectionFloors, safObservedDate, safObservedLabels, safApartments, safApartmentById, safApartmentPath, type SafObservedApartment } from '../lib/safInventory';
import { navigateTo, siteUrl } from '../lib/site';
import { LeadForm } from './LeadForm';
import { SafPurchaseOptions } from './SafPurchaseOptions';

const tabs = [['tour', '3D-тур'], ['plan', 'Планировка'], ['floor', 'На этаже'], ['masterplan', 'На генплане']] as const;
type Tab = typeof tabs[number][0];
function readTab(): Tab { const value = new URLSearchParams(location.search).get('tab'); return tabs.some(([key]) => key === value) ? value as Tab : 'tour'; }
const favoriteKey='saf-favorite-apartments';
function readFavorites():string[]{try{const value:unknown=JSON.parse(localStorage.getItem(favoriteKey)||'[]');return Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'&&safApartmentById.has(id)):[];}catch{return [];}}

export function SafApartmentPage({ unit }: { unit: SafObservedApartment }) {
  const [tab, setTab] = useState<Tab>(readTab);
  const [notice, setNotice] = useState('');
  const [zoom, setZoom] = useState(1);
  const [favorite,setFavorite]=useState(()=>readFavorites().includes(unit.id));
  const [consult,setConsult]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const plan = safPlans.plans.find(item => item.code === unit.planCode);
  const floorPath = safFloorPath(unit.section, unit.floor);
  const related=safApartments.filter(other=>other.id!==unit.id&&other.rooms===unit.rooms&&other.planCode).sort((a,b)=>Math.abs(a.area-unit.area)-Math.abs(b.area-unit.area)||a.id.localeCompare(b.id)).slice(0,3);
  useEffect(()=>{if(consult)dialog.current?.showModal();else dialog.current?.close();},[consult]);
  const toggleFavorite=()=>{const values=readFavorites();const next=values.includes(unit.id)?values.filter(id=>id!==unit.id):[...values,unit.id];try{localStorage.setItem(favoriteKey,JSON.stringify(next));setFavorite(next.includes(unit.id));setNotice(next.includes(unit.id)?'Квартира сохранена в избранное на этом устройстве.':'Квартира удалена из избранного.');}catch{setNotice('Браузер не разрешает сохранить избранное.');}};
  useEffect(() => { const sync = () => setTab(readTab()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  const change = (next: Tab) => { const url = new URL(location.href); url.searchParams.set('tab', next); history.pushState(null, '', url); setTab(next); setNotice(''); };
  const fullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (viewer.current?.requestFullscreen) await viewer.current.requestFullscreen(); else setNotice('Полноэкранный режим недоступен в этом браузере.'); } catch { setNotice('Полноэкранный режим недоступен в этом браузере.'); } };
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setNotice('Ссылка на квартиру и выбранный вид скопирована.'); } catch { setNotice(`Ссылка: ${location.href}`); } };
  return <main className="saf-apartment-page">
    <aside className="saf-apartment-summary">
      <SelectionLink to={floorPath} className="saf-apartment-back"><ArrowLeft size={18} /> К квартирам этажа</SelectionLink>
      <button type="button" className="saf-apartment-favorite" aria-label={favorite?'Убрать квартиру из избранного':'Сохранить квартиру в избранное'} aria-pressed={favorite} onClick={toggleFavorite}><Heart size={20} fill={favorite?'currentColor':'none'}/></button>
      <span className="saf-kicker">SAF AVENUE</span><h1>{unit.rooms}-комнатная № {unit.number}</h1>
      <div className="saf-apartment-price">Цена и наличие уточняются</div>
      <p className="saf-apartment-historic">В снимке на {safObservedDate}: {safObservedLabels[unit.observedStatus].toLowerCase()}{unit.observedPrice !== null ? ` · ${unit.observedPrice.toLocaleString('ru-RU')} ₸` : ''}. Эти данные не подтверждают актуальную продажу.</p>
      <a className="saf-apartment-consult" href="tel:700">Уточнить у отдела продаж · 700</a>
      <button type="button" className="saf-apartment-booking" onClick={()=>setConsult(true)}>Обсудить бронирование</button>
      <a className="saf-payment-link" href="#saf-payment">Рассчитать платёж ↓</a>
      <dl><div><dt>Площадь</dt><dd>{unit.area.toLocaleString('ru-RU')} м²</dd></div><div><dt>Комнат</dt><dd>{unit.rooms}</dd></div><div><dt>Секция</dt><dd>{unit.section}</dd></div><div><dt>Этаж</dt><dd>{unit.floor} из {Math.max(...safSectionFloors(unit.section))}</dd></div><div><dt>Номер квартиры</dt><dd>{unit.number}</dd></div>{plan && <div><dt>Код планировки</dt><dd>{plan.code}</dd></div>}</dl>
      <div className="saf-apartment-actions">{plan && <a href={plan.image} download={`SAF-${unit.section}-${unit.number}.png`}><Download size={17} /> Скачать план</a>}<button type="button" onClick={copy}><Copy size={17} /> Поделиться</button><button type="button" onClick={()=>window.print()}><Printer size={17}/> Печать / PDF</button></div>
      {!plan && <p>Изображение для этой квартиры не опубликовано. Данные секции и этажа сохранены.</p>}
      {notice && <p role="status">{notice}</p>}
    </aside>
    <div className="saf-apartment-visual" ref={viewer}>
      {tab !== 'tour' && <button type="button" className="saf-apartment-fullscreen" aria-label="Развернуть выбранный вид" onClick={fullscreen}><Maximize size={19} /></button>}
      <div className="saf-apartment-stage">
        {tab === 'tour' && <div className="saf-apartment-tour"><SafApartmentViewer code={plan?.code || unit.id} rooms={unit.rooms} image={plan?.image || ''} compact /></div>}
        {tab === 'plan' && (plan ? <div className="saf-apartment-plan"><div className="saf-sheet-controls"><button type="button" aria-label="Уменьшить план" onClick={() => setZoom(value => Math.max(1, value - .5))} disabled={zoom <= 1}>−</button><button type="button" onClick={() => setZoom(1)}>{zoom * 100}%</button><button type="button" aria-label="Увеличить план" onClick={() => setZoom(value => Math.min(3, value + .5))} disabled={zoom >= 3}>+</button></div><div className="saf-apartment-plan-scroll" tabIndex={0} role="region" aria-label="План квартиры"><img style={{ width: `${zoom * 100}%`, maxWidth: 'none', height: `${zoom * 100}%` }} src={plan.image} alt={`Планировка квартиры № ${unit.number}`} /></div></div> : <p className="saf-journey-empty">Изображение этой квартиры не опубликовано.</p>)}
        {tab === 'floor' && <SafInteractiveFloor section={unit.section} floor={unit.floor} selected={unit.id} />}
        {tab === 'masterplan' && <div className="saf-apartment-masterplan"><SafMasterplan section={unit.section} onSelect={section => navigateTo(`/saf/visual/block/${section}`)} /><p>Выделена секция {unit.section}. <a href={siteUrl(floorPath)}>Вернуться к этажу {unit.floor} ↗</a></p></div>}
      </div>
      <div className="saf-apartment-tabs" role="tablist" aria-label="Виды квартиры">{tabs.map(([key, label], index) => <button key={key} type="button" role="tab" aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => change(key)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4; change(tabs[next][0]); (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus(); } }}>{label}</button>)}</div>
    </div>
    <SafPurchaseOptions onConsult={()=>setConsult(true)}/>
    <section className="saf-related-apartments"><h2>Похожие квартиры</h2><p>Планировки из снимка на {safObservedDate}. Текущие цены и наличие уточняются.</p><div>{related.map(other=>{const otherPlan=safPlans.plans.find(item=>item.code===other.planCode);return <SelectionLink key={other.id} to={safApartmentPath(other.id)}><img src={otherPlan?.image} alt={`Планировка квартиры № ${other.number}`} loading="lazy"/><strong>{other.rooms}-комнатная № {other.number}</strong><span>{other.area.toLocaleString('ru-RU')} м² · секция {other.section} · этаж {other.floor}</span><small>Наличие уточняется →</small></SelectionLink>;})}</div></section>
    <dialog ref={dialog} className="saf-consult-dialog" aria-label={`Консультация по квартире № ${unit.number}`} onCancel={()=>setConsult(false)} onClick={event=>{if(event.target===event.currentTarget)setConsult(false);}}><button type="button" className="saf-consult-close" aria-label="Закрыть заявку" onClick={()=>setConsult(false)}><X size={21}/></button><p className="saf-consult-note">Заявка на консультацию по бронированию. Квартира не резервируется автоматически.</p>{consult && <LeadForm topic={`SAF Avenue: квартира № ${unit.number}, секция ${unit.section}, этаж ${unit.floor}. Консультация по бронированию.`}/>}</dialog>
    <div className="saf-apartment-print"><h2>SAF Avenue · {unit.rooms}-комнатная квартира № {unit.number}</h2><p>Секция {unit.section} · этаж {unit.floor} · {unit.area} м²</p>{plan && <img src={plan.image} alt="План квартиры для печати"/>}<p>Цена и наличие уточняются. Источник: публичный снимок на {safObservedDate}.</p><p>{location.origin}{siteUrl(safApartmentPath(unit.id))}</p></div>
  </main>;
}
