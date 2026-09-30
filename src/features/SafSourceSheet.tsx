import { useState } from 'react';
import { brochurePage, floorSheets } from '../lib/safBrochures';
import { siteUrl } from '../lib/site';

export function SafSourceSheet({ section, floor }: { section: string; floor: number }) {
  const [zoom, setZoom] = useState(1);
  const sheets = floorSheets.filter(sheet => sheet.blocks.includes(Number(section)));
  const exact = sheets.find(sheet => sheet.label.endsWith(`· ${floor} этаж`));
  const sheet = exact || sheets.find(item => item.label.includes('типовой'));
  const clipId = `saf-sheet-crop-${section}-${floor}`;
  if (!sheet) return <p>Схема этого блока не опубликована.</p>;
  return <div className="saf-source-sheet">
    <div className="saf-sheet-controls"><button type="button" aria-label="Уменьшить схему" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .5))}>−</button><button type="button" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button type="button" aria-label="Увеличить схему" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + .5))}>+</button></div>
    <div className="saf-sheet-scroll" tabIndex={0} role="region" aria-label="Схема этажа, прокрутка увеличенного изображения">
      <svg viewBox="0 320 1013 840" role="img" aria-label={sheet.label} style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}><defs><clipPath id={clipId}><rect x="0" y="320" width="1013" height="840" /></clipPath></defs><image href={brochurePage('residential', sheet.page)} x="0" y="0" width="1013" height="1800" clipPath={`url(#${clipId})`} /></svg>
    </div>
    <p className="saf-sheet-caption">{sheet.label}. {!exact && 'Справочная типовая схема: соответствие выбранному этажу не подтверждено. '}Контуры конкретных квартир не сопоставлены. <a href={siteUrl(`/saf/materials?tab=brochure&document=residential&page=${sheet.page}`)}>Оригинал ↗</a></p>
  </div>;
}
