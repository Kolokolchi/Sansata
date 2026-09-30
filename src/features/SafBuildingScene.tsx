import { useState } from 'react';
import photo from '../assets/saf-tour/cam-5-view.jpg';
import geometry from '../data/saf-prototype-sections.json';
import { safSectionFloors, safSectionUnits, safFloorUnits, safFloorPath } from '../lib/safInventory';
import { navigateTo } from '../lib/site';
import { calculateCentroid } from '../lib/geometry';

export function SafBuildingScene({ section, rooms = [] }: { section: string | null; rooms?: number[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const chosen = geometry.regions.find(region => region.id === section);
  const floorList = section ? safSectionFloors(section) : [];
  const counts = (id: string) => (section ? safFloorUnits.get(`${section}/${id}`) : safSectionUnits.get(id))?.filter(unit => !rooms.length || rooms.includes(unit.rooms)).length || 0;
  const regions = chosen ? floorList.map((floor, index) => {
    const [tl, tr, br, bl] = chosen.facade;
    const lerp = (a: number[], b: number[], t: number): [number, number] => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    const top=index/floorList.length, bottom=(index+1)/floorList.length;
    return {id:String(floor),points:[lerp(tl,bl,top),lerp(tr,br,top),lerp(tr,br,bottom),lerp(tl,bl,bottom)]};
  }) : geometry.regions;
  const xs=chosen?.points.map(p=>p[0]) || [], ys=chosen?.points.map(p=>p[1]) || [];
  const viewBox = chosen ? `${Math.min(...xs)-50} ${Math.min(...ys)-35} ${Math.max(...xs)-Math.min(...xs)+100} ${Math.max(...ys)-Math.min(...ys)+80}` : '500 240 1030 730';
  const open = (id:string) => navigateTo(section ? safFloorPath(section,Number(id)) : `/saf/visual/block/${id}`);
  return <div className="saf-building-scene">
    <svg className="saf-journey-render" viewBox={viewBox} aria-label={section ? `Выбор этажа секции ${section} на фасаде` : 'Выбор секции на изображении комплекса'}>
      <image href={photo} width={geometry.width} height={geometry.height} style={{pointerEvents:'none'}} />
      {regions.map(region => {
        const center=calculateCentroid(region.points as [number,number][]);
        const disabled=counts(region.id)===0;
        return <g key={region.id}>
          <polygon points={region.points.map(p=>p.join(',')).join(' ')} className={`saf-building-region ${hover===region.id?'is-hovered':''} ${disabled?'is-empty':''}`}
            tabIndex={0} role="button" aria-label={`${section ? 'Этаж' : 'Секция'} ${region.id}, ${counts(region.id)} квартир в снимке`} aria-disabled={disabled}
            onPointerEnter={()=>setHover(region.id)} onPointerLeave={()=>setHover(null)} onFocus={()=>setHover(region.id)} onBlur={()=>setHover(null)}
            onClick={()=>{if(!disabled)open(region.id);}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!disabled)open(region.id);}if(event.key==='Escape')setHover(null);}} />
          {(!section || hover===region.id) && <g className="saf-building-label" transform={`translate(${center.x} ${center.y})`}><rect x={section?-15:-38} y={-8} width={section?30:76} height={16} rx={8}/><text textAnchor="middle" dominantBaseline="central">{section ? region.id : `Секция ${region.id}`}</text></g>}
        </g>;
      })}
    </svg>
    <div className="saf-building-info" role="status">{hover ? <><strong>{section ? `Этаж ${hover}` : `Секция ${hover}`}</strong><span>{counts(hover)} квартир в снимке{!section && ` · ${Math.max(...safSectionFloors(hover))} этажей`}</span><small>Нажмите для выбора</small></> : <span>{section ? 'Наведите на этаж фасада' : 'Наведите на секцию комплекса'}</span>}</div>
  </div>;
}
