import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SafMasterplan } from './SafMasterplan';
import { SafInteractiveFloor } from './SafInteractiveFloor';
import { SelectionLink } from './SafVisualFloor';
import { safSectionUnits, safSectionFloors, safFloorUnits, safApartmentPath, safFloorPath, safObservedLabels, safObservedDate } from '../lib/safInventory';
import { safPlans } from '../lib/safMaterials';
import { navigateTo, siteUrl } from '../lib/site';
import { SafBuildingScene } from './SafBuildingScene';
import { SafComplexTour } from './SafComplexTour';

const plans = new Map(safPlans.plans.map(plan => [plan.code, plan]));
export function SafVisualJourney({ section, floor }: { section: string | null; floor: number | null }) {
  const [render, setRender] = useState(true);
  const [tour, setTour] = useState(() => new URLSearchParams(location.search).get('view')==='360');
  const [point,setPoint]=useState(()=>new URLSearchParams(location.search).get('point') || 'cam-5');
  const [rooms, setRooms] = useState<number[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => { setHovered(null); }, [section, floor]);
  useEffect(()=>{const sync=()=>{const query=new URLSearchParams(location.search);setTour(query.get('view')==='360');setPoint(query.get('point') || 'cam-5');};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  const changeTour=(enabled:boolean,id=point)=>{const url=new URL(location.href);if(enabled){url.searchParams.set('view','360');url.searchParams.set('point',id);}else{url.searchParams.delete('view');url.searchParams.delete('point');}history.pushState(null,'',url);setTour(enabled);setPoint(id);};
  const floors = section ? safSectionFloors(section) : [];
  const units = section && floor !== null ? safFloorUnits.get(`${section}/${floor}`) || [] : [];
  const shown = units.filter(unit => !rooms.length || rooms.includes(unit.rooms));
  const preview = units.find(unit => unit.id === hovered);
  const previewPlan = preview?.planCode ? plans.get(preview.planCode) : undefined;
  const selectSection = (value: string) => navigateTo(`/saf/visual/block/${value}`);
  return <main className={`saf-journey ${section ? 'has-section' : 'saf-complex-entry'} ${!render ? 'is-map' : ''} ${floor !== null ? 'has-floor' : ''} ${section && floor===null ? 'saf-facade-entry' : ''} ${tour && floor===null ? 'is-complex-tour' : ''}`}>
    <h1 className="saf-visually-hidden">Квартиры на 3D-плане</h1>
    <div className="saf-journey-top"><SelectionLink to={floor !== null ? `/saf/visual/block/${section}` : section ? '/saf/visual' : '/saf'} className="saf-journey-back"><ArrowLeft size={20} /><span>{floor !== null ? 'К секции' : section ? 'К комплексу' : 'По параметрам'}</span></SelectionLink><strong>{section ? `Секция ${section}${floor !== null ? ` · Этаж ${floor}` : ''}` : 'SAF Avenue'}</strong><SelectionLink to="/saf">По параметрам <ArrowRight size={15} /></SelectionLink></div>
    <div className="saf-journey-body">
      {section && <aside className="saf-floor-rail"><label>Секция<select value={section} onChange={event => selectSection(event.target.value)}>{[...safSectionUnits.keys()].map(id => <option key={id} value={id}>{id}</option>)}</select></label><span>Этаж</span><div role="group" aria-label={`Этажи секции ${section}`}>{floors.map(value => <SelectionLink key={value} to={safFloorPath(section, value)} className={floor === value ? 'active' : ''}>{value}</SelectionLink>)}</div></aside>}
      <section className="saf-journey-canvas" aria-label={floor !== null ? 'План этажа' : 'Выбор секции на генплане'}>
        {section && floor !== null ? units.length ? <SafInteractiveFloor key={`${section}/${floor}`} section={section} floor={floor} selected={hovered || undefined} rooms={rooms} onHover={setHovered} /> : <div className="saf-journey-empty"><h2>Этаж отсутствует в снимке</h2><p>Выберите один из этажей слева.</p></div> : <>
          {tour ? <SafComplexTour point={point} onSelect={id=>changeTour(true,id)} onClose={()=>changeTour(false)} /> : render ? <SafBuildingScene key={section || 'complex'} section={section} rooms={rooms} /> : <SafMasterplan section={section || undefined} onSelect={selectSection} />}
          {!tour && <>{render && <div className="saf-scene-room-filter saf-journey-rooms" role="group" aria-label="Комнатность на визуальном плане"><span>Комнат</span>{[1,2,3,4,5].map(count=><button key={count} type="button" aria-pressed={rooms.includes(count)} onClick={()=>setRooms(current=>current.includes(count)?current.filter(value=>value!==count):[...current,count])}>{count}к</button>)}{rooms.length>0 && <button type="button" onClick={()=>setRooms([])}>Все</button>}</div>}<div className="saf-map-switch" role="group" aria-label="Вид комплекса"><button type="button" aria-pressed={!render} onClick={() => setRender(false)}>Генплан · выбор секций</button><button type="button" aria-pressed={render} onClick={() => setRender(true)}>Визуализация</button><button type="button" onClick={()=>changeTour(true)}>3D-тур по комплексу</button></div>
          <p className="saf-map-note">{render ? 'Прототип: привязка секций и этажей к панорамам приблизительная.' : 'Подписанный генплан SAF Avenue.'}</p></>}
        </>}
      </section>
      <aside className="saf-journey-picker" aria-label={floor !== null ? 'Квартиры этажа' : 'Секции комплекса'}>
        {floor === null ? <><h2>{section ? `Секция ${section}` : 'Выберите секцию'}</h2><p>{section ? 'Выберите этаж в панели слева.' : 'Расположение блоков соответствует опубликованному генплану.'}</p>{(section ? [section] : [...safSectionUnits.keys()]).map(id => <button type="button" className="saf-section-choice" key={id} onClick={() => selectSection(id)}><span>Секция {id}</span><small>{safSectionFloors(id).length} жилых этажей · {safSectionUnits.get(id)?.length} квартир в снимке</small><ArrowRight size={18} /></button>)}<p className="saf-journey-note">Данные на {safObservedDate}. Актуальное наличие уточняется.</p></> : <>
          <h2>Квартиры · {shown.length}</h2><p>Секция {section}, этаж {floor}</p><div className="saf-journey-rooms" role="group" aria-label="Комнатность квартир этажа">{[...new Set(units.map(unit => unit.rooms))].sort().map(count => <button type="button" key={count} aria-pressed={rooms.includes(count)} onClick={() => setRooms(values => values.includes(count) ? values.filter(value => value !== count) : [...values, count])}>{count}к</button>)}{rooms.length > 0 && <button type="button" onClick={() => setRooms([])}>Все</button>}</div>
          <div className="saf-unit-list">{shown.map(unit => <a key={unit.id} href={siteUrl(safApartmentPath(unit.id))} className={`saf-unit-choice ${hovered === unit.id ? 'is-preview' : ''}`} onPointerEnter={() => setHovered(unit.id)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(unit.id)} onBlur={() => setHovered(null)} onClick={event => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) { event.preventDefault(); navigateTo(safApartmentPath(unit.id)); } }}><strong>№ {unit.number} · {unit.rooms}-комнатная</strong><span>{unit.area.toLocaleString('ru-RU')} м²</span><small>{safObservedLabels[unit.observedStatus]} на {safObservedDate}</small><ArrowRight size={17} /></a>)}</div>
          <div className="saf-unit-preview" aria-live="polite">{preview && previewPlan ? <><img src={previewPlan.image} alt={`План квартиры № ${preview.number}`} /><span>№ {preview.number} · {preview.area} м²</span></> : <p>{preview ? 'Изображение этой квартиры не опубликовано.' : 'Выберите квартиру из списка. Наличие требует подтверждения.'}</p>}</div>
        </>}
      </aside>
    </div>
  </main>;
}
