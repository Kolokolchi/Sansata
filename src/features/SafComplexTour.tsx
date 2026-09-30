import { lazy, Suspense } from 'react';
import source from '../data/saf-tour.json';
import type { Panorama } from '../types';
import '../styles/panorama.css';

const PanoramaViewer=lazy(()=>import('./PanoramaViewer').then(module=>({default:module.PanoramaViewer})));
const files=import.meta.glob<string>('../assets/saf-tour/*.jpg',{eager:true,query:'?url',import:'default'});
const panoramas:Panorama[]=source.scenes.map((scene,index)=>({
  id:scene.id,title:scene.title,src:files[`../assets/saf-tour/${scene.id}.jpg`],poster:files[`../assets/saf-tour/${scene.id}-preview.jpg`],
  initialYaw:scene.initialYaw,initialPitch:scene.initialPitch,
  links:source.scenes.filter(other=>other.id!==scene.id).map((other,n)=>({target:other.id,yaw:scene.initialYaw+(n?28:-28),pitch:-12-index*2})),
}));
export function SafComplexTour({ point, onSelect, onClose }: {point:string;onSelect:(id:string)=>void;onClose:()=>void}) {
  return <div className="saf-complex-tour"><Suspense fallback={<p role="status">Загрузка панорам комплекса…</p>}><PanoramaViewer panoramas={panoramas} selectedId={point} onSelect={onSelect} onClose={onClose} inline /></Suspense><p className="saf-tour-prototype">Временные панорамы для прототипа · переходы между точками условные</p></div>;
}
