import React, { lazy, Suspense } from 'react';
import { ArrowUpRight, Headphones, Box, FileText, Camera } from 'lucide-react';
import { siteUrl, sitePath, navigateTo } from '../lib/site';
import { ExperienceConfig, Flat } from '../lib/experience';
import editorial from '../data/editorial.json';

const Catalog = lazy(() => import('./Catalog').then((m) => ({ default: m.Catalog })));
const Visual = lazy(() => import('./Catalog').then((m) => ({ default: m.VisualSelector })));
const FlatPage = lazy(() => import('./Catalog').then((m) => ({ default: m.FlatPage })));
const Journey = lazy(() => import('./Journey').then(m=>({default:m.Journey})));
const FlatExperience = lazy(() => import('./FlatExperience').then(m=>({default:m.FlatExperience})));
const Audio = lazy(() => import('./AudioTour').then((m) => ({ default: m.AudioTour })));
const Tour = lazy(() => import('./SceneViewer').then((m) => ({ default: m.TourPage })));
const CloudTour = lazy(() => import('./SceneViewer').then((m) => ({ default: m.CloudTourPage })));
const Mortgage = lazy(() => import('./InfoPages').then((m) => ({ default: m.Mortgage })));
const Purchase = lazy(() => import('./InfoPages').then((m) => ({ default: m.Purchase })));
const Finishing = lazy(() => import('./InfoPages').then((m) => ({ default: m.Finishing })));
const Editorial = lazy(() => import('./InfoPages').then((m) => ({ default: m.Editorial })));
const Progress = lazy(() => import('./InfoPages').then((m) => ({ default: m.Progress })));
const Documents = lazy(() => import('./InfoPages').then((m) => ({ default: m.Documents })));
const Location = lazy(() => import('./InfoPages').then((m) => ({ default: m.LocationPage })));
const Contacts = lazy(() => import('./InfoPages').then((m) => ({ default: m.Contacts })));
const Privacy = lazy(() => import('./InfoPages').then((m) => ({ default: m.Privacy })));

interface ExperienceRoutesProps {
  flats: Flat[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  config: ExperienceConfig;
  onConsult: (topic: string) => void;
}

export const projectLinks: [string, string][] = [
  ['/#about', 'О проекте'],
  ['/#benefits', 'Преимущества'],
  ['/#layouts', 'Про квартиры'],
  ['/#finishing', 'Отделка'],
  ['/location', 'Расположение'],
  ['/akcii', 'Акции проекта'],
  ['/mortgage', 'Ипотечные программы'],
  ['/news', 'Новости проекта'],
  ['/how-to-buy', 'Как купить'],
  ['/progress', 'Ход строительства'],
  ['/documents', 'Документы'],
  ['/contacts', 'Контакты'],
  ['/audiogid', 'Аудиоэкскурсия'],
  ['/tour', '3D-тур'],
  ['/cloud-tour', 'Облачный 3D-тур']
];

export function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export function ExperienceRoutes(props: ExperienceRoutesProps) {
  const path = sitePath().replace(/\/$/, '') || '/';
  let page: React.ReactNode;

  switch (path) {
    case '/parametric-search':
      page = <Catalog {...props} />;
      break;
    case '/visual':
      page = <Journey {...props} />;
      break;
    case '/visual/free':
      page = <Visual {...props} />;
      break;
    case '/favorite':
      page = <Catalog {...props} onlyFavorites />;
      break;
    case '/audiogid':
      page = <Audio />;
      break;
    case '/tour':
      page = <Tour config={props.config} onConsult={props.onConsult} />;
      break;
    case '/cloud-tour':
      page = <CloudTour config={props.config} onConsult={props.onConsult} />;
      break;
    case '/mortgage':
      page = <Mortgage onConsult={props.onConsult} />;
      break;
    case '/how-to-buy':
      page = <Purchase onConsult={props.onConsult} />;
      break;
    case '/finishing':
      page = <Finishing onConsult={props.onConsult} />;
      break;
    case '/progress':
      page = <Progress config={props.config} onConsult={props.onConsult} />;
      break;
    case '/documents':
      page = <Documents config={props.config} flats={props.flats} />;
      break;
    case '/location':
      page = <Location />;
      break;
    case '/contacts':
      page = <Contacts onConsult={props.onConsult} />;
      break;
    case '/privacy':
    case '/policy':
      page = <Privacy />;
      break;
    case '/akcii':
      page = <Editorial kind="promos" />;
      break;
    case '/news':
      page = <Editorial kind="news" />;
      break;
    default:
      if (path.startsWith('/visual/section/')) {
        page = <Journey {...props} />;
      } else if (path.startsWith('/flat-classic/')) {
        page = <FlatPage {...props} key={path} id={safeDecode(path.slice(14))} />;
      } else if (path.startsWith('/flat/')) {
        page = <FlatExperience {...props} key={path} id={safeDecode(path.slice(6))} />;
      } else if (path.startsWith('/akcii/')) {
        page = <Editorial kind="promos" slug={safeDecode(path.slice(7))} />;
      } else if (path.startsWith('/news/')) {
        page = <Editorial kind="news" slug={safeDecode(path.slice(6))} />;
      } else {
        page = (
          <div className="experience-page empty">
            <h1>Страница не найдена</h1>
            <a
              className="button blue"
              href={siteUrl('/')}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/');
              }}
            >
              На главную
            </a>
          </div>
        );
      }
  }

  return (
    <main className="feature-main">
      <Suspense fallback={<div className="loading-panel" role="status">Загрузка раздела…</div>}>
        {page}
      </Suspense>
    </main>
  );
}

