import { useEffect, useState } from 'react';
import { materials, safHero, safMediaUrl } from '../lib/safMaterials';
import { brochurePage, documents, floorSheets } from '../lib/safBrochures';
import { siteUrl } from '../lib/site';
import '../styles/saf-materials.css';

const tabs = [ ['gallery', 'Визуалы'], ['brochure', 'Презентации'], ['floors', 'Схемы этажей'], ['plans', 'Планы с сайта'], ['commercial', 'Коммерция'] ] as const;
type Tab = typeof tabs[number][0];
const sectionUrls = (id: string) => materials.sections.find(section => section.id === id)?.urls.filter(url => !url.endsWith('.svg')) || [];
const apartmentUrls = sectionUrls('rec2171651653');
const commercialUrls = [...new Set(materials.sections.filter(section => section.id === 'rec2171487063' || /^rec21715/.test(section.id)).flatMap(section => section.urls))];
const planUrls = new Set([...apartmentUrls, ...commercialUrls]);
const gallery = materials.assets.filter(asset => /\.(png|jpe?g)$/.test(asset.file) && !asset.source.includes('profitbase') && !planUrls.has(asset.source));
const areas = ['49,29', '58,14', '61,84', '64,73', '71,37', '72,24', '76,92', '78,28', '80,58', '82,45', '86,11', '88,37', '97,47', '98,50', '100,94', '101,14', '118,87', '120,84', '122,94', '114,77', '136,18', '143,19', '150,87', '154,80', '156,59', '168,27', '181,46'];
const topics = [
  { title: 'Архитектура', text: 'Монолитный железобетонный каркас, алюминиевые панели, витражи и архитектурная подсветка.', id: 'rec2124998913' },
  { title: 'Расположение', text: 'Алматы, пересечение проспекта Аль-Фараби и улицы Розыбакиева.', id: 'rec2124998683' },
  { title: 'Концепция комплекса', text: 'Жилые блоки, деловые пространства, отель и пешеходный бульвар.', id: 'rec2124998783' },
  { title: 'Двор', text: 'Прогулочные аллеи, ландшафтный дизайн и теневые беседки.', id: 'rec2124998963' },
  { title: 'SAF Club', text: 'Пространства для встреч, тренировок и детских игр.', id: 'rec2124999043' },
  { title: 'Холлы', text: 'Авторский дизайн, lounge-пространства и многоуровневое освещение.', id: 'rec2129338593' },
];
function readRoute() {
  const query = new URLSearchParams(location.search);
  const tab = tabs.some(([key]) => key === query.get('tab')) ? query.get('tab') as Tab : 'gallery';
  const document = query.get('document') === 'commercial' ? 'commercial' : 'residential';
  const maxPage = documents.find(item => item.id === document)!.pages;
  const page = Math.max(1, Math.min(maxPage, Math.trunc(Number(query.get('page')) || 1)));
  const block = /^[1-7]$/.test(query.get('block') || '') ? query.get('block')! : '';
  return { tab, document, page, block };
}

