import { useId, useState } from 'react';
import { safFloorGeometry } from '../lib/safFloorGeometry';
import { brochurePage } from '../lib/safBrochures';
import { safApartmentPath } from '../lib/safInventory';
import { navigateTo, siteUrl } from '../lib/site';
import { SafSourceSheet } from './SafSourceSheet';

export function SafInteractiveFloor({section,floor,selected,rooms=[],onHover}:{section:string;floor:number;selected?:string;rooms?:number[];onHover?:(id:string|null)=>void}) {
  const data=safFloorGeometry(section,floor);
  const [active,setActive]=useState<string|null>(null);
  const [zoom,setZoom]=useState(1);
  const clip=useId();
  if(!data)return <SafSourceSheet section={section} floor={floor}/>;
  const unit=data.regions.find(r=>r.unit?.id===active)?.unit;
  const hover=(id:string|null)=>{setActive(id);onHover?.(id);};
  return <div className="saf-interactive-floor">
    <div className="saf-sheet-controls"><button type="button" aria-label="Уменьшить схему" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}>−</button><button type="button" onClick={()=>setZoom(1)}>{zoom*100}%</button><button type="button" aria-label="Увеличить схему" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.5))}>+</button></div>
    <div className="saf-interactive-floor-scroll" role="region" aria-label="Интерактивный план этажа" tabIndex={0}>
      <svg viewBox={data.viewBox} aria-label={`Секция ${section}, этаж ${floor}, выбор квартиры`} style={{width:`${zoom*100}%`,height:`${zoom*100}%`}}>
        <defs><clipPath id={clip}><rect x="150" y="260" width="720" height="880"/></clipPath></defs>
        <image href={brochurePage('residential',data.source.page)} width="1013" height="1800" clipPath={`url(#${clip})`} style={{pointerEvents:'none'}}/>
        {data.regions.map((region,index)=>{
          const item=region.unit,dimmed=item && rooms.length>0 && !rooms.includes(item.rooms);
          return <g key={item?.id || index}>
            <polygon points={region.points.map(p=>p.join(',')).join(' ')} className={`saf-floor-apartment ${item?.id===active?'is-hovered':''} ${item?.id===selected?'is-selected':''} ${dimmed || !item?'is-dimmed':''}`} role={item?'button':undefined} tabIndex={item&&!dimmed?0:-1} aria-label={item?`Квартира № ${item.number}, ${item.rooms}-комнатная, ${item.area} м²`:undefined} aria-disabled={!!dimmed || !item}
              onPointerEnter={()=>{if(item&&!dimmed)hover(item.id);}} onPointerLeave={()=>{if(!matchMedia('(pointer: coarse)').matches)hover(null);}}
              onFocus={()=>{if(item)hover(item.id);}} onBlur={()=>hover(null)}
              onClick={()=>{if(!item||dimmed)return;if(matchMedia('(pointer: coarse)').matches && active!==item.id)hover(item.id);else navigateTo(safApartmentPath(item.id));}}
              onKeyDown={event=>{if(event.key==='Escape')hover(null);if(item&&!dimmed&&(event.key==='Enter'||event.key===' ')){event.preventDefault();navigateTo(safApartmentPath(item.id));}}}/>
            {item && !dimmed && <g className="saf-floor-unit-label" transform={`translate(${region.center.join(' ')})`}><rect x="-33" y="-17" width="66" height="34" rx="17"/><text textAnchor="middle" dominantBaseline="central">№ {item.number}</text></g>}
          </g>;
        })}
      </svg>
    </div>
    {unit && <div className="saf-floor-hover-card" role="status"><strong>{unit.rooms}-комнатная № {unit.number}</strong><span>{unit.area.toLocaleString('ru-RU')} м² · этаж {floor}</span><small>Цена и наличие уточняются</small><a href={siteUrl(safApartmentPath(unit.id))} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigateTo(safApartmentPath(unit.id));}}}>Открыть квартиру →</a></div>}
    <p className="saf-sheet-caption">Приблизительная привязка квартир для прототипа. {data.source.label}. <a href={siteUrl(`/saf/materials?tab=brochure&document=residential&page=${data.source.page}`)}>Оригинал схемы ↗</a></p>
  </div>;
}
