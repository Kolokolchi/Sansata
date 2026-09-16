import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Panorama} from '../lib/experience';
export function PanoramaViewer({panoramas}:{panoramas:Panorama[]}){
 const [id,setId]=useState(panoramas[0]?.id),[error,setError]=useState('');
 const p=panoramas.find(v=>v.id===id)||panoramas[0];const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!p||!host.current)return;const el=host.current;setError('');let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('Панорама недоступна в этом браузере.');return;}
  let ended=false;const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(70,1,.1,100);
  camera.position.set(0,0,.01);const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableZoom=false;controls.enablePan=false;controls.rotateSpeed=-.35;controls.enableDamping=true;
  const geometry=new THREE.SphereGeometry(40,64,32);geometry.scale(-1,1,1);const material=new THREE.MeshBasicMaterial();
  const texture=new THREE.TextureLoader().load(p.src,()=>{if(ended){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true;},undefined,()=>{if(!ended)setError('Не удалось загрузить панораму. Выберите другую точку.');});
  scene.add(new THREE.Mesh(geometry,material));renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement);
  const markers=(p.links||[]).map(link=>{const button=document.createElement('button');button.className='panorama-marker';button.textContent='↗';button.ariaLabel='Перейти: '+(panoramas.find(v=>v.id===link.target)?.title||link.target);button.title=button.ariaLabel;button.onclick=()=>setId(link.target);el.appendChild(button);const yaw=THREE.MathUtils.degToRad(link.yaw),pitch=THREE.MathUtils.degToRad(link.pitch);return{button,position:new THREE.Vector3(20*Math.sin(yaw)*Math.cos(pitch),20*Math.sin(pitch),-20*Math.cos(yaw)*Math.cos(pitch))};});
  const resize=()=>{if(!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();};const obs=new ResizeObserver(resize);obs.observe(el);resize();
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);const forward=new THREE.Vector3();camera.getWorldDirection(forward);markers.forEach(({button,position})=>{const visible=position.clone().sub(camera.position).dot(forward)>0;const projected=position.clone().project(camera);button.hidden=!visible||Math.abs(projected.x)>1||Math.abs(projected.y)>1;button.style.left=(projected.x+1)*50+'%';button.style.top=(1-projected.y)*50+'%';});});
  return()=>{ended=true;obs.disconnect();renderer.setAnimationLoop(null);controls.dispose();markers.forEach(m=>m.button.remove());texture.dispose();material.dispose();geometry.dispose();renderer.dispose();renderer.domElement.remove();};
 },[p,panoramas]);
 return <div><div className="tabs">{panoramas.map(v=><button key={v.id} onClick={()=>setId(v.id)} className={p?.id===v.id?'active':''}>{v.title}</button>)}</div><div className="panorama-canvas" ref={host}/>{error&&<p role="alert">{error}</p>}<p className="muted-note">Вращайте изображение мышью или пальцем. Стрелки и кнопки названий перемещают между точками.</p></div>;
}
