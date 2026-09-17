import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Menu,
  X,
  Heart,
  Expand,
  Download,
  Building2,
  Trees,
  ShieldCheck,
  ScanFace,
  LayoutGrid,
  Monitor,
  Globe,
  ChevronLeft,
  ChevronRight,
  Home,
  Info
} from 'lucide-react';
import { siteUrl, sitePath, navigateTo } from './lib/site';
import data from './data/shattyq.json';
import './styles/sensata.css';
import './styles/experience.css';
import { ExperienceRoutes, HomeExperiences, projectLinks } from './features/ExperienceRoutes';
import { LeadForm } from './features/LeadForm';
import { useExperience } from './lib/useExperience';

type Plan = typeof data.plans[number];
type Gallery = 'Архитектура' | 'Благоустройство' | 'Холлы';

const galleries: Record<Gallery, string[]> = {
  'Архитектура': ['/sensata/hero.jpg', '/sensata/architecture.jpg'],
  'Благоустройство': Array.from({ length: 11 }, (_, i) => `/sensata/courtyard-${i + 1}.jpg`),
  'Холлы': Array.from({ length: 13 }, (_, i) => `/sensata/lobby-${i + 1}.jpg`)
};

const address = 'Астана, район Есиль · Ә. Бөкейхана / Орынбор';
const mapLink = 'https://2gis.kz/astana/search/' + encodeURIComponent('Shattyq жилой комплекс');

function readFavorites(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem('sensata-shattyq-favorites') || '[]');
    return Array.isArray(stored)
      ? stored.filter((id: unknown) => typeof id === 'string' && data.plans.some((p) => p.id === id))
      : [];
  } catch {
    return [];
  }
}

// Глобальный счетчик для безопасной блокировки скролла при вложенных модалках
let modalOpenCount = 0;

interface ModalProps {
  children: React.ReactNode;
  close: () => void;
  label: string;
  wide?: boolean;
}

