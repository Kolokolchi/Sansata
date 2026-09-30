import geometry from '../data/saf-floor-prototype-regions.json';
import anchorData from '../data/saf-plan-anchors.json';
import { floorSheets } from './safBrochures';
import { safFloorUnits, type SafObservedApartment } from './safInventory';

const anchors=anchorData.anchors as Record<string,number[]>;
export function safFloorGeometry(section:string,floor:number) {
  const sheets=floorSheets.filter(sheet=>sheet.blocks.includes(Number(section)));
  const source=sheets.find(sheet=>sheet.label.endsWith(`· ${floor} этаж`)) || sheets.find(sheet=>sheet.label.includes('типовой'));
  const sheet=geometry.sheets.find(sheet=>sheet.page===source?.page);
  const units=safFloorUnits.get(`${section}/${floor}`) || [];
  if(!sheet || !source || !units.length)return null;
  const points=sheet.regions.flatMap(region=>region.points);
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  const centers=sheet.regions.map(r=>[(r.center[0]-minX)/(maxX-minX),(r.center[1]-minY)/(maxY-minY)]);
  // At most five units: exhaustive assignment prevents two plan anchors claiming one polygon.
  // Missing plan codes receive remaining regions only for the user-authorized approximate prototype.
  let best=Infinity,bestSlots:number[]=[];
  const assign=(index:number,slots:number[],cost:number)=>{
    if(index===units.length){if(cost<best){best=cost;bestSlots=slots;}return;}
    for(let slot=0;slot<centers.length;slot++){
      if(slots.includes(slot))continue;
      const anchor=units[index].planCode ? anchors[units[index].planCode!] : undefined;
      const distance=anchor ? (anchor[0]-centers[slot][0])**2+(anchor[1]-centers[slot][1])**2 : slot*.00001;
      assign(index+1,[...slots,slot],cost+distance);
    }
  };
  assign(0,[],0);
  if(bestSlots.length!==units.length)return null;
  return {source,viewBox:`${minX-40} ${minY-45} ${maxX-minX+80} ${maxY-minY+90}`,
    regions:sheet.regions.map((region,index)=>({...region,unit:units[bestSlots.indexOf(index)] as SafObservedApartment|undefined}))};
}
