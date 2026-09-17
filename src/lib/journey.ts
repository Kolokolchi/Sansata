import {Flat} from './experience';
export type FlatView='tour'|'plan'|'floor'|'masterplan'|'free';
export type TourView='panorama'|'top'|'spin'|'dollhouse';
export const flatViews: [FlatView,string][]=[['tour','3D-тур'],['plan','Планировка'],['floor','На этаже'],['masterplan','На генплане'],['free','Свободный 3D']];
export const tourViews: [TourView,string][]=[['panorama','Панорамный тур'],['top','3D вид сверху'],['spin','Вращение 360°'],['dollhouse','Объёмный вид']];
export function sectionPath(section:number){return `/visual/section/${section}`;}
export function floorPath(section:number,floor:number){return `${sectionPath(section)}/floor/${floor}`;}
export function journeyRoute(path:string){const match=/^\/visual(?:\/section\/([a-zA-Z0-9_-]+)(?:\/floor\/([a-zA-Z0-9_-]+))?)?\/?$/.exec(path);if(!match)return null;if(!match[1])return {section:0,floor:0};let section=Number(match[1]);if(isNaN(section)){const sMatch=/^section-(\d+)$/.exec(match[1]);if(sMatch)section=Number(sMatch[1]);else return null;}if(!Number.isInteger(section)||section<1||section>2)return null;let floor=0;if(match[2]){floor=Number(match[2]);if(isNaN(floor)){const fMatch=/^floor-(\d+)$/.exec(match[2]);if(fMatch)floor=Number(fMatch[1]);else return null;}if(!Number.isInteger(floor)||floor<1||floor>9)return null;}return {section,floor};}
export function matchingPlans(flats:Flat[],section:number,floor=0,rooms:number[]=[]){return flats.filter(p=>p.section===section&&(!floor||p.floor===floor)&&(!rooms.length||rooms.includes(p.rooms)));}
export type Furniture={id:string;kind:'sofa'|'table'|'bed'|'chair'|'plant';x:number;z:number;rotation:number};
export interface InteriorDesign{wall:string;floor:string;furniture:Furniture[]}
export const defaultDesign:InteriorDesign={wall:'#eee8df',floor:'#c5ad8d',furniture:[{id:'sofa',kind:'sofa',x:-3,z:1,rotation:0},{id:'coffee',kind:'table',x:-3,z:-1,rotation:0},{id:'bed',kind:'bed',x:3,z:-2,rotation:0},{id:'dining',kind:'table',x:-4,z:-3.3,rotation:90},{id:'plant',kind:'plant',x:-5.4,z:3.5,rotation:0}]};
export function readDesign(value:unknown):InteriorDesign|null{if(!value||typeof value!=='object')return null;const d=value as InteriorDesign;if(!/^#[0-9a-f]{6}$/i.test(d.wall)||!/^#[0-9a-f]{6}$/i.test(d.floor)||!Array.isArray(d.furniture)||d.furniture.length>30)return null;const ids=new Set();for(const f of d.furniture){if(!f||typeof f.id!=='string'||ids.has(f.id)||!['sofa','table','bed','chair','plant'].includes(f.kind)||![f.x,f.z,f.rotation].every(Number.isFinite)||Math.abs(f.x)>5.5||Math.abs(f.z)>4.5)return null;ids.add(f.id);}return d;}