export function SafMaterials() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => { const sync = () => setRoute(readRoute()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  const update = (change: Partial<typeof route>) => {
    const next = { ...route, ...change };
    const query = new URLSearchParams({ tab: next.tab, document: next.document, page: String(next.page) });
    if (next.block) query.set('block', next.block);
    history.pushState(null, '', siteUrl(`/saf/materials?${query}`));
    setRoute(next);
  };
  const document = documents.find(item => item.id === route.document)!;
  return <main className="saf-materials">
    <a className="saf-material-back" href={siteUrl('/saf')}>← Вернуться в конструктор</a>
    <section className="saf-material-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(20,27,31,.8),rgba(20,27,31,.05)),url(${safHero})` }}><span className="saf-kicker">SAF AVENUE / МАТЕРИАЛЫ ПРОЕКТА</span><h1>Всё о пространстве<br />вашей жизни.</h1><p>Оригинальные визуалы, презентации и схемы.<br />Сохранены с официального сайта 28 сентября 2026.</p><a href={siteUrl('/saf/stock')}>Помещения по секциям и этажам ↗</a></section>
    <div className="saf-material-documents">{documents.map(item => <a key={item.id} href={safMediaUrl(item.source)} download={`SAF-Avenue-${item.id}.pdf`}><span>PDF · {item.pages} страниц</span><strong>{item.title}</strong><span>Скачать оригинал ↓</span></a>)}</div>
    <div className="saf-material-tabs" role="tablist" aria-label="Материалы проекта">{tabs.map(([key, label]) => <button type="button" role="tab" key={key} id={`material-tab-${key}`} aria-selected={route.tab === key} aria-controls="material-panel" onClick={() => update({ tab: key })}>{label}</button>)}</div>
    <section id="material-panel" role="tabpanel" aria-labelledby={`material-tab-${route.tab}`}>
      {route.tab === 'gallery' && <><div className="saf-material-heading"><div><span className="saf-kicker">АРХИТЕКТУРА И ОБРАЗ ЖИЗНИ</span><h2>SAF Avenue в деталях</h2></div><span>{gallery.length} визуалов</span></div><div className="saf-material-topics">{topics.map(topic => <article key={topic.id}><img src={safMediaUrl(sectionUrls(topic.id)[0])} alt={topic.title} loading="lazy" /><div><h3>{topic.title}</h3><p>{topic.text}</p></div></article>)}</div><h2>Все визуалы с лендинга</h2><p>Включая ракурсы комплекса, общественные пространства, окружение и иллюстрации. Изображения застройщика могут меняться в ходе строительства.</p><div className="saf-media-grid">{gallery.map((asset, index) => <a key={asset.file} href={safMediaUrl(asset.source)} target="_blank" rel="noopener noreferrer"><img src={safMediaUrl(asset.source)} loading="lazy" alt={`SAF Avenue · визуал ${index + 1}`} /><span>Визуал {String(index + 1).padStart(2, '0')} ↗</span></a>)}</div></>}
      {route.tab === 'brochure' && <><div className="saf-material-heading"><div><span className="saf-kicker">ОРИГИНАЛЬНЫЕ ПРЕЗЕНТАЦИИ</span><h2>{document.title}</h2></div><label>Буклет<select aria-label="Буклет" value={route.document} onChange={event => update({ document: event.target.value, page: 1 })}>{documents.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div><div className="saf-brochure-controls"><button type="button" disabled={route.page === 1} onClick={() => update({ page: route.page - 1 })}>← Назад</button><label>Страница<select aria-label="Страница" value={route.page} onChange={event => update({ page: Number(event.target.value) })}>{Array.from({ length: document.pages }, (_, index) => <option key={index} value={index + 1}>{index + 1} / {document.pages}</option>)}</select></label><button type="button" disabled={route.page === document.pages} onClick={() => update({ page: route.page + 1 })}>Далее →</button></div><a className="saf-brochure-page" href={`${safMediaUrl(document.source)}#page=${route.page}`} target="_blank" rel="noopener noreferrer"><img src={brochurePage(document.id, route.page)} alt={`${document.title} · страница ${route.page}`} /></a><p className="saf-material-note">Нажмите на страницу, чтобы открыть оригинал PDF в полном качестве. Буклет и текущий каталог могут содержать разные редакции планировок.</p></>}
      {route.tab === 'floors' && <><div className="saf-material-heading"><div><span className="saf-kicker">13 СХЕМ ИЗ ЖИЛОГО БУКЛЕТА</span><h2>Планы этажей по блокам</h2></div><label>Блок<select aria-label="Блок" value={route.block} onChange={event => update({ block: event.target.value })}><option value="">Все блоки</option>{[1, 2, 3, 4, 5, 6, 7].map(block => <option key={block}>{block}</option>)}</select></label></div><div className="saf-source-notice"><p>Подписи блоков и этажей перенесены из буклета. «Типовой этаж» не означает подтверждённый диапазон этажей. Схемы не привязаны к номерам и статусам квартир: в публичном API контуры не опубликованы.</p></div><div className="saf-floor-sheets">{floorSheets.filter(sheet => !route.block || sheet.blocks.includes(Number(route.block))).map(sheet => <article key={sheet.page}><h3>{sheet.label}</h3><a href={`${safMediaUrl(documents[0].source)}#page=${sheet.page}`} target="_blank" rel="noopener noreferrer"><img src={brochurePage('residential', sheet.page)} alt={sheet.label} loading="lazy" /></a><button type="button" onClick={() => { update({ tab: 'brochure', document: 'residential', page: sheet.page }); documentScroll(); }}>Открыть страницу {sheet.page} →</button></article>)}</div></>}
      {route.tab === 'plans' && <><h2>27 планов квартир с лендинга</h2><p>Маркетинговые планы без номеров квартир. 150 вариантов с публичными кодами доступны в <a href={siteUrl('/saf')}>конструкторе</a>. Ещё 9 листов с отдельными планами — на страницах 26–34 жилого буклета.</p><div className="saf-source-notice"><p>У первого плана на странице подписано 49,29 м², а имя файла содержит 48,93. Сохраняем оригинал и расхождение; связь с конкретной квартирой по площади не устанавливаем.</p></div><div className="saf-media-grid plan-media">{apartmentUrls.map((url, index) => <a key={url} href={safMediaUrl(url)} target="_blank" rel="noopener noreferrer"><img src={safMediaUrl(url)} loading="lazy" alt={`Маркетинговый план ${index + 1} · ${areas[index]} м²`} /><span>{areas[index]} м² · открыть оригинал ↗</span></a>)}</div></>}
      {route.tab === 'commercial' && <><h2>Планы коммерческих помещений</h2><p>Оригинальные листы с лендинга, включая две опубликованные версии пары чертежей. Площадь и положение читаются на самих схемах; автоматическая связь с номерами помещений не утверждается.</p><a className="saf-primary-link" href={siteUrl('/saf/stock?kind=commercial')}>16 помещений в снимке шахматки →</a><div className="saf-media-grid plan-media">{commercialUrls.map((url, index) => <a key={url} href={safMediaUrl(url)} target="_blank" rel="noopener noreferrer"><img src={safMediaUrl(url)} loading="lazy" alt={`Коммерческий план · лист ${index + 1}`} /><span>Лист {index + 1} · оригинал ↗</span></a>)}</div></>}
    </section>
    <p className="saf-material-note">Источник: <a href={materials.source} target="_blank" rel="noopener noreferrer">официальный сайт SAF Avenue ↗</a>. Презентационные материалы не подтверждают актуальное наличие. Оригинальные логотипы и изображения сохранены без перерисовки.</p>
  </main>;
}
function documentScroll() { window.document.querySelector('.saf-material-tabs')?.scrollIntoView({ block: 'start' }); }