function Modal({ children, close, label, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    modalOpenCount++;
    if (modalOpenCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      modalOpenCount = Math.max(0, modalOpenCount - 1);
      if (modalOpenCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-label={label}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button className="icon modal-close" onClick={close} aria-label="Закрыть">
        <X />
      </button>
      {children}
    </dialog>
  );
}

export default function App() {
  const [mode, setMode] = useState<'web' | 'kiosk'>(() => {
    if (typeof location === 'undefined') return 'web';
    return new URLSearchParams(location.search).get('mode') === 'kiosk' ? 'kiosk' : 'web';
  });

  const [currentPath, setCurrentPath] = useState(() => sitePath());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { config, inventory, warning } = useExperience();
  const [contactTopic, setContactTopic] = useState('Консультация по Shattyq');

  const isHome = currentPath === '/' || currentPath === '/index.html';

  // Слушатель popstate для SPA навигации без полной перезагрузки
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(sitePath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openConsultModal = (topic: string) => {
    setContactTopic(topic);
    setIsContactOpen(true);
  };

  useEffect(() => {
    if (!isHome) {
      const activeLink = projectLinks.find(([url]) => url === currentPath);
      document.title = 'Shattyq · ' + (activeLink?.[1] || 'Выбор квартиры') + ' | Sensata Group';
    } else {
      document.title = 'ЖК Shattyq в Астане | Официальная презентация Sensata Group';
    }
  }, [isHome, currentPath]);

  const [roomFilter, setRoomFilter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeGallery, setActiveGallery] = useState<Gallery>('Архитектура');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [kioskSection, setKioskSection] = useState('overview');
  const [isPlanZoomed, setIsPlanZoomed] = useState(false);

  const shownPlans = data.plans.filter(
    (p) => (!roomFilter || p.rooms === roomFilter) && (!onlyFavorites || favorites.includes(p.id))
  );

  useEffect(() => {
    try {
      localStorage.setItem('sensata-shattyq-favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGalleryChange = (g: Gallery) => {
    setActiveGallery(g);
    setSlideIndex(0);
  };

  const handleNextSlide = (delta: number) => {
    const list = galleries[activeGallery];
    setSlideIndex((prev) => (prev + delta + list.length) % list.length);
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'web' ? 'kiosk' : 'web';
    setMode(nextMode);
    setIsMenuOpen(false);
    const url = new URL(location.href);
    url.searchParams.set('mode', nextMode);
    history.replaceState(null, '', url);
    window.scrollTo(0, 0);
  };

  const handleGoPlans = () => {
    if (mode === 'web') {
      navigateTo('/parametric-search');
      return;
    }
    setOnlyFavorites(false);
    setRoomFilter(0);
    if (mode === 'kiosk') {
      setKioskSection('layouts');
    } else {
      document.getElementById('layouts')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowFavorites = () => {
    if (mode === 'web') {
      navigateTo('/favorite');
      return;
    }
    setOnlyFavorites(true);
    setRoomFilter(0);
    setIsExpanded(true);
    if (mode === 'kiosk') {
      setKioskSection('layouts');
    } else {
      document.getElementById('layouts')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const galleryView = (
    <>
      <div className="gallery-controls">
        <div className="tabs">
          {(Object.keys(galleries) as Gallery[]).map((g) => (
            <button
              key={g}
              className={activeGallery === g ? 'active' : ''}
              aria-pressed={activeGallery === g}
              onClick={() => handleGalleryChange(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="arrows">
          <span>
            {String(slideIndex + 1).padStart(2, '0')} / {String(galleries[activeGallery].length).padStart(2, '0')}
          </span>
          <button className="icon" aria-label="Предыдущее фото" onClick={() => handleNextSlide(-1)}>
            <ChevronLeft />
          </button>
          <button className="icon" aria-label="Следующее фото" onClick={() => handleNextSlide(1)}>
            <ChevronRight />
          </button>
        </div>
      </div>

      <button
        className={`gallery-image ${activeGallery === 'Холлы' ? 'portrait' : ''}`}
        onClick={() => setIsLightboxOpen(true)}
        aria-label="Открыть фото на весь экран"
      >
        <img
          src={siteUrl(galleries[activeGallery][slideIndex])}
          alt={`Shattyq — ${activeGallery.toLowerCase()}, вид ${slideIndex + 1}`}
        />
        <span className="image-expand">
          <Expand size={19} />
        </span>
        <span className="image-caption">SHATTYQ / {activeGallery}</span>
      </button>
    </>
  );

  const plansView = (
    <>
      <div className="plan-toolbar">
        <div className="tabs" aria-label="Количество комнат">
          {[0, 2, 3, 4].map((num) => (
            <button
              key={num}
              className={roomFilter === num ? 'active' : ''}
              aria-pressed={roomFilter === num}
              onClick={() => {
                setRoomFilter(num);
                setIsExpanded(false);
              }}
            >
              {num ? `${num}-комнатные` : 'Все планировки'}
            </button>
          ))}
        </div>

        <button
          className={`favorite-filter ${onlyFavorites ? 'selected' : ''}`}
          onClick={() => {
            setOnlyFavorites((v) => !v);
            setIsExpanded(true);
          }}
        >
          <Heart size={17} fill={onlyFavorites ? 'currentColor' : 'none'} />
          Избранное ({favorites.length})
        </button>
      </div>

      <div className="results-line">
        <span>
          {shownPlans.length}{' '}
          {shownPlans.length === 1
            ? 'планировка'
            : shownPlans.length > 1 && shownPlans.length < 5
            ? 'планировки'
            : 'планировок'}{' '}
          · 1 очередь
        </span>
        <span>Стоимость и наличие — в отделе продаж</span>
      </div>

      <div className="plan-grid">
        {(isExpanded ? shownPlans : shownPlans.slice(0, 6)).map((plan) => (
          <article className="plan-card" key={plan.id}>
            <div className="plan-top">
              <span>{plan.rooms}-комнатная</span>
              <button
                className={`icon ${favorites.includes(plan.id) ? 'saved' : ''}`}
                aria-label={`${
                  favorites.includes(plan.id) ? 'Удалить из избранного' : 'В избранное'
                }: планировка ${plan.id.split('-')[1]}`}
                onClick={() => toggleFavorite(plan.id)}
              >
                <Heart size={20} fill={favorites.includes(plan.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button
              className="plan-image"
              onClick={() => {
                setSelectedPlan(plan);
                setIsPlanZoomed(false);
              }}
              aria-label={`Открыть планировку ${plan.id.split('-')[1]}`}
            >
              <img
                src={siteUrl(plan.image)}
                loading="lazy"
                alt={`${plan.rooms}-комнатная планировка Shattyq, вариант ${plan.id.split('-')[1]}`}
              />
            </button>

            <div className="plan-bottom">
              <div>
                <small>Вариант {plan.id.split('-')[1]?.padStart(2, '0')}</small>
                <strong>Цена по запросу</strong>
              </div>
              <button
                className="icon"
                onClick={() => {
                  setSelectedPlan(plan);
                  setIsPlanZoomed(false);
                }}
                aria-label={`Подробнее о планировке ${plan.id.split('-')[1]}`}
              >
                <ArrowUpRight />
              </button>
            </div>
          </article>
        ))}
      </div>

      {shownPlans.length === 0 && (
        <div className="empty">
          <Heart size={34} />
          <h3>Здесь будут ваши планировки</h3>
          <p>Нажмите на сердечко у понравившегося варианта.</p>
          <button
            className="button blue"
            onClick={() => {
              setOnlyFavorites(false);
              setRoomFilter(0);
            }}
          >
            Все планировки <ArrowRight size={18} />
          </button>
        </div>
      )}

      {!isExpanded && shownPlans.length > 6 && (
        <button className="button outline more" onClick={() => setIsExpanded(true)}>
          Показать все {shownPlans.length} планировок <ArrowDown size={17} />
        </button>
      )}
    </>
  );

  const locationView = (
    <div className="location-grid">
      <div>
        <span className="eyebrow">АСТАНА · ЕСИЛЬ</span>
        <h2>
          Ваш адрес.
          <br />
          Ваш ритм жизни.
        </h2>
        <p>Первая линия на пересечении улиц Ә. Бөкейхана и Орынбор. Городская инфраструктура рядом с домом.</p>
        <a
          className="button outline"
          href={siteUrl('/location')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/location');
          }}
        >
          Карта инфраструктуры <ArrowUpRight size={18} />
        </a>
        <a className="button blue" href={mapLink} target="_blank" rel="noreferrer">
          Открыть в 2ГИС <ArrowUpRight size={18} />
        </a>
      </div>

      <div className="location-visual">
        <img src={siteUrl('/sensata/architecture.jpg')} alt="Фасад Shattyq со стороны улицы" loading="lazy" />
        <div>
          <MapPin />
          <span>
            Shattyq
            <small>Ә. Бөкейхана / Орынбор</small>
          </span>
          <a href={mapLink} target="_blank" rel="noreferrer" aria-label="Показать Shattyq на карте">
            <ArrowUpRight />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`sensata ${mode === 'kiosk' ? 'terminal': ''}`}>
      <header className="header">
        <a
          className="brand"
          href={siteUrl('/')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          aria-label="Sensata Group — главная"
        >
          <img src={siteUrl('/sensata/logo.png')} alt="Sensata Group" />
        </a>

        <nav className="desktop-nav">
          {mode === 'web' ? (
            <>
              <details className="nav-dropdown">
                <summary>Квартиры</summary>
                <div>
                  <a
                    href={siteUrl('/visual')}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/visual');
                    }}
                  >
                    На 3D-плане
                  </a>
                  <a
                    href={siteUrl('/parametric-search')}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/parametric-search');
                    }}
                  >
                    По параметрам
                  </a>
                  <a
                    href={siteUrl('/favorite')}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/favorite');
                    }}
                  >
                    Избранное
                  </a>
                </div>
              </details>

              <details className="nav-dropdown">
                <summary>О проекте</summary>
                <div>
                  {projectLinks.slice(0, 12).map(([url, title]) => (
                    <a
                      key={url}
                      href={siteUrl(url)}
                      onClick={(e) => {
                        if (!url.startsWith('/#')) {
                          e.preventDefault();
                          navigateTo(url);
                        }
                      }}
                    >
                      {title}
                    </a>
                  ))}
                </div>
              </details>

              <a
                href={siteUrl('/audiogid')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/audiogid');
                }}
              >
                Аудиоэкскурсия
              </a>
              <a
                href={siteUrl('/tour')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/tour');
                }}
              >
                3D-тур
              </a>
            </>
          ) : (
            <span className="terminal-title">
              SHATTYQ <span>Интерактивная презентация</span>
            </span>
          )}
        </nav>

        <div className="header-actions">
          <a className="phone" href="tel:700">
            <Phone size={17} />
            <strong>700</strong>
            <span>Отдел продаж</span>
          </a>

          <button
            className="icon header-heart"
            onClick={handleShowFavorites}
            aria-label="Открыть избранное"
          >
            <Heart size={21} />
            {favorites.length > 0 && <b>{favorites.length}</b>}
          </button>

          <button
            className="icon menu-button"
            aria-label="Открыть меню"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
          </button>

          <button className="button blue header-cta" onClick={handleGoPlans}>
            Выбрать квартиру <ArrowUpRight size={17} />
          </button>
        </div>
      </header>

      {warning && (
        <div className="config-warning" role="status">
          {warning}
        </div>
      )}

      {mode === 'web' ? (
        !isHome ? (
          <ExperienceRoutes
            flats={inventory}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            config={config}
            onConsult={openConsultModal}
          />
        ) : (
          <main id="top">
            <section className="hero">
              <img
                className="hero-photo"
                src={siteUrl('/sensata/hero.jpg')}
                alt="Архитектура жилого комплекса Shattyq в Астане"
              />
              <div className="hero-shade" />
              <div className="hero-top">
                <span>ПРОЕКТ SENSATA GROUP</span>
                <span className="hero-badge">ПРЕМИУМ-КЛАСС</span>
              </div>
              <div className="hero-content">
                <span className="eyebrow">СЧАСТЬЕ БЫТЬ ДОМА</span>
                <h1>
                  Shattyq
                  <span>Жизнь в гармонии с собой.</span>
                </h1>
                <div className="hero-bottom">
                  <p>
                    <MapPin size={18} />
                    {address}
                  </p>
                  <button className="button white" onClick={handleGoPlans}>
                    Найти свою квартиру <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
              <a className="hero-scroll" href="#about" aria-label="Подробнее о проекте">
                <ArrowDown size={20} />
              </a>
            </section>

            <div className="facts">
              <div>
                <strong>9</strong>
                <span>этажей</span>
              </div>
              <div>
                <strong>3–4</strong>
                <span>квартиры на этаже</span>
              </div>
              <div>
                <strong>2–4</strong>
                <span>комнаты</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>видеонаблюдение</span>
              </div>
              <div className="fact-note">
                <span>
                  Камерный масштаб.
                  <br />
                  Большое внимание к деталям.
                </span>
                <ArrowUpRight />
              </div>
            </div>

            <section id="about" className="section about">
              <div className="section-heading">
                <span className="eyebrow">01 / О ПРОЕКТЕ</span>
                <h2>
                  Больше, чем дом.
                  <br />
                  <span>Место для вашей жизни.</span>
                </h2>
              </div>
              <div className="about-grid">
                <div className="about-photo">
                  <img src={siteUrl('/sensata/architecture.jpg')} alt="Детали фасада Shattyq" loading="lazy" />
                  <span>SHATTYQ · АСТАНА</span>
                </div>
                <div className="about-copy">
                  <span className="mini-label">ПРЕМИУМ В КАЖДОЙ ДЕТАЛИ</span>
                  <h3>
                    Личное пространство
                    <br />в большом городе
                  </h3>
                  <p>
                    Малоквартирный дом в районе Есиль: выразительная архитектура, свободные планировки и
                    приватная территория для жизни и отдыха.
                  </p>
                  <div className="benefits">
                    <div>
                      <Building2 />
                      <span>
                        Монолитный
                        <br />
                        железобетонный каркас
                      </span>
                    </div>
                    <div>
                      <Trees />
                      <span>
                        Закрытый двор
                        <br />
                        без автомобилей
                      </span>
                    </div>
                    <div>
                      <ScanFace />
                      <span>
                        Доступ в дом
                        <br />
                        по Face ID
                      </span>
                    </div>
                    <div>
                      <ShieldCheck />
                      <span>
                        Сквозные подъезды
                        <br />и видеонаблюдение
                      </span>
                    </div>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => openConsultModal('Консультация по Shattyq')}
                  >
                    Познакомиться с проектом <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            <section id="gallery" className="section gallery-section">
              <div className="section-heading">
                <span className="eyebrow">02 / ПРОСТРАНСТВО</span>
                <h2>
                  Красота, которая
                  <br />
                  <span>окружает каждый день.</span>
                </h2>
              </div>
              {galleryView}
            </section>

            <section id="layouts" className="section layouts-section">
              <div className="section-heading">
                <span className="eyebrow">03 / ПЛАНИРОВКИ</span>
                <h2>
                  У каждого счастья
                  <br />
                  <span>своя планировка.</span>
                </h2>
                <p>
                  Выберите пространство под свой образ жизни.
                  <br />
                  Оригинальные планы квартир Shattyq.
                </p>
              </div>
              {plansView}
            </section>

            <section className="blue-band">
              <span className="eyebrow">ПРОСТРАНСТВО ДЛЯ БЛИЗКИХ</span>
              <h2>
                Дома — спокойно.
                <br />
                Во дворе — счастливо.
              </h2>
              <p>
                Зелёные прогулочные дорожки, места отдыха
                <br />и закрытая территория без машин.
              </p>
              <button
                className="button white"
                onClick={() => {
                  handleGalleryChange('Благоустройство');
                  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Прогуляться по двору <ArrowUpRight size={18} />
              </button>
              <img
                src={siteUrl('/sensata/courtyard-1.jpg')}
                alt="Ландшафт и детская площадка Shattyq"
                loading="lazy"
              />
            </section>

            <section id="location" className="section">
              <span className="eyebrow location-number">04 / ЛОКАЦИЯ</span>
              {locationView}
            </section>

            <HomeExperiences />

            <section className="contact-section" id="contacts">
              <div>
                <span className="eyebrow">СЛЕДУЮЩИЙ ШАГ — ВАШ</span>
                <h2>
                  Давайте найдём
                  <br />
                  вашу квартиру.
                </h2>
                <p>
                  Стоимость, наличие и условия покупки
                  <br />у команды Sensata Group.
                </p>
              </div>
              <div className="contact-action">
                <a href="tel:700">
                  700 <ArrowUpRight />
                </a>
                <span>Единый колл-центр · Отдел продаж</span>
                <button
                  className="button blue"
                  onClick={() => openConsultModal('Консультация по Shattyq')}
                >
                  Получить консультацию <ArrowUpRight size={18} />
                </button>
              </div>
            </section>
          </main>
        )
      ) : (
        <main className="terminal-main">
          <aside className="terminal-sidebar">
            <span className="eyebrow">ЖИЛОЙ КОМПЛЕКС</span>
            <h1>Shattyq</h1>
            <span className="terminal-premium">Премиум-класс · Астана</span>

            <nav>
              {[
                ['overview', 'Обзор проекта', Home],
                ['gallery', 'Галерея', LayoutGrid],
                ['layouts', 'Планировки', Building2],
                ['location', 'Локация', MapPin],
                ['developer', 'О застройщике', Info]
              ].map(([id, title, Icon]) => {
                const IconComponent = Icon as typeof Home;
                return (
                  <button
                    key={id as string}
                    className={kioskSection === id ? 'active' : ''}
                    onClick={() => setKioskSection(id as string)}
                  >
                    <IconComponent size={20} />
                    {title as string}
                    <ArrowUpRight size={16} />
                  </button>
                );
              })}
            </nav>

            <div className="terminal-extra-links">
              <a
                href={siteUrl('/visual')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/visual');
                }}
              >
                Выбор на 3D-плане ↗
              </a>
              <a
                href={siteUrl('/tour')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/tour');
                }}
              >
                3D-тур ↗
              </a>
              <a
                href={siteUrl('/audiogid')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/audiogid');
                }}
              >
                Аудиоэкскурсия ↗
              </a>
              <a
                href={siteUrl('/mortgage')}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/mortgage');
                }}
              >
                Калькулятор покупки ↗
              </a>
            </div>

            <button
              className="button blue"
              onClick={() => openConsultModal('Консультация по Shattyq')}
            >
              Связаться с нами <Phone size={17} />
            </button>
          </aside>

          <div className="terminal-content" key={kioskSection}>
            {kioskSection === 'overview' && (
              <>
                <div className="terminal-hero">
                  <img src={siteUrl('/sensata/hero.jpg')} alt="Жилой комплекс Shattyq" />
                  <div>
                    <span className="eyebrow">СЧАСТЬЕ БЫТЬ ДОМА</span>
                    <h2>
                      Ваша жизнь.
                      <br />
                      Ваш Shattyq.
                    </h2>
                    <button className="button white" onClick={handleGoPlans}>
                      Выбрать планировку <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="terminal-facts">
                  <span>
                    <strong>9</strong> этажей
                  </span>
                  <span>
                    <strong>3–4</strong> квартиры на этаже
                  </span>
                  <span>
                    <strong>Face ID</strong> доступ в дом
                  </span>
                </div>

                <p className="terminal-address">
                  <MapPin size={18} />
                  {address}
                </p>
              </>
            )}

            {kioskSection === 'gallery' && (
              <>
                <h2>Галерея проекта</h2>
                {galleryView}
              </>
            )}

            {kioskSection === 'layouts' && (
              <>
                <h2>Найдите свою планировку</h2>
                {plansView}
              </>
            )}

            {kioskSection === 'location' && locationView}

            {kioskSection === 'developer' && (
              <div className="developer">
                <img src={siteUrl('/sensata/logo.png')} alt="Sensata Group" />
                <h2>
                  Дома, в которых
                  <br />
                  хочется жить.
                </h2>
                <p>
                  Sensata Group — девелопер жилой недвижимости в Астане и Алматы. Shattyq — один из
                  проектов компании в сегменте премиум.
                </p>
                <a
                  className="button blue"
                  href="https://sensata.kz/ru/about"
                  target="_blank"
                  rel="noreferrer"
                >
                  О компании <ArrowUpRight size={18} />
                </a>
              </div>
            )}
          </div>
        </main>
      )}

      <div className="prefooter-links">
        <a href={siteUrl('/documents/Shattyq-presentation.pdf')} download>
          <Download size={16} /> Скачать буклет
        </a>
        <a
          href={siteUrl('/parametric-search')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/parametric-search');
          }}
        >
          Квартиры
        </a>
        <a
          href={siteUrl('/tour')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/tour');
          }}
        >
          3D-тур
        </a>
        <a
          href={siteUrl('/audiogid')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/audiogid');
          }}
        >
          Аудиоэкскурсия
        </a>
        <a
          href={siteUrl('/contacts')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/contacts');
          }}
        >
          Контакты
        </a>
        <a
          href={siteUrl('/privacy')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/privacy');
          }}
        >
          Конфиденциальность
        </a>
      </div>

      <footer className="footer">
        <img src={siteUrl('/sensata/logo-white.png')} alt="Sensata Group" />
        <div>
          <span>Shattyq · Астана</span>
          <small>
            Материалы проекта —{' '}
            <a href={data.source} target="_blank" rel="noreferrer">
              sensata.kz <ArrowUpRight size={12} />
            </a>
          </small>
        </div>
        <span className="footer-note">
          Рендеры и планировки носят информационный характер.
          <br />
          Стоимость и наличие уточняйте в отделе продаж.
        </span>
        <button
          className="mode-button"
          onClick={() => {
            if (!isHome) {
              navigateTo('/?mode=kiosk');
              return;
            }
            handleToggleMode();
          }}
        >
          {mode === 'web' ? <Monitor size={17} /> : <Globe size={17} />}{' '}
          {mode === 'web' ? 'Режим терминала' : 'Веб-версия'}
        </button>
      </footer>

      {isMenuOpen && (
        <Modal close={() => setIsMenuOpen(false)} label="Навигация" wide>
          <div className="project-menu">
            <div>
              <img src={siteUrl('/sensata/logo.png')} alt="Sensata Group" />
              <span className="eyebrow">SHATTYQ · АСТАНА</span>
              <h2>
                Счастье
                <br />
                быть дома.
              </h2>
              <a
                className="button blue"
                href={siteUrl('/visual')}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMenuOpen(false);
                  navigateTo('/visual');
                }}
              >
                Выбрать квартиру на 3D-плане <ArrowUpRight size={17} />
              </a>
              <a
                className="button outline"
                href={siteUrl('/parametric-search')}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMenuOpen(false);
                  navigateTo('/parametric-search');
                }}
              >
                Выбрать квартиру по параметрам
              </a>
              <a
                className="text-link"
                href={siteUrl('/documents/Shattyq-presentation.pdf')}
                download
              >
                Скачать буклет <Download size={17} />
              </a>
            </div>

            <nav>
              {projectLinks.map(([url, title], i) => (
                <a
                  key={url}
                  href={siteUrl(url)}
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    if (!url.startsWith('/#')) {
                      e.preventDefault();
                      navigateTo(url);
                    }
                  }}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {title}
                  <ArrowUpRight size={17} />
                </a>
              ))}
            </nav>
          </div>
        </Modal>
      )}

      {isContactOpen && (
        <Modal close={() => setIsContactOpen(false)} label="Консультация по Shattyq">
          <LeadForm topic={contactTopic} endpoint={config.leadEndpoint} />
        </Modal>
      )}

      {selectedPlan && (
        <Modal
          close={() => setSelectedPlan(null)}
          label={`${selectedPlan.rooms}-комнатная планировка`}
          wide
        >
          <div className="plan-detail">
            <div className={`detail-image ${isPlanZoomed ? 'zoomed' : ''}`}>
              <button
                onClick={() => setIsPlanZoomed((v) => !v)}
                aria-label={isPlanZoomed ? 'Уменьшить чертёж' : 'Увеличить чертёж'}
              >
                <img src={siteUrl(selectedPlan.image)} alt="Оригинальный чертёж планировки Shattyq" />
              </button>
            </div>

            <div className="detail-copy">
              <span className="eyebrow">SHATTYQ · 1 ОЧЕРЕДЬ</span>
              <h2>
                {selectedPlan.rooms}-комнатная
                <br />
                планировка
              </h2>
              <p>Вариант {selectedPlan.id.split('-')[1]?.padStart(2, '0')}</p>

              <div className="price-info">
                <strong>Цена по запросу</strong>
                <span>Актуальную стоимость и наличие уточнит менеджер.</span>
              </div>

              <p className="detail-note">
                Размеры помещений, секция и этаж указаны на оригинальном чертеже. Нажмите на план, чтобы
                увеличить.
              </p>

              <button
                className="button blue"
                onClick={() => {
                  openConsultModal(`Планировка ${selectedPlan.id}: ${selectedPlan.rooms} комнаты`);
                  setSelectedPlan(null);
                }}
              >
                Узнать стоимость <ArrowUpRight size={18} />
              </button>

              <button className="button outline" onClick={() => toggleFavorite(selectedPlan.id)}>
                <Heart
                  size={18}
                  fill={favorites.includes(selectedPlan.id) ? 'currentColor' : 'none'}
                />
                {favorites.includes(selectedPlan.id) ? 'В избранном' : 'Сохранить планировку'}
              </button>

              <a
                className="text-link"
                href={siteUrl(`/flat/${selectedPlan.id}`)}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedPlan(null);
                  navigateTo(`/flat/${selectedPlan.id}`);
                }}
              >
                Полная информация о планировке <ArrowUpRight size={18} />
              </a>

              <a
                className="text-link"
                href={siteUrl(selectedPlan.image)}
                download={`Shattyq-${selectedPlan.rooms}rooms-${selectedPlan.id}.jpg`}
              >
                Скачать чертёж <Download size={18} />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {isLightboxOpen && (
        <Modal
          close={() => setIsLightboxOpen(false)}
          label={`Галерея: ${activeGallery}`}
          wide
        >
          <div className="lightbox">
            <img
              src={siteUrl(galleries[activeGallery][slideIndex])}
              alt={`${activeGallery} Shattyq — ${slideIndex + 1}`}
            />
            <div>
              <button
                className="icon"
                aria-label="Предыдущее фото"
                onClick={() => handleNextSlide(-1)}
              >
                <ArrowLeft />
              </button>
              <span>
                {activeGallery} · {slideIndex + 1} / {galleries[activeGallery].length}
              </span>
              <button
                className="icon"
                aria-label="Следующее фото"
                onClick={() => handleNextSlide(1)}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
