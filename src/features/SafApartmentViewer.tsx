import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Maximize, Camera, ChevronLeft, ChevronRight, Box, RotateCw, Scan, View, Menu, Share2, PencilRuler } from 'lucide-react';
import { defaultDesign, readDesign, tourViews, type TourView } from '../lib/interior';
import { InteriorEditor } from './InteriorEditor';

const ApartmentScene = lazy(() => import('./ApartmentScene').then(m => ({ default: m.ApartmentScene })));
const modes = [['plan', 'Планировка'], ...tourViews] as const;
type View = 'plan' | TourView;
function readView(): View {
  const value = new URLSearchParams(location.search).get('view');
  return modes.some(([key]) => key === value) ? value as View : 'dollhouse';
}
function readPoint(): number {
  const value = Number(new URLSearchParams(location.search).get('point'));
  return Number.isSafeInteger(value) ? ((value % 4) + 4) % 4 : 0;
}

export function SafApartmentViewer({ code, rooms, image, compact = false }: { code: string; rooms: number; image: string; compact?: boolean }) {
  const [view, setView] = useState<View>(readView);
  const [point, setPoint] = useState(readPoint);
  const [menu, setMenu] = useState(false);
  const [editor, setEditor] = useState(false);
  const [capture, setCapture] = useState(0);
  const [notice, setNotice] = useState('');
  const [design, setDesign] = useState(() => {
    try { return readDesign(JSON.parse(localStorage.getItem('saf-design-' + code) || 'null')) || structuredClone(defaultDesign); }
    catch { return structuredClone(defaultDesign); }
  });
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => { setView(readView()); setPoint(readPoint()); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  function change(next: View, nextPoint = point) {
    if (next === 'plan') setEditor(false);
    setView(next); setPoint(nextPoint);
    const url = new URL(location.href);
    url.searchParams.set('view', next); url.searchParams.set('point', String(nextPoint));
    history.pushState(null, '', url);
  }
  const roomNames = ['Гостиная', 'Спальня', 'Кухня', 'Прихожая'];
  return <div className={`saf-viewer ${compact ? 'saf-viewer-immersive' : ''}`} ref={host}>
    {!compact && <div className="saf-viewer-toolbar"><strong>Просмотр квартиры</strong><div>
      <button onClick={() => { setEditor(!editor); change('dollhouse'); }} aria-pressed={editor}>Интерьер</button>
      {view !== 'plan' && <button aria-label="Снимок 3D-вида" onClick={() => setCapture(n => n + 1)}><Camera size={18} /></button>}
      <button aria-label="Полноэкранный просмотр" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void host.current?.requestFullscreen().catch(() => setNotice('Полноэкранный просмотр недоступен.')); }}><Maximize size={18} /></button>
    </div></div>}
    {!compact && <div className="saf-viewer-tabs" role="group" aria-label="Ракурсы квартиры">{modes.map(([key, label]) => <button key={key} aria-pressed={view === key} onClick={() => change(key)}>{label}</button>)}</div>}
    {compact && <><button className="saf-viewer-home" title="Объёмный вид" aria-label="Вернуться к объёмному виду" onClick={()=>change('dollhouse',0)}><Box size={23}/></button><div className="saf-viewer-corner"><button title="Конструктор интерьера" aria-label="Интерьер" aria-pressed={editor} onClick={()=>{setEditor(!editor);change('dollhouse');}}><PencilRuler size={19}/></button><button title="Во весь экран" aria-label="Полноэкранный просмотр" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void host.current?.requestFullscreen().catch(()=>setNotice('Полноэкранный просмотр недоступен.'));}}><Maximize size={18}/></button></div></>}
    <div className="saf-viewer-stage">
      {view === 'plan' ? <img className="saf-viewer-plan" src={image} alt={`Планировка ${code}`} /> : <Suspense fallback={<p role="status">Загрузка 3D…</p>}><ApartmentScene mode={view} point={point} design={design} rooms={rooms} captureToken={capture} background={compact ? '#ffffff' : undefined} /></Suspense>}
    </div>
    {compact && <div className="saf-viewer-bottom"><div className="saf-viewer-utilities"><button aria-label="Меню обзора" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu size={17}/></button><button aria-label="Предыдущий ракурс" onClick={()=>change(view==='top'||view==='plan'?'dollhouse':view,(point+3)%4)}><ChevronLeft size={18}/></button><button aria-label="Следующий ракурс" onClick={()=>change(view==='top'||view==='plan'?'dollhouse':view,(point+1)%4)}><ChevronRight size={18}/></button></div><div className="saf-viewer-mode-dock" role="group" aria-label="Ракурсы квартиры">{tourViews.map(([key,label],index)=>{const Icon=[View,Scan,RotateCw,Box][index];return <button key={key} title={label} aria-label={label} aria-pressed={view===key} onClick={()=>change(key)}><Icon size={24}/><small>{key==='panorama'||key==='spin'?'360°':'3D'}</small></button>;})}</div><button aria-label="Поделиться обзором" onClick={async()=>{try{await navigator.clipboard.writeText(location.href);setNotice('Ссылка на обзор скопирована.');}catch{setNotice(location.href);}}}><Share2 size={18}/></button></div>}
    {compact && menu && <div className="saf-viewer-menu"><strong>Обзор квартиры</strong>{roomNames.map((name,index)=><button key={name} onClick={()=>{change('panorama',index);setMenu(false);}}>{name}</button>)}<button onClick={()=>{setCapture(n=>n+1);setMenu(false);}}><Camera size={17}/> Снимок 3D-вида</button></div>}
    {view !== 'plan' && <p className="saf-viewer-note">Демо-интерьер · не точная модель планировки SAF Avenue</p>}
    {!compact && view === 'panorama' && <div className="saf-room-navigation"><button aria-label="Предыдущая комната" onClick={() => change('panorama', (point + 3) % 4)}><ChevronLeft size={18} /></button>{roomNames.map((name, index) => <button key={name} aria-pressed={point === index} onClick={() => change('panorama', index)}>{name}</button>)}<button aria-label="Следующая комната" onClick={() => change('panorama', (point + 1) % 4)}><ChevronRight size={18} /></button></div>}
    {editor && view !== 'plan' && <InteriorEditor design={design} onChange={setDesign} onClose={() => setEditor(false)} onSave={() => { try { localStorage.setItem('saf-design-' + code, JSON.stringify(design)); setNotice('Интерьер сохранён на этом устройстве.'); } catch { setNotice('Не удалось сохранить интерьер.'); } }} />}
    {notice && <p role="status">{notice}</p>}
  </div>;
}
