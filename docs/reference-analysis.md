# SAF Avenue: исследование публичного референса

## Главный экран SAF Avenue — 30.09.2026

По новому поручению пользователя через Chrome DevTools MCP открыт [официальный SAF Avenue](https://saf.sensata.kz/avenue). Главный визуал — растровый JPEG в CSS `background-image`, поверх него обычный HTML-текст; Canvas на странице не обнаружен. Публичный источник изображения: `https://static.tildacdn.pro/tild3730-3865-4164-b332-323637353438/freepik__img1-make-t.jpeg`. Он уже сохранён в `src/assets/saf-avenue/ebacb97a1bdc5034.jpeg` и доступен через `safHero`; повторная загрузка или новая копия не нужны.

Текст заголовка, адрес и пять характеристик сверены с текущим DOM официального сайта и пользовательским снимком. Реализуется только этот входной экран с двумя запрошенными переходами, существующими шапкой и подвалом. Исходный код референса не переносится; изображение используется по прямому поручению пользователя. Навигация и интерактивный выбор в проекте сохраняются собственными; внешние формы не отправлялись, прочие разделы референса в этой задаче не исследовались.

## Земсдизайн: прогулка по интерьеру и собственный Greybox — 26.09.2026

Повторно открыт публичный тур с главной zemsdesign.ru и выполнены переходы внутри Canvas: из кухни по кольцу на полу в коридор, затем поворот перетаскиванием в сторону кухни, наведение на следующее кольцо и переход ближе к кухонным шкафам. Наведение увеличивает размер/яркость кольца; клик плавно переносит обзор к позиции следующего скана; drag вращает камеру на месте. URL Space при этих перемещениях не менялся. DOM/сеть через Chrome DevTools подтвердили Matterport SDK, Three.js и WebGL; жесты проверены через Playwright. Точная внутренняя интерполяция и реконструированная геометрия SDK из публичного интерфейса не устанавливались.

В `/sandbox/greybox-tour` реализована собственная проверяемая версия этой механики: шесть HDR-точек в общем пространстве, floor hotspots, drag/touch, клавиатура, плавный проход камеры через greybox между панорамами, прямые ссылки и история браузера. Геометрия, RGBE HDR и PNG-превью оригинальные, сгенерированы из одного JSON. Это демонстрационный интерьер, не копия планировки/съёмки референса. Ранее созданный embed сохранён по отдельному адресу для сравнения.

Замеры до изменения загрузки: около 60 FPS, JS heap около 48 МБ, четыре HDR по 4,76 МБ на первом экране (около 19 МБ). После RLE-сжатия и загрузки только текущей HDR: первый HDR 1,21 МБ, соседние PNG около 26 КБ каждый; около 60 FPS, 31–34 draw calls, две геометрии, три загруженные GPU-текстуры в начальном виде; JS heap около 55 МБ. Это короткий локальный замер Chrome, не гарантия производительности на физических телефонах. Bundle: отдельный модуль Greybox 16,10 КБ (gzip 5,91 КБ), общий Three.js 647,95 КБ (gzip 165,04 КБ). Все шесть HDR суммарно около 7,38 МБ; в каталог основного сайта они не подгружаются.

Проверка Greybox: `npm test` — 71/71; `npm run test:e2e -- --workers=2` — 64/64, включая восемь сценариев Greybox на desktop 1920×1080, 1366×768, tablet 768×1024 и Pixel 5. Проверены весь граф, hover, мышь, touch через CDP, клавиатура, переключение HDR/геометрии, deep link/reload, назад-вперёд во время движения, поздняя HDR, недоступные файлы и неизвестная точка. Production build и security scan прошли. В ручной проверке Chrome DevTools консоль без ошибок/предупреждений, все 11 начальных запросов вернули 200. Headless Chromium при снятии скриншотов выдаёт собственное GL-предупреждение `GPU stall due to ReadPixels`; тест исключает только это сообщение драйвера. Снимки сохранены в `output/greybox-*.png`.

## Земсдизайн: отдельная песочница Matterport — 26.09.2026

Через Chrome DevTools MCP проверены главная страница `https://zemsdesign.ru/`, кнопка «Посмотреть экскурсию», полноэкранное окно и мобильный вид 390×844. Окно содержит iframe `https://ep.matterport.host/index/?m=RQ6XPTgW9Du&title=0`; сеть показывает загрузку Matterport SDK, Three.js 0.151.3, Canvas/WebGL и запросов Space. Это не локальный набор 2:1 панорам и не SVG-модель. Внешняя страница управляет только открытием/закрытием окна; точки перемещения, обзор и встроенные элементы интерфейса принадлежат Matterport.

Маршрут `/sandbox/zems-tour` воспроизводит открытую экскурсию через тот же публичный embed. Собственные исходники и медиа Matterport не копировались. iframe занимает экран; отдельная кнопка закрытия повторяет поведение окна референса и возвращает на экран повторного запуска. На производственном Node-сервере разрешение `frame-src` для `ep.matterport.host` действует только для маршрута песочницы. Просмотр зависит от доступности внешнего Space и сети; для собственного объекта потребуются своя Matterport-съёмка либо разрешённые панорамы/модель.

Проверка: production-сборка, 69 тестов, 56 Playwright-сценариев на десктопе/планшете/телефоне и сканирование бандла прошли. В Chrome проверены загрузка исходного Space, запуск WebGL-сцены и мобильный вид; запросы тура завершились без HTTP-ошибок. В консоли остаются предупреждения внутри внешнего Matterport SDK о старых вызовах Three.js; код песочницы их не создаёт.

Проверено 25 сентября 2026 года через Chrome DevTools MCP: `https://saf.sensata.kz/quiz`.

## Наблюдаемая структура

- Внешняя страница — Tilda: текст и кнопка консультации поверх фонового JPEG-рендера. Видимое описание: SAF Avenue, Алматы, пр. Аль-Фараби — ул. Розыбакиева.
- Подбор помещений встроен как отдельный iframe Profitbase. В доступном дереве видны фильтры «Тип», «Комнат», «Цена», «Площадь» и режимы «Шахматка», «Шахматка +», «Помещения», «Планировки».
- Видимая шахматка строится из HTML-элементов внутри iframe. На внешней странице найдены обычные SVG-иконки; признаков Canvas или WebGL для этого этапа подбора не найдено. Технология дальнейших экранов каталогa не подтверждена.
- Сеть показывает загрузку данных о домах, планах, этажах и шахматке через публичный виджет Profitbase. Ответы содержат внутренние идентификаторы и изменяемые сведения о цене/наличии; их нельзя переносить в клиентскую статическую модель.

## Использование в этом проекте

Из публичного ответа каталога взят только снимок 150 планировок квартир: публичный код, комнатность, площадь и URL изображения. Коммерческие помещения исключены. Ответ был обработан локально с явным списком полей; исходный ответ и служебные идентификаторы не сохранялись. Статус каждой планировки в интерфейсе остаётся неизвестным, цена не показывается.

Новый интерфейс написан самостоятельно на React и CSS. Рендер SAF Avenue и изображения планировок загружаются с публичных хостов первоисточника; исходный код Tilda и Profitbase не копировался. Для полноценного выбора конкретной квартиры по корпусу, секции и этажу требуется официальный реестр с проверенными связями и геометрией. По одному снимку планировок эти связи не создаются.

## Full SAF / Avenue visual reference — 2026-09-25

Inspected the main split Avenue/Plaza entry and followed `/avenue`, rather than treating `/quiz` as the whole site. Read all Avenue sections: hero/facts, project, location/map, surroundings, concept, architecture, landscaping, security, SAF Club, halls, residences, plans/commercial tabs, gallery, contact form and footer. No reference forms were submitted.

Evidence from Chrome DevTools DOM/computed styles and screenshots:
- Tilda DOM/CSS layout and raster architectural renders; SVG brand assets/icons. No canvas in the Avenue document. The public stock catalog is an embedded Profitbase application; this does not establish an official apartment WebGL model.
- White page, graphite `#2f363c`, primary sand `#b88d61`, lighter sand facts strip, pale gray plan-card bases. Rectangular buttons, light rules, generous white space.
- The Avenue page declares TT Quaris (`tt`) at 14/20 body, 36/43 headings, mostly regular weight. The main split entry additionally uses oversized brand artwork. Avoid confusing the main entry's decorative treatment with the Avenue content layout.
- White fixed header, original gold Avenue logo, original Sensata logo, large photo hero, overlaid white headline/address, facts strip; paired text/image sections and plan gallery. Mobile stacks content and crops the same hero render.

Applied these visual principles with original React/CSS to the object entry, SAF configurator, saved/comparison controls, plan details and all existing apartment-viewer modes. No marketing forms or removed sections were reintroduced. Existing published-layout data and demo-model disclosure remain.

Original gold Avenue SVG: `https://static.tildacdn.pro/tild6437-3134-4832-b631-343832343535/AVENUE_logo_g.svg`. Existing white SAF and Sensata files are unchanged. The hero image was verified to be the same image used on Avenue.

Font files were obtained from the official site's public stylesheet and bundled locally so production CSP needs no external font host. Source filenames identify TT Quaris Trial Regular and Demi; production font licensing should be confirmed with the company. Sources:
- `https://static.tildacdn.pro/tild6234-6138-4837-a466-386465393535/TT_Quaris_Trial_Regu.woff`
- `https://static.tildacdn.pro/tild3438-6434-4363-b132-313036306232/TT_Quaris_Trial_Demi.woff`

Verification: 59 unit/server tests and 20 Playwright flow checks passed (1920, 1366, tablet 768, mobile 393). Manually reviewed rendered screenshots of hero/catalog/viewer at desktop, tablet and mobile; no horizontal overflow, page errors or HTTP errors in the review run, and local fonts loaded. Build and CRM secret scan passed. Screenshots are in `output/saf-*-*.png`.

## STAVNI Обводный: два способа выбора — 25.09.2026

Проверено через Chrome DevTools MCP на [визуальном выборе](https://stavni-obvodny.ru/visual), [поиске по параметрам](https://stavni-obvodny.ru/kvartiry), экране секции/этажа и карточке квартиры. На референсе не отправлялись формы. Его исходный код, материалы и данные квартир в проект не копировались.

### Наблюдения

- Визуальный выбор: обзор комплекса с пятью секциями, переключение ракурса и 360°, фильтр комнатности, затем секция → этаж → квартира. Наведение на секцию показывает сводку вариантов. URL хранит секцию и этаж, прямое открытие глубокого адреса работает.
- Технология визуального выбора: обзор — фотографический рендер в SVG `<image>` с интерактивными `<path>` поверх него, `viewBox="0 0 2560 1440"`. Этаж — SVG-подложка с контурами квартир в `viewBox="0 0 1440 810"`. `canvas` в этих экранах не найден. Публичные данные визуального выбора подгружаются через `/api/estate-visual/...`.
- Поиск по параметрам: интервалы площади и стоимости, множественная комнатность, расширенные параметры (секции, этаж, особенности), сброс, число найденных вариантов, сортировка, режимы «Таблица» и «Карточки», загрузка следующей порции. Поиск подгружает результаты через `/api/estate-search/results/...`.
- Карточка квартиры: 3D-тур, планировка, вид на этаже, положение на генплане. В её 3D-виджете есть виды сбоку/сверху, снимок, полноэкранный режим, редактор. 3D-виджет использует Planoplan и `canvas`; это отдельная технология от SVG-подбора.

### Адаптация для SAF Avenue

- Добавлены два пути — «На 3D-плане» и «По параметрам». Визуальный путь проходит по опубликованному коду `P → E/T → вариант`; обратные ссылки, история и прямые URL работают. Объёмная схема блоков явно названа условной: официальной геометрии SAF и контуров квартир в текущем снимке нет. `E` показывается как этаж, `T` как уровень без предположения о его назначении.
- Параметрический путь получил множественный выбор комнат, блок и интервал этажа, представления таблицей/карточками. Фильтр цены и особенностей нельзя включить без проверенных данных; интерфейс сообщает об этом. Цена, статус, номер конкретной квартиры и положение её на этаже не выдумываются.
- Карточка планировки связывает просмотр планировки и существующего демонстрационного 3D-интерьера с выбранным уровнем и общей схемой. Демонстрационная сцена остаётся подписанной как неточная модель SAF.
- Для точного аналога SVG-выбора нужны официальные подложки здания и этажей, координаты секций/квартир и проверенный реестр единичных лотов. Для точного 3D-тура каждой квартиры нужны её модель или разрешённая интеграция с провайдером. Пока эти материалы не получены, схема не претендует на точную привязку.

## Sensata corporate entry page — 2026-09-25

User requested corporate styling only for the first page, with the existing SAF card and inner project styling preserved. Inspected `https://www.sensata.kz/` via Chrome DevTools and the user's attached blue footer reference.

Evidence: official footer computed background is `rgb(34,34,136)` / `#222288`; corporate font is OpenSans. Footer exposes seven social destinations: Telegram Astana/Almaty, Instagram Astana/Almaty, YouTube, TikTok Astana/Almaty. Exact URLs are recorded in `src/data/sensata-company.json`. Source also provides sales call centre `700`, Sensata Service `8 800 070 09 09`, eight corporate navigation links and copyright. The original white company logo and social SVG artwork are used unchanged. The reference site's third-party developer attribution was not presented as attribution for this application.

Implementation: route-scoped `sensata-home-page` styles and separate corporate header/footer. SAF card retains its original markup, artwork and SAF typeface; `/saf`, plan pages and 3D viewer continue to use their existing project styles. Future project cards can retain their own visual styles without inheriting corporate presentation. No fictitious future objects were added.

Verification: build, 59 tests, 20 Playwright tests and bundle security scan passed. Home was rendered and visually inspected at 1440, 768 and 393 px; all seven social links present, no horizontal overflow, page errors or failed HTTP responses. Screenshots: `output/sensata-home-desktop.png`, `output/sensata-home-tablet.png`, `output/sensata-home-mobile.png`.

Correction: per the user's highlighted footer reference, removed the added upper corporate footer (navigation, duplicate logo and contacts). Retained only the narrow blue copyright/social strip. Verified at 1440/768/393 px: seven social links, no overflow; build passed.

## Sensata SAF chessboard — 2026-09-26

Chrome DevTools MCP was used on `https://www.sensata.kz/project/saf-avenue`. The floating blue button “Шахматка, выбрать квартиру/НП” is a custom `sw-button` element. Clicking it updates the outer page hash and opens an embedded Profitbase catalog. The catalog is an HTML application in an iframe; its chessboard is an HTML grid, not a Three.js scene or SVG floor geometry. A direct public deep link to the SAF house's `smallGrid` was checked in a fresh tab and opened the SAF catalog. No forms were submitted.

The observed path was: all Sensata objects → SAF Avenue → “Шахматка” (compact grid) / “Шахматка +” (expanded cells) / “Помещения” (list) / “Планировки”. The house view offers property type, rooms, price and area filters; the grid has section columns, floor rows and status legend. Clicking a cell opens a side panel with a property number, section, floor, area, status, price and characteristics. URLs carry the house, view, floor, section and selected property. Profitbase requests included `house`, `board`, `floor`, `property` and `plan` under `/api/v4/json/`, with a separate SSO token exchange. This is evidence of Profitbase as the stock provider; the Bitrix widget seen on the outer page is a consultation/contact widget, not the chessboard data source.

The public widget carries its own authorization parameters. They are intentionally absent from this repository, client bundle, documentation and screenshots. The user confirmed that a project-owned Profitbase API key is not available yet. The local `/saf/chessboard` therefore implements the interaction on 150 verified *layout variants*, preserving the explicit distinction from physical units. It has block/level deep links, compact/expanded matrix views, filters, a plan table, a detail panel and the existing 3D viewer. “Помещения” is an honest unconnected state, with a link to the official live SAF chessboard. A server-side Profitbase adapter and verified mapping to Building → Section → Floor → Apartment DTOs are the remaining requirement for live units, statuses and prices. No lot numbers, coordinates or availability were inferred from layout codes.

Visual correction after user review: measured the reference `sw-button` at desktop and mobile as a fixed 100×100 px circle, 15 px from the right and bottom, with a 32 px icon above 10 px text and corporate accent `#354fd5`. The SAF entry now follows that geometry. The chessboard uses the existing Sensata Open Sans and blue `#222288` / `#354fd5` palette. Its matrix now places blocks in columns and levels in rows, like the reference's section/floor orientation, while every cell remains explicitly a published layout variant with unknown stock status. The object-selection page and original logos were left intact.

### Уточнение механики Greybox по пользовательским скриншотам

Метки скрывались условием modelVisible, а подпись кнопки обозначала следующий режим. Условие убрано: метки одинаково видны в HDRI и 3D, текст переключателя показывает текущий режим. Все перемещения сохраняют yaw/pitch. Клик по поверхности выбирает ближайшую к попаданию видимую точку среди всего тура; до удалённой точки камера движется по графу через промежуточные сканы. Проверен пример «коридор → клик по дальней стене → гостиная → зона отдыха» без поворота камеры. Drag не превращается в клик, стены исключают точки по другую сторону препятствия.

Проверка после исправления: 71 модульный тест, 16 Playwright-сценариев Greybox на четырёх размерах экрана, production build и security scan прошли. Ручные снимки коридора на 1349×1404, 768×1024 и 390×844 подтверждают наличие колец и указателей в обоих режимах. Локальный Node-сервер перезапущен на 4173 после остановки предыдущей сессии.

### Непрерывный линейный пролёт

По замечанию о пошаговом движении убрана отдельная анимация с ease-in/ease-out на каждом ребре графа. Весь маршрут теперь имеет одну временную шкалу, скорость 3,6 м/с и линейную интерполяцию по пройденному расстоянию. Панорама скрывается только при отправлении и проявляется у конечной точки. Промежуточные точки не обновляют UI/историю и не останавливают камеру. Регрессионный браузерный тест измеряет скорость по координатам кадров и проверяет отсутствие повторного появления HDR возле промежуточной точки. 16 сценариев Greybox на четырёх размерах экрана, 71 модульный тест, build и security scan прошли.

### Переход на отображение только HDRI

В основном режиме геометрия имеет visible=false и используется исключительно для raycasting и проверки проходов. Пролёт отображается двумя смешиваемыми панорамными сферами; непрозрачный базовый слой не пропадает. Готовность превью всего маршрута проверяется до начала движения; при сбое пользователь остаётся на исходной панораме. Передвижение проверяется по препятствиям с запасом 12 см. Файлы HDR/превью и panoramaYaw вынесены в описание каждой точки; инструкция замены съёмки — docs/HDRI-TOUR.md.

В браузере при пролёте подтверждены geometryVisible=false, panoramaVisible=true, opacity=1 и два draw calls; в покое один draw call. Проверено на 1366×768, 768×1024 и 390×844. 12 сценариев движения/управления прошли в полном запуске; восемь сценариев ошибок и задержек прошли после исправления перехватчика тестов (он должен блокировать загрузку изображения, не служебный Vite-модуль ?import). Все 20 сценариев проверены на четырёх viewports. 71 модульный тест, build и security scan прошли. Смешивание обычных HDRI даёт приблизительный параллакс; точная реконструкция требует глубины.


## SAF Avenue: полный перенос публичных материалов — 28.09.2026

Повторное исследование через Chrome DevTools и наблюдение запросов публичного виджета дали 310 оригинальных файлов, два буклета, 13 схем этажей и снимок 364 помещений. Ранее отмеченное отсутствие номеров и статусов уточнено: они доступны в датированном публичном снимке, но постоянная синхронизация остаётся неподключённой. Секция 8 содержит только коммерцию. Подробности, таблица секций, SHA-256, расхождения и ограничения: [SAF-AVENUE-IMPORT.md](SAF-AVENUE-IMPORT.md).


## 28.09.2026 — восстановление двух сценариев выбора по STAVNI

Повторная проверка Chrome DevTools MCP: https://stavni-obvodny.ru/, /visual, /kvartiry и /visual/section/66/floor/91. Меню «Квартиры» открывается при наведении и содержит «На 3D-плане» → /visual и «По параметрам» → /kvartiry. Визуальный экран начинает выбор непосредственно с рендера комплекса, затем секция, этаж и квартира. В DOM комплекса обнаружены raster image + 5 SVG paths, viewBox 0 0 2560 1440; секции — 10 paths; этажа — 5 paths, viewBox 0 0 1440 810. Canvas отсутствует. Параметрический экран сразу показывает фильтры и результаты, переключатель таблица/карточки, отдельные карточки квартир. Контуры и код STAVNI не переносились.

В SAF устранено смешение выбора комплекса с демонстрационным интерьером /tour и презентацией перед фильтрами. Общая шапка: «Квартиры» с двумя входами, «О проекте» с материалами, «Шахматка», «Объекты». Визуальный выбор использует оригинальные локальные рендеры SAF, панель 7 секций, этажи и 348 квартир из уже импортированного датированного снимка. Новые deep links /saf/visual/block/:section/floor/:floor; старые /level/:code остаются каталогом вариантов. Связь квартиры с планом берётся только из planCode источника, отсутствие изображения не подменяется чужим планом. Возврат из конструктора сохраняет реальный этаж, даже если код типового варианта относится к другому уровню.

Ограничение: нет верифицированных контуров SAF для наведения по фасаду и плану этажа; выбор осуществляется через подписанную панель. Типовая PDF-схема без подтверждённого диапазона этажей показана справочно, а подписанные схемы специальных этажей сопоставляются по точной метке. Статусы датированы 28.09.2026 и не являются актуальным наличием.


## 28.09.2026 — полный путь visual → section/66 → floor/91 → flat-946

Chrome DevTools MCP: последовательно нажаты SVG-контур секции 66 и доступный контур этажа 91. Недоступные этажи имеют is-disabled (114/110/96), поэтому прошлый клик по первому path не открывал этаж. На этаже контур 309 показывает 2-комнатную №220, 63.07 м² и цену; клик открывает новую вкладку /flat-946. Проверены четыре вкладки карточки: 3D-тур / Планировка / На этаже / На генплане. Карточка на desktop: параметры слева, viewer справа, вкладки под viewer; на mobile viewer идёт перед параметрами. Тур запускается пользователем через Planoplan, редактор отдельный. План этажа выделяет выбранную квартиру. Подбор работает в экране на высоту окна, список этажей находится слева. SVG + растр; сетевой API estate-visual, Canvas появляется только внутри запущенного квартирного тура. Чужие модели, полигональные координаты и код не копировались.

Исправления SAF: номер квартиры больше не теряется при переходе к варианту планировки. Создан маршрут /saf/apartment/:observationId на существующем публичном идентификаторе снимка, с точными section/floor/number/area и раздельными историческими и текущими статусами. Данные проиндексированы без нового реестра продаж. Общий экран выбора и карточка конкретной квартиры построены по структуре референса, есть четыре вида, возврат, история, deep links, zoom, fullscreen, скачивание локального плана и существующий конструктор. Неопубликованный план не заменяется чужим.

Геометрия: в исходном af1114399be238d7.jpeg (1680×1680) имеются подписанные блоки 1–7. Их видимые контуры вручную оцифрованы как UI-области в saf-masterplan-regions.json, с исходными координатами и указанием происхождения. Использован существующий SelectionImage; размеры image фиксируются в координатах источника, чтобы обрезанный viewBox не деформировал подложку относительно контуров. Ни фасады, ни квартирные контуры не выдуманы. В PDF типового блока 1 указаны 80.74/119.28/60.95/82.54/157.08 м², тогда как снимок этажа 2 содержит 80.58/118.87/61.84/82.45/156.59 м²: такая схема не даёт подтверждённой привязки квартир. Поэтому план этажа справочный, выбор конкретных номеров — по списку; для точной реализации кликов по этажам фасада и контурам квартир нужны согласованные исходники SAF.

### Главный экран и меню — 28.09.2026
Повторно проверена именно https://stavni-obvodny.ru/visual: общий ракурс комплекса занимает весь экран под шапкой, элементы управления лежат поверх изображения. В SAF главная `/`, `/index.html`, `/visual` и `/saf/visual` теперь открывают этот тип экрана с локальным общим ракурсом 18719179b2f40831.jpeg; раздел объектов сохранён на `/projects`, параметры — `/saf`. Подтверждённых контуров секций на этом ракурсе нет: выбор доступен кнопками секций и через подписанный официальный генплан, без выдуманных полигонов на фасадах. На генплане панель секций скрыта, чтобы не перекрывать кликабельные области на телефоне.
Старая вкладка пользователя продолжала исполнять предыдущий JS после сборки. Это подтверждено чтением её меню до обновления: «О проекте» и «Шахматка» присутствовали. После reload исчезли; затем в этой же вкладке открыта новая главная. Удаление проверено в реальном IAB, а не только в отдельном тестовом браузере.


## Прототип из пользовательских панорам — 28.09.2026

Этот раздел заменяет прежнее ограничение «клики только через список»: пользователь явно согласовал приблизительную геометрию и предоставил папку `3d tour`. Повторно изучены Chrome DevTools страницы STAVNI `/visual/`, `/visual/section/67/`, `/visual/section/67/floor/92/` и `/flat-1031`: растровый фасад с SVG-областями, этажная схема с выделением квартиры, карточка с четырьмя видами и действиями. Проверены DOM, скриншоты и ответы публичных запросов. Публичные ответы SAF render/facade/floor для исследованного дома пустые; официальная фасадная геометрия не получена.

Три пользовательских JPEG 15000×7500 сохранены неизменными. Экспорт: три панорамы 4096×2048, три превью 1024×512 и три фотографии 1920×1080, суммарно около 10.14 МБ. Manifest `saf-tour.json` фиксирует исходники, SHA-256 и ориентацию. На фотографии cam-5 вручную определены семь условных секций, фасады разбиты по фактическому списку этажей снимка. Эти секции не объявляются точной моделью SAF. Оригинальный генплан остаётся отдельным видом.

На 13 опубликованных этажных схемах выделены цветные области. Из 150 индивидуальных планировок прочитаны миниатюры этажей с чёрным выделением; координаты сопоставлены с областями. Номера без индивидуального плана условно занимают оставшиеся области. Все 348 квартир остаются объектами существующего снимка; точность отображения явно обозначена как прототип. Текущие цены и статусы не изменены.

Панорамы используют существующий Three.js viewer с progressive preview, управлением мышью/пальцем/клавиатурой, масштабом, полноэкранным режимом, пространственными кнопками и прямыми ссылками на три точки. Переходы условные. Карточка дополнена локальным избранным, печатной версией, похожими квартирами, пользовательским расчётом платежа и существующей формой консультации. Российские банковские предложения и акции референса не выдаются за условия SAF.

Проверка: 28 сценариев выбора/карточек, 12 сценариев новых областей и панорам, 8 сценариев действий карточки на desktop 1920/1366, tablet 768 и mobile 393. Покрыты семь секций, все 348 привязок в модульном тесте, keyboard/touch, deep links, история, ошибки текстур и восстановление. Сборка TypeScript/Vite и сканирование клиентских assets прошли. Автотест формы перехватывает API: реальные заявки не отправлялись.