export function HomeExperiences() {
  return (
    <>
      <div id="advantages" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
      <section className="section feature-intro" id="benefits">
        <div className="section-heading">
          <span className="eyebrow">ЗНАКОМСТВО С ПРОЕКТОМ</span>
          <h2>
            Каждая деталь.
            <br />
            <span>В вашем ритме.</span>
          </h2>
        </div>

        <div className="experience-tiles">
          <a
            href={siteUrl('/visual')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/visual');
            }}
          >
            <Box />
            <span>01 / ВЫБОР КВАРТИРЫ</span>
            <h3>
              Выберите квартиру
              <br />
              на 3D-плане
            </h3>
            <ArrowUpRight />
          </a>

          <a
            href={siteUrl('/tour')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/tour');
            }}
          >
            <img src={siteUrl('/sensata/courtyard-1.jpg')} alt="Двор Shattyq" loading="lazy" />
            <span>02 / ВИРТУАЛЬНОЕ ЗНАКОМСТВО</span>
            <h3>
              Прогуляйтесь
              <br />
              по пространству
            </h3>
            <ArrowUpRight />
          </a>

          <a
            href={siteUrl('/audiogid')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/audiogid');
            }}
          >
            <Headphones />
            <span>03 / АУДИОЭКСКУРСИЯ</span>
            <h3>
              Послушайте
              <br />
              историю дома
            </h3>
            <ArrowUpRight />
          </a>
        </div>
      </section>

      <section className="section finishing-preview" id="finishing">
        <img src={siteUrl('/sensata/lobby-2.jpg')} alt="Входная группа Shattyq" loading="lazy" />
        <div>
          <span className="eyebrow">ОТДЕЛКА И МАТЕРИАЛЫ</span>
          <h2>
            Дом встречает
            <br />с порога.
          </h2>
          <p>Рассмотрите детали холлов и узнайте, что стоит уточнить о комплектации квартиры.</p>
          <a
            className="button blue"
            href={siteUrl('/finishing')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/finishing');
            }}
          >
            Исследовать детали <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      <div id="akcii" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
      <section className="section" id="promos">
        <div className="section-heading">
          <span className="eyebrow">АКЦИИ SENSATA GROUP</span>
          <h2>
            Возможности
            <br />
            <span>для вашей покупки.</span>
          </h2>
        </div>

        <div className="editorial-grid">
          {editorial.promos.slice(0, 3).map((p) => (
            <a
              className="editorial-card"
              href={siteUrl(`/akcii/${p.id}`)}
              key={p.id}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(`/akcii/${p.id}`);
              }}
            >
              <img src={siteUrl(p.image)} alt={p.title} loading="lazy" />
              <div>
                <small>Участие Shattyq уточняйте у менеджера</small>
                <h3>{p.title}</h3>
                <ArrowUpRight />
              </div>
            </a>
          ))}
        </div>

        <a
          className="text-link"
          href={siteUrl('/akcii')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/akcii');
          }}
        >
          Все предложения <ArrowUpRight size={17} />
        </a>
      </section>

      <section className="purchase-teaser" id="mortgage">
        <div>
          <span className="eyebrow">ИПОТЕЧНЫЕ ПРОГРАММЫ</span>
          <h2>
            Рассчитайте
            <br />
            комфортный платёж.
          </h2>
          <p>
            Меняйте сумму, срок и первый взнос.
            <br />
            Сравнивайте сценарии покупки в тенге.
          </p>
          <a
            href={siteUrl('/mortgage')}
            className="button white"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/mortgage');
            }}
          >
            Открыть калькулятор <ArrowUpRight size={18} />
          </a>
        </div>

        <div className="teaser-graphic">
          <span>Ваш первый взнос</span>
          <div />
          <span>Ваш срок</span>
          <div />
          <strong>Ваше решение.</strong>
        </div>
      </section>

      <section className="section home-resource-links" id="how-to-buy">
        <a
          href={siteUrl('/how-to-buy')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/how-to-buy');
          }}
        >
          <span>01 / ПОКУПКА</span>
          <h3>Как купить</h3>
          <p>Способы покупки и шаги оформления</p>
          <ArrowUpRight />
        </a>

        <a
          href={siteUrl('/progress')}
          id="progress"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/progress');
          }}
        >
          <Camera />
          <h3>Ход строительства</h3>
          <p>Фотоальбомы и онлайн-трансляции</p>
          <ArrowUpRight />
        </a>

        <div id="docs" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
        <a
          href={siteUrl('/documents')}
          id="documents"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/documents');
          }}
        >
          <FileText />
          <h3>Документы</h3>
          <p>Презентация и чертежи проекта</p>
          <ArrowUpRight />
        </a>
      </section>

      <section className="section home-news" id="news">
        <div className="section-heading">
          <span className="eyebrow">НОВОСТИ КОМПАНИИ</span>
          <h2>Sensata сегодня.</h2>
        </div>

        <div className="editorial-grid">
          {editorial.news.slice(0, 3).map((p) => (
            <a
              className="editorial-card"
              href={siteUrl(`/news/${p.id}`)}
              key={p.id}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(`/news/${p.id}`);
              }}
            >
              <img src={siteUrl(p.image)} alt={p.title} loading="lazy" />
              <div>
                <h3>{p.title}</h3>
                <ArrowUpRight />
              </div>
            </a>
          ))}
        </div>

        <a
          href={siteUrl('/news')}
          className="text-link"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/news');
          }}
        >
          Все новости <ArrowUpRight size={17} />
        </a>
      </section>
    </>
  );
}
