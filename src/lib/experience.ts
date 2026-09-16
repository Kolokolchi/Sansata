import original from '../data/shattyq.json';
export type Flat = typeof original.plans[number] & { section:number; floor:number; area:number|null; price:number|null; status:'unknown'|'available'|'reserved'|'sold'; areaKind:'calculated'|'official'; features:string[] };
const positions = [[1,7],[1,3],[1,7],[1,3],[1,2],[2,9],[2,3],[2,2],[1,2],[1,2],[1,7],[1,7],[1,3],[1,3],[2,9],[2,3],[2,2],[2,2],[2,9],[2,3]];
// Only values read and checked against the original drawings are summed.
const measured:Record<number,number[]>={1:[5.73,10.99,14.92,15.05,21.66,1.96],6:[3.70,4.08,4.51,8.72,5.72,29.26,6.40,15.05,21.63,2.01],18:[34.08,6.53,6.53,5.08,6.90,7.75,11.75,5.72,5.28,3.96,3.72,25.80,18.41,17.14,2.01]};
export const flats:Flat[]=original.plans.map((p,i)=>({...p,section:positions[i][0],floor:positions[i][1],area:measured[i+1]?Math.round(measured[i+1].reduce((a,b)=>a+b,0)*100)/100:null,areaKind:'calculated',price:null,status:'unknown',features:['Лоджия',...(p.rooms===4?['Гардеробная']:[])]}));
export interface Panorama {id:string;title:string;src:string;poster?:string;links?:{target:string;yaw:number;pitch:number}[]}
export interface MediaAlbum {id:string;title:string;date:string;images:string[]}
export interface ProjectDocument {id:string;title:string;url:string;category:string;date?:string}
export interface ExperienceConfig {version:number;model:{url:string|null;label:string;scale:number};panoramas:Panorama[];constructionAlbums:MediaAlbum[];cameras:{id:string;title:string;url:string}[];documents:ProjectDocument[];inventory:Partial<Flat>[];leadEndpoint:string;source:string}
export const fallbackConfig:ExperienceConfig={version:1,model:{url:null,label:'Демонстрационная 3D-сцена',scale:1},panoramas:[],constructionAlbums:[],cameras:[],documents:[],inventory:[],leadEndpoint:'/api/leads',source:original.source};
export const money=(n:number)=>new Intl.NumberFormat('ru-KZ',{maximumFractionDigits:0}).format(n)+' ₸';
export const areaLabel=(p:Flat)=>p.area===null?'Площадь на чертеже':`${p.areaKind==='calculated'?'≈ ':''}${p.area.toLocaleString('ru-RU')} м²`;
export const statusLabel={unknown:'Наличие уточняется',available:'В продаже',reserved:'Забронирована',sold:'Продана'};
export function calculateMortgage(price:number,down:number,years:number,rate:number){const principal=Math.max(0,price-down);const months=Math.max(1,Math.round(years*12));const r=rate/1200;const payment=r===0?principal/months:principal*r/(1-Math.pow(1+r,-months));return {principal,payment,interest:Math.max(0,payment*months-principal),total:payment*months+down};}
