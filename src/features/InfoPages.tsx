import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  Download,
  Phone,
  MapPin,
  Mail,
  FileText,
  Camera,
  Video,
  ChevronRight,
  Plus,
  Check,
  Play
} from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';
import { ExperienceConfig, Flat, calculateMortgage, money } from '../lib/experience';
import editorial from '../data/editorial.json';

interface ConsultProps {
  onConsult: (topic: string) => void;
}

export function Mortgage({ onConsult, initialPrice, embedded=false }: ConsultProps & {initialPrice?:number;embedded?:boolean}) {
  const queryPrice = Number(
    typeof location !== 'undefined' ? new URLSearchParams(location.search).get('price') : 0
  );
  const [price, setPrice] = useState(initialPrice || (queryPrice > 0 ? queryPrice : 50000000));
  const [percent, setPercent] = useState(30);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(18);
  const [kind, setKind] = useState<'mortgage' | 'installment' | 'full'>('mortgage');
  const [months, setMonths] = useState(24);
  const [showSchedule, setShowSchedule] = useState(false);

  const downPayment = (price * percent) / 100;
  const mortgageResult = calculateMortgage(price, downPayment, years, rate);

  const yearlyRows: { year: number; balance: number; interest: number; paid: number }[] = [];
  let currentBalance = mortgageResult.principal;

  for (let y = 1; y <= years; y++) {
    let yearlyInterest = 0;
    let yearlyPaid = 0;

    for (let m = 0; m < 12; m++) {
      const monthlyInt = (currentBalance * rate) / 1200;
      const principalPaid = Math.min(currentBalance, Math.max(0, mortgageResult.payment - monthlyInt));
      currentBalance = Math.max(0, currentBalance - principalPaid);
      yearlyInterest += monthlyInt;
      yearlyPaid += principalPaid + monthlyInt;
    }

    yearlyRows.push({
      year: y,
      balance: currentBalance,
      interest: yearlyInterest,
      paid: yearlyPaid
    });
  }

  const downloadCsv = () => {
    const header = '\uFEFFГод;Платежи;Проценты;Остаток\n';
    const body = yearlyRows
      .map((r) => [r.year, r.paid.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(';'))
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Shattyq-calculation.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const monthlyPaymentAmount =
    kind === 'full'
      ? price
      : kind === 'installment'
      ? (price - downPayment) / months
      : mortgageResult.payment;

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ИПОТЕЧНЫЕ ПРОГРАММЫ</span>
        {embedded?<h2>Как купить эту квартиру</h2>:<h1>
          Планируйте покупку
          <br />в удобном для вас темпе.
        </h1>}
        <p>
          Пример расчёта в тенге. Введите стоимость и условия, полученные от банка или менеджера.
          Значения по умолчанию не являются публичной офертой.
        </p>
      </div>

      <div className="tabs feature-tabs">
        <button
          className={kind === 'mortgage' ? 'active' : ''}
          onClick={() => setKind('mortgage')}
        >
          Ипотека
        </button>
        <button
          className={kind === 'installment' ? 'active' : ''}
          onClick={() => setKind('installment')}
        >
          Рассрочка
        </button>
        <button className={kind === 'full' ? 'active' : ''} onClick={() => setKind('full')}>
          100% оплата
        </button>
      </div>

      <div className="calculator">
        <div className="calculator-fields">
          <label>
            Стоимость квартиры, ₸
            <input
              aria-label="Стоимость квартиры"
              type="number"
              min="1000000"
              max="500000000"
              step="1000000"
              value={price}
              onChange={(e) =>
                setPrice(Math.max(0, Math.min(500000000, Number(e.target.value))))
              }
            />
          </label>

          {kind !== 'full' && (
            <>
              <label>
                Первоначальный взнос <strong>{percent}% · {money(downPayment)}</strong>
                <input
                  aria-label="Первоначальный взнос"
                  type="range"
                  min="0"
                  max="100"
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                />
              </label>

              {kind === 'mortgage' ? (
                <>
                  <label>
                    Срок <strong>{years} лет</strong>
                    <input
                      aria-label="Срок ипотеки"
                      type="range"
                      min="1"
                      max="30"
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                    />
                  </label>

                  <label>
                    Годовая ставка, %
                    <input
                      aria-label="Годовая ставка"
                      type="number"
                      min="0"
                      max="40"
                      step="0.1"
                      value={rate}
                      onChange={(e) =>
                        setRate(Math.max(0, Math.min(40, Number(e.target.value))))
                      }
                    />
                  </label>
                </>
              ) : (
                <label>
                  Количество месяцев <strong>{months}</strong>
                  <input
                    aria-label="Срок рассрочки"
                    type="range"
                    min="1"
                    max="60"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                  />
                </label>
              )}
            </>
          )}
        </div>

        <div className="calculator-result">
          <span>{kind === 'full' ? 'СУММА ПОКУПКИ' : 'ЕЖЕМЕСЯЧНЫЙ ПЛАТЁЖ'}</span>
          <strong data-testid="monthly-payment">{money(monthlyPaymentAmount)}</strong>

          <dl>
            {kind !== 'full' && (
              <>
                <div>
                  <dt>Первый взнос</dt>
                  <dd>{money(downPayment)}</dd>
                </div>
                <div>
                  <dt>Остаток стоимости</dt>
                  <dd>{money(mortgageResult.principal)}</dd>
                </div>
              </>
            )}
            {kind === 'mortgage' && (
              <div>
                <dt>Проценты за весь срок</dt>
                <dd>{money(mortgageResult.interest)}</dd>
              </div>
            )}
          </dl>

          <p>
            {kind === 'mortgage'
              ? 'Аннуитетный расчёт без страхования, комиссий и изменения ставки.'
              : kind === 'installment'
              ? 'Пример равномерных платежей без процентов. Реальный график согласуется отдельно.'
              : 'Скидка за полную оплату не заложена: её наличие и размер нужно подтвердить.'}
          </p>

          <button
            className="button white"
            onClick={() =>
              onConsult(`Условия покупки: ${kind}, сумма ${money(price)}, взнос ${percent}%`)
            }
          >
            Уточнить условия <ArrowUpRight size={17} />
          </button>
        </div>
      </div>

      {kind === 'mortgage' && (
        <>
          <div className="feature-bottom">
            <button className="text-link" onClick={() => setShowSchedule(!showSchedule)}>
              {showSchedule ? 'Скрыть' : 'Показать'} график по годам <ChevronRight size={16} />
            </button>
            <button className="text-link" onClick={downloadCsv}>
              Скачать расчёт CSV <Download size={17} />
            </button>
          </div>

          {showSchedule && (
            <div className="flat-table">
              <table>
                <thead>
                  <tr>
                    <th>Год</th>
                    <th>Платежи</th>
                    <th>Проценты</th>
                    <th>Остаток долга</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyRows.map((r) => (
                    <tr key={r.year}>
                      <td>{r.year}</td>
                      <td>{money(r.paid)}</td>
                      <td>{money(r.interest)}</td>
                      <td>{money(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <section className="related-section">
        <span className="eyebrow">ПРОГРАММЫ SENSATA GROUP</span>
        <h2>Узнайте о доступных возможностях</h2>
        <p className="muted-note">
          Применимость программ к Shattyq и условия на дату обращения необходимо подтвердить.
        </p>

        <div className="editorial-grid">
          {editorial.promos
            .filter((p) => /ипот|Sanaly/i.test(p.title))
            .map((p) => (
              <a
                className="editorial-card"
                key={p.id}
                href={siteUrl(`/akcii/${p.id}`)}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(`/akcii/${p.id}`);
                }}
              >
                <img src={siteUrl(p.image)} alt={p.title} loading="lazy" />
                <div>
                  <small>Sensata Group</small>
                  <h3>{p.title}</h3>
                  <ArrowUpRight />
                </div>
              </a>
            ))}
        </div>
      </section>
    </div>
  );
}

export function Purchase({ onConsult }: ConsultProps) {
  const [method, setMethod] = useState('Ипотека');
  const methods = ['Ипотека', 'Рассрочка', '100% оплата'];

  const steps = [
    ['01', 'Выберите планировку', 'Сравните варианты, сохраните понравившиеся и скачайте чертежи.'],
    ['02', 'Уточните условия', 'Менеджер подтвердит стоимость, наличие и доступные способы покупки.'],
    ['03', 'Проверьте документы', 'Получите документы по выбранной квартире и согласуйте условия.'],
    ['04', 'Оформите покупку', 'Согласуйте с отделом продаж порядок подписания и график платежей.']
  ];

  const faqs = [
    [
      'Почему нет цены у планировки?',
      'В открытом каталоге Shattyq цены не опубликованы. Планировки представлены для выбора решения, а точную стоимость сообщает менеджер.'
    ],
    [
      'Можно ли сохранить несколько квартир?',
      'Да. Используйте избранное и сравнение в каталоге. Избранное сохранится на этом устройстве.'
    ],
    [
      'Как посмотреть документы?',
      'В разделе «Документы» доступны материалы презентации. Официальные договорные документы по квартире запрашиваются у отдела продаж.'
    ],
    [
      'Где находится офис Sensata?',
      'Один из офисов в Астане: ул. Сарайшык, 34А, БЦ Dara Residence. Подтвердите место встречи по номеру 700.'
    ]
  ];

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / КАК КУПИТЬ</span>
        <h1>
          Четыре шага
          <br />к новому пространству.
        </h1>
      </div>

      <div className="steps-grid">
        {steps.map(([num, title, desc]) => (
          <article key={num}>
            <span>{num}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>

      <div className="tabs feature-tabs">
        {methods.map((m) => (
          <button
            key={m}
            className={method === m ? 'active' : ''}
            onClick={() => setMethod(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="purchase-panel">
        <h2>{method}</h2>
        <p>
          {method === 'Ипотека'
            ? 'Сравните ежемесячный платёж при разных ставках, сроках и первоначальном взносе. Участие Shattyq в конкретной банковской программе подтверждает отдел продаж.'
            : method === 'Рассрочка'
            ? 'Подберите комфортный первый взнос и срок с помощью калькулятора. Возможность рассрочки и окончательный график уточняются для выбранной квартиры.'
            : 'Уточните окончательную стоимость выбранной квартиры и порядок полной оплаты. Не отправляйте платежи без проверки документов и реквизитов.'}
        </p>

        <a
          className="button outline"
          href={siteUrl('/mortgage')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/mortgage');
          }}
        >
          Калькулятор покупки <ArrowUpRight size={17} />
        </a>

        <button className="button blue" onClick={() => onConsult(`Способ покупки: ${method}`)}>
          Обсудить с менеджером
        </button>
      </div>

      <div className="faq">
        <h2>Частые вопросы</h2>
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <Plus size={18} />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function Finishing({ onConsult }: ConsultProps) {
  const [tab, setTab] = useState<'lobby' | 'flat'>('lobby');
  const [activeHotspot, setActiveHotspot] = useState(0);
  const [panPosition, setPanPosition] = useState(50);
  const dragStart = useRef<number | null>(null);

  const hotspots = [
    {
      x: 31,
      y: 26,
      title: 'Освещение',
      text: 'На рендерах холлов показаны потолочные светильники. Точную спецификацию материалов и оборудования предоставит застройщик.'
    },
    {
      x: 68,
      y: 53,
      title: 'Входная группа',
      text: 'Сквозные подъезды связывают уличную сторону и внутренний двор.'
    },
    {
      x: 49,
      y: 80,
      title: 'Материалы холла',
      text: 'Визуализация передаёт цветовую гамму и характер отделки общего пространства.'
    }
  ];

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ОТДЕЛКА</span>
        <h1>
          Внимание к деталям.
          <br />С первого шага домой.
        </h1>
        <p>Исследуйте входные группы на рендерах. Комплектация передаваемой квартиры уточняется отдельно.</p>
      </div>

      <div className="tabs feature-tabs">
        <button
          className={tab === 'lobby' ? 'active' : ''}
          onClick={() => setTab('lobby')}
        >
          Холлы
        </button>
        <button
          className={tab === 'flat' ? 'active' : ''}
          onClick={() => setTab('flat')}
        >
          Квартира
        </button>
      </div>

      {tab === 'lobby' ? (
        <>
          <div
            className="hotspot-scene"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              dragStart.current = e.clientX;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (dragStart.current !== null) {
                setPanPosition((prev) =>
                  Math.max(0, Math.min(100, prev + (dragStart.current! - e.clientX) * 0.12))
                );
                dragStart.current = e.clientX;
              }
            }}
            onPointerUp={() => {
              dragStart.current = null;
            }}
            onPointerCancel={() => {
              dragStart.current = null;
            }}
          >
            <div
              className="hotspot-pan"
              style={{ transform: `translateX(${-panPosition / 3}%)` }}
            >
              <img
                src={siteUrl('/sensata/lobby-1.jpg')}
                alt="Оригинальная визуализация холла Shattyq"
                draggable={false}
              />
              {hotspots.map((pt, i) => (
                <button
                  className={`hotspot ${activeHotspot === i ? 'active' : ''}`}
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                  aria-label={pt.title}
                  key={pt.title}
                  onClick={() => setActiveHotspot(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="hotspot-info">
              <span>0{activeHotspot + 1} / ДЕТАЛИ ПРОСТРАНСТВА</span>
              <h3>{hotspots[activeHotspot].title}</h3>
              <p>{hotspots[activeHotspot].text}</p>
            </div>
          </div>

          <label className="pan-slider">
            Перемещение по изображению
            <input
              aria-label="Положение изображения отделки"
              type="range"
              min="0"
              max="100"
              value={panPosition}
              onChange={(e) => setPanPosition(Number(e.target.value))}
            />
          </label>
        </>
      ) : (
        <div className="finishing-flat">
          <img src={siteUrl('/sensata/plan-1.jpg')} alt="Свободная планировка квартиры Shattyq" />
          <div>
            <h2>
              Пространство
              <br />для ваших решений
            </h2>
            <p>
              Для Shattyq заявлены свободные планировки. Тип отделки квартиры, инженерные системы и
              состав работ при передаче необходимо подтвердить по документации выбранного лота.
            </p>
            <button
              className="button blue"
              onClick={() => onConsult('Комплектация и отделка квартиры')}
            >
              Запросить спецификацию
            </button>
            <a
              className="text-link"
              href={siteUrl('/tour')}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/tour');
              }}
            >
              Посмотреть демонстрацию 3D-интерьера <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function Editorial({ kind, slug }: { kind: 'promos' | 'news'; slug?: string }) {
  const [filter, setFilter] = useState('all');
  const records = editorial[kind];
  const item = records.find((p) => p.id === slug);

  if (slug && !item) {
    return (
      <div className="experience-page empty">
        <h1>Материал не найден</h1>
        <a
          href={siteUrl(kind === 'promos' ? '/akcii' : '/news')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(kind === 'promos' ? '/akcii' : '/news');
          }}
        >
          Вернуться к списку
        </a>
      </div>
    );
  }

  if (item) {
    return (
      <div className="experience-page article-page">
        <a
          className="text-link"
          href={siteUrl(kind === 'promos' ? '/akcii' : '/news')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(kind === 'promos' ? '/akcii' : '/news');
          }}
        >
          <ArrowLeft size={16} /> {kind === 'promos' ? 'Все предложения' : 'Все новости'}
        </a>

        <span className="eyebrow">
          SENSATA GROUP / {kind === 'promos' ? 'ПРЕДЛОЖЕНИЕ' : 'НОВОСТИ КОМПАНИИ'}
        </span>
        <h1>{item.title}</h1>
        <img className="article-hero" src={siteUrl(item.image)} alt={item.title} />

        <div className="article-content">
          <h2>{kind === 'promos' ? 'Условия предложения' : 'Информация от Sensata Group'}</h2>
          <p>
            {kind === 'promos'
              ? 'Предложение опубликовано Sensata Group. Срок действия, участвующие проекты и применимость к Shattyq уточняйте на официальной странице и у менеджера.'
              : 'Материал опубликован на сайте Sensata Group. Полная публикация и дата доступны по ссылке на источник.'}
          </p>
          <a className="button blue" href={item.source} target="_blank" rel="noreferrer">
            Читать на sensata.kz <ArrowUpRight size={18} />
          </a>
          <a className="button outline" href={siteUrl('tel:700')}>
            <Phone size={17} /> Уточнить по номеру 700
          </a>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(
    (p) =>
      filter === 'all' ||
      (filter === 'mortgage' ? /ипот|Sanaly/i.test(p.title) : !/ипот|Sanaly/i.test(p.title))
  );

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SENSATA GROUP / {kind === 'promos' ? 'АКЦИИ' : 'НОВОСТИ'}</span>
        <h1>{kind === 'promos' ? 'Возможности для вашей покупки' : 'Жизнь и новости Sensata'}</h1>
        <p>
          {kind === 'promos'
            ? 'Предложения компании. Участие Shattyq и действующие условия подтверждает отдел продаж.'
            : 'Официальные публикации компании. Не являются отчётами о строительстве Shattyq.'}
        </p>
      </div>

      {kind === 'promos' && (
        <div className="tabs feature-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Все предложения
          </button>
          <button
            className={filter === 'mortgage' ? 'active' : ''}
            onClick={() => setFilter('mortgage')}
          >
            Ипотека
          </button>
          <button
            className={filter === 'other' ? 'active' : ''}
            onClick={() => setFilter('other')}
          >
            Другие предложения
          </button>
        </div>
      )}

      <div className="editorial-grid">
        {filteredRecords.map((p) => (
          <a
            className="editorial-card"
            key={p.id}
            href={siteUrl(`/${kind === 'promos' ? 'akcii' : 'news'}/${p.id}`)}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(`/${kind === 'promos' ? 'akcii' : 'news'}/${p.id}`);
            }}
          >
            <img src={siteUrl(p.image)} alt={p.title} loading="lazy" />
            <div>
              <small>Sensata Group · Официальная публикация</small>
              <h3>{p.title}</h3>
              <span>
                Подробнее <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Progress({ config, onConsult }: { config: ExperienceConfig; onConsult: (s: string) => void }) {
  const [tab, setTab] = useState<'photos' | 'live'>('photos');
  const [albumId, setAlbumId] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [camera, setCamera] = useState(config.cameras[0]?.id || '');

  const albums = config.constructionAlbums;
  const currentAlbum = albums.find((a) => a.id === albumId) || albums[0];
  const liveCamera = config.cameras.find((c) => c.id === camera) || config.cameras[0];

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ХОД СТРОИТЕЛЬСТВА</span>
        <h1>
          Следите за тем,
          <br />как растёт ваш дом.
        </h1>
        <p>Фотоотчёты и камеры проекта подключаются по мере получения исходных материалов.</p>
      </div>

      <div className="tabs feature-tabs">
        <button
          className={tab === 'photos' ? 'active' : ''}
          onClick={() => setTab('photos')}
        >
          <Camera size={16} /> Фотоальбомы
        </button>
        <button
          className={tab === 'live' ? 'active' : ''}
          onClick={() => setTab('live')}
        >
          <Video size={16} /> Онлайн-трансляции
        </button>
      </div>

      {tab === 'photos' ? (
        currentAlbum ? (
          <>
            <div className="tabs feature-tabs">
              {albums.map((a) => (
                <button
                  key={a.id}
                  className={currentAlbum.id === a.id ? 'active' : ''}
                  onClick={() => {
                    setAlbumId(a.id);
                    setPhotoIndex(0);
                  }}
                >
                  {a.title}
                </button>
              ))}
            </div>

            <div className="progress-photo">
              <img
                src={siteUrl(currentAlbum.images[photoIndex])}
                alt={`${currentAlbum.title}, фото ${photoIndex + 1}`}
              />
              <a
                href={siteUrl(currentAlbum.images[photoIndex])}
                download
                className="icon"
                aria-label="Скачать фото"
              >
                <Download />
              </a>
            </div>

            <div className="progress-thumbs">
              {currentAlbum.images.map((img, i) => (
                <button
                  className={photoIndex === i ? 'active' : ''}
                  key={img}
                  onClick={() => setPhotoIndex(i)}
                  aria-label={`Фото ${i + 1}`}
                >
                  <img src={siteUrl(img)} alt="" />
                </button>
              ))}
            </div>

            <p>
              {currentAlbum.date} · {photoIndex + 1} / {currentAlbum.images.length}
            </p>
          </>
        ) : (
          <div className="media-empty">
            <Camera size={36} />
            <h2>Фотоотчёты пока не опубликованы</h2>
            <p>
              На открытой странице Shattyq нет датированных альбомов строительства. Архитектурные
              рендеры доступны в галерее проекта.
            </p>
            <button
              className="button blue"
              onClick={() => onConsult('Запрос фотоотчёта строительства Shattyq')}
            >
              Запросить фотоотчёт
            </button>
            <a
              className="button outline"
              href={siteUrl('/#gallery')}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#gallery');
              }}
            >
              Галерея проекта
            </a>
          </div>
        )
      ) : liveCamera ? (
        <>
          <div className="tabs feature-tabs">
            {config.cameras.map((c) => (
              <button
                key={c.id}
                className={liveCamera.id === c.id ? 'active' : ''}
                onClick={() => setCamera(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>

          <iframe
            className="live-frame"
            src={siteUrl(liveCamera.url)}
            title={liveCamera.title}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </>
      ) : (
        <div className="media-empty">
          <Video size={36} />
          <h2>Камеры ещё не подключены</h2>
          <p>
            После получения ссылки на камеру здесь появится трансляция. Сейчас видео со строительной
            площадки Shattyq недоступно.
          </p>
          <button
            className="button blue"
            onClick={() => onConsult('Онлайн-трансляция строительства Shattyq')}
          >
            Уточнить у менеджера
          </button>
        </div>
      )}
    </div>
  );
}

export function Documents({ config, flats }: { config: ExperienceConfig; flats: Flat[] }) {
  const [category, setCategory] = useState('Презентация');
  const categories = [
    'Презентация',
    'Планировки',
    ...new Set(config.documents.map((d) => d.category))
  ];

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ДОКУМЕНТЫ</span>
        <h1>
          Всё важное
          <br />под рукой.
        </h1>
        <p>
          Презентационные материалы и оригинальные чертежи. Официальные разрешения и договорные
          документы предоставляются отделом продаж.
        </p>
      </div>

      <div className="tabs feature-tabs">
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? 'active' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="document-list">
        {category === 'Презентация' ? (
          <a href={siteUrl('/documents/Shattyq-presentation.pdf')} download>
            <FileText />
            <div>
              <h3>Shattyq. Презентация проекта</h3>
              <p>PDF · Подготовлено по материалам Sensata Group</p>
            </div>
            <Download />
          </a>
        ) : category === 'Планировки' ? (
          flats.map((p) => (
            <a key={p.id} href={siteUrl(p.image)} download>
              <FileText />
              <div>
                <h3>
                  {p.rooms}-комнатная · Вариант {p.id.split('-')[1]}
                </h3>
                <p>
                  JPG · Секция {p.section}, этаж {p.floor}
                </p>
              </div>
              <Download />
            </a>
          ))
        ) : (
          config.documents
            .filter((d) => d.category === category)
            .map((d) => (
              <a key={d.id} href={siteUrl(d.url)} download target="_blank" rel="noreferrer">
                <FileText />
                <div>
                  <h3>{d.title}</h3>
                  <p>{d.date || 'Документ проекта'}</p>
                </div>
                <Download />
              </a>
            ))
        )}
      </div>
    </div>
  );
}

export function LocationPage() {
  const [category, setCategory] = useState('ЖК Shattyq');
  const categories = ['ЖК Shattyq', 'Школы', 'Детские сады', 'Магазины', 'Клиники', 'Парки', 'Кафе'];
  const query =
    category === 'ЖК Shattyq'
      ? 'Shattyq Астана Бокейхана Орынбор'
      : `${category} рядом с ЖК Shattyq Астана`;

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / РАСПОЛОЖЕНИЕ</span>
        <h1>
          Город рядом.
          <br />Дом — ваш.
        </h1>
        <p>Астана, район Есиль. Первая линия на пересечении Ә. Бөкейхана и Орынбор.</p>
      </div>

      <div className="tabs feature-tabs">
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? 'active' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <iframe
        className="location-map"
        title={`Карта: ${category}`}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="feature-bottom">
        <p>
          Объекты и результаты поиска предоставлены картографическим сервисом. Расстояния и маршруты
          уточняйте на карте.
        </p>
        <a
          className="button blue"
          href={`https://2gis.kz/astana/search/${encodeURIComponent(query)}`}
          target="_blank"
          rel="noreferrer"
        >
          Открыть в 2ГИС <ArrowUpRight size={18} />
        </a>
      </div>

      <a
        className="button outline"
        href={siteUrl('/audiogid')}
        onClick={(e) => {
          e.preventDefault();
          navigateTo('/audiogid');
        }}
      >
        <Play size={17} /> Аудиоэкскурсия по проекту
      </a>
    </div>
  );
}

export function Contacts({ onConsult }: ConsultProps) {
  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SENSATA GROUP / КОНТАКТЫ</span>
        <h1>Начнём с разговора.</h1>
        <p>Подтвердите удобное время и офис встречи по телефону.</p>
      </div>

      <div className="contact-cards">
        <article>
          <Phone />
          <h3>Отдел продаж</h3>
          <a className="contact-number" href="tel:700">
            700
          </a>
          <a href="tel:+77789793030">+7 778 979 30 30 · Астана</a>
          <button
            className="button blue"
            onClick={() => onConsult('Запись на консультацию по Shattyq')}
          >
            Записаться на консультацию
          </button>
        </article>

        <article>
          <MapPin />
          <h3>Офис в Астане</h3>
          <p>
            ул. Сарайшык, 34А
            <br />
            БЦ Dara Residence
          </p>
          <a
            className="text-link"
            href={`https://2gis.kz/astana/search/${encodeURIComponent('Sensata Сарайшык 34А')}`}
            target="_blank"
            rel="noreferrer"
          >
            Построить маршрут <ArrowUpRight size={17} />
          </a>
        </article>

        <article>
          <Mail />
          <h3>Связаться с компанией</h3>
          <a href="mailto:info@sensata.kz">info@sensata.kz</a>
          <p>Sensata Service</p>
          <a href="tel:88000700909">8 800 070 09 09</a>
          <a
            className="text-link"
            href="https://sensata.kz/ru/contacts"
            target="_blank"
            rel="noreferrer"
          >
            Все офисы и контакты <ArrowUpRight size={17} />
          </a>
        </article>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="experience-page article-content">
      <h1>Данные и конфиденциальность</h1>

      <h2>Избранное</h2>
      <p>
        Выбранные планировки хранятся в localStorage вашего браузера под ключом sensata-shattyq-favorites.
        Их можно удалить кнопками избранного или очисткой данных сайта.
      </p>

      <h2>Заявки</h2>
      <p>
        В текущем режиме имя, телефон и выбранный интерес сохраняются только на локальном сервере этой
        презентации. Передача в CRM Sensata не подключена. Не вводите реальные персональные данные для
        демонстрационных проверок.
      </p>

      <h2>Внешние сервисы</h2>
      <p>
        Карта загружается с Google Maps. Переходы в 2ГИС, на сайт Sensata и телефонные ссылки открывают
        соответствующие сервисы. На этом сайте не подключены сторонние рекламные счётчики.
      </p>

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
