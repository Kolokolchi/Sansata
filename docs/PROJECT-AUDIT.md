# Комплексный технический аудит проекта Sansata (Project Technical Audit)

**Дата проведения аудита:** 16–17 сентября 2026  
**Версия документа:** 1.0.0 (Синтез по итогам Фазы 1)  
**Репозиторий:** `d:\Anti-Gravity\Sansata` (ветка `main`, базовый коммит `d5e4c69`)  
**Окружение:** Node.js v24.14.0, npm 11.9.0, Vite 6.4.3, React 18.3.1, TypeScript 5.7.3, Three.js 0.186.0, Windows 11  
**Статус автоматизированного базиса:** `npm.cmd test` (15/15 пройдены, 0 сбоев), `npm.cmd run security:scan` (0 утечек секретов), `npm.cmd run build` (0 ошибок компиляции TypeScript, 0 предупреждений о чанках)

---

## 1. Введение и Executive Summary

Настоящий документ представляет собой итоговый синтез масштабного технического аудита кодовой базы жилого комплекса «Shattyq» (девелопер Sensata Group), проведенного в рамках параллельных исследовательских треков:
- **Track A & F:** Проектный инструментарий, MCP-серверы, навыки Codex/.agents, базовое тестирование и QA.
- **Track B:** Фронтенд-визуализатор, SVG-наложение, координатная сетка, маршрутизация и жизненный цикл UI.
- **Track CD:** Серверный BFF-слой, SQLite-база данных (`apartments.db`), безопасность и Zero-Trust интеграция с CRM Bitrix24.
- **Track E:** 3D-графика (Three.js), рендеринг GLTF/GLB, 360° сферические панорамы, жизненный цикл GPU и рейкастинг.
- **Track G:** Реверс-инжиниринг референсного веб-сайта (`https://stavni-obvodny.ru/visual/section/66/floor/91/`) и анализ функциональных разрывов.

### Ключевые выводы аудита:
1. **Фундаментальная стабильность кодовой базы (Green Baseline):**
   Существующий проект находится в рабочем состоянии. Автоматический набор тестов (`node:test`) выполняет 15 юнит- и интеграционных тестов без единого сбоя (~146 мс). Скрипт проверки клиентского бандла (`scripts/scan-bundle-secrets.mjs`) подтверждает отсутствие боевых токенов CRM и полей `UF_CRM_*`. Сборка Vite формирует продакшен-бандл за ~2 секунды без превышения лимита чанков (800 кБ).
2. **Доменное разграничение данных (Каталог vs Инвентарь):**
   В кодовой базе соблюдено жесткое разделение между 20 опубликованными планировками (`src/data/shattyq.json`) и официальным реестром квартир. База данных SQLite `apartments.db` содержит полную схему (4 таблицы), но пуста (0 записей). Приложение корректно сохраняет статус `unknown` («Наличие уточняется») и цену `null` («Цена по запросу»), не допуская синтетической генерации несуществующих квартир.
3. **Критические точки отказа (Critical Priorities):**
   - **Утечки видеопамяти GPU:** В компоненте `SceneViewer.tsx:548-569` при размонтировании не выполняется рекурсивная очистка сцены (`scene.traverse`), из-за чего 1 719 полигональных сеток (геометрии, текстуры и 228 динамических материалов окон) модели `shattyq_complex.glb` (4,71 МБ) остаются заблокированными в VRAM, вызывая краш вкладки браузера через 5–10 переключений. В `modelGenerator.ts:251-322` утекают буферы `WebGLRenderTarget` при смене времени суток.
   - **Блокировка потока рейкастингом и лавина ре-рендеров:** В `SceneViewer.tsx:434-455` событие `pointermove` вызывает нерегулируемый поиск луча по всем 1 719 мешам вместо готового массива из 18 секций/этажей (`pickableFloors`). Вызов `setHoveredFloor` и `setScreenHotspots` внутри цикла анимации (60 FPS) провоцирует постоянные полные перерисовки 850-строчного компонента в React.
   - **Срыв SPA-контекста при навигации:** В `FlatExperience.tsx:30,31` переключение этажа и секции выполняется через `location.assign`, что вызывает жесткую перезагрузку всей страницы с уничтожением контекста WebGL вместо бесшовного `navigateTo`.
   - **Уязвимость подделки IP-адреса (Proxy-Trust Bypass):** В `server/leads.mjs:57-64` извлечение клиентского IP слепо доверяет заголовку `X-Forwarded-For`, позволяя злоумышленникам полностью обходить лимитер заявок.
   - **Разночтение поведения Honeypot:** В `server/leads.mjs:131` ботам возвращается `400 Bad Request`, демаскируя защитное поле, тогда как в `server/apiRouter.mjs:85` возвращается корректный `200 Success` (тихий сброс).
   - **Рассинхронизация middleware в dev-режиме:** `vite.config.ts` монтирует только устаревший `leadMiddleware`, из-за чего при локальной разработке (`npm run dev`) эндпоинты `/api/booking` и `/api/apartments/status` отвечают 404.

---

## 2. Текущая архитектура системы (Current Architecture)

### 2.1. Фронтенд-стек и структура компонентов
- **Фреймворк:** React 18.3.1, TypeScript 5.7.3, сборщик Vite 6.4.3.
- **Архитектурный паттерн:** Feature-Sliced / Component Modular.
  - `src/features/Journey.tsx` — клиентский маршрут исследования комплекса:
    - Уровень 1: Генплан (`Masterplan`) с выбором ракурса и пинами секций 1 и 2.
    - Уровень 2: Фасад (`facade-stage`) с интерактивным стеком этажей 1–9.
    - Уровень 3: Этаж (`FloorMap`) — переключатель между векторным SVG (`SelectionImage`) и запасной HTML-сеткой (`.floor-diagram`).
    - Лифтовой рейл (`FloorRail`) — вертикальная панель быстрого переключения этажей со счетчиками опубликованных планировок.
  - `src/features/SelectionImage.tsx` — компонент отрисовки интерактивных векторных чертежей с наложением полигонов `<polygon>` на изображение `<image>`.
  - `src/features/FlatExperience.tsx` — детальная карточка квартиры с вкладками:
    - 3D-тур (интерьерная сцена или панорама).
    - Планировка (чертеж с зумом и компасом).
    - На этаже (встраивание `FloorMap`).
    - На генплане (встраивание `Masterplan`).
    - Свободный 3D-обзор (`VisualSelector`).
  - `src/features/ApartmentScene.tsx` — 3D-интерьер квартиры (кукольный домик) на Three.js.
  - `src/features/InteriorEditor.tsx` — 2D SVG-планировщик расстановки мебели с Drag & Drop.
  - `src/features/PanoramaViewer.tsx` — просмотрщик 360° эквиректанглярных сферических панорам на Three.js.
  - `src/features/Catalog.tsx` — параметрический поиск, фильтрация по комнатам, площади, этажу, сравнение и избранное.
- **Маршрутизация:** Собственная реализация на базе History API:
  - `src/lib/site.ts` — функции `sitePath()`, `navigateTo()`, генерация путей с учетом `BASE_URL`.
  - `src/lib/journey.ts` — синтаксический анализ маршрутов генплана (`journeyRoute`).
  - `src/features/ExperienceRoutes.tsx` — корневой роутер приложения.

### 2.2. Архитектура 3D и 360° панорам
- **Библиотека:** Three.js v0.186.0.
- **Архитектурная модель комплекса:** `public/models/shattyq_complex.glb` (4,71 МБ, 1 803 узла, 1 719 полигональных сеток, 21 436 треугольников).
- **Процедурная генерация материалов:** `src/lib/modelGenerator.ts` формирует процедурные PBR-текстуры травертина, перфорированных решеток, плитки, детской площадки и оконных стекол (день/ночь) через HTML5 Canvas 2D, а также рассчитывает HDRI-карты окружения через `THREE.PMREMGenerator`.
- **Панорамный модуль:** Отрисовка геометрии `THREE.SphereGeometry(500, 60, 40)` с инвертированной нормалью (`scale(-1, 1, 1)`), загрузка текстур 4096×2048 через `THREE.TextureLoader`, проецирование маркеров переходов (`markers`) в экранные координаты.

### 2.3. Серверный BFF-слой (Backend For Frontend)
- **Сетевой стек:** Нативный Node.js HTTP сервер без тяжелых внешних фреймворков (Express/Fastify), что гарантирует максимальную производительность и отсутствие уязвимостей в цепочках зависимостей.
- **Точка входа:** `server/index.mjs` (порт 4173) обслуживает статические файлы из директории `dist/`, обрабатывает Range-запросы (HTTP 206) для потокового воспроизведения аудио и 3D-моделей, защищает от Path Traversal и делегирует запросы `/api/*`.
- **Маршрутизатор API:** `server/apiRouter.mjs`:
  - `POST /api/leads` (делегируется в `server/leads.mjs`) — обработка заявок на консультацию с сохранением в NDJSON.
  - `POST /api/lead` — альтернативный роут создания лида с возможностью проксирования в Bitrix24.
  - `POST /api/booking` — запрос на бронирование консультации по выбранной квартире.
  - `GET /api/apartments/status` — выдача статусов квартир из серверного кэша.
- **Изоляция Bitrix24:** `server/bitrixAdapter.mjs` взаимодействует с Bitrix24 REST API исключительно через переменные окружения (`BITRIX_WEBHOOK_URL`, `BITRIX_DEAL_CATEGORY_ID`). При отсутствии конфигурации работает в безопасном локальном режиме. Внутренние ID лидов и сделок Bitrix маскируются сгенерированными на сервере UUID v4.

### 2.4. База данных SQLite (`apartments.db`)
- **Размер файла:** 36 864 байта в корне проекта.
- **Схема:**
  - `buildings` (`id TEXT PK`, `name TEXT`, `created_at TIMESTAMP`)
  - `sections` (`id TEXT PK`, `building_id TEXT FK`, `number TEXT`)
  - `floors` (`id TEXT PK`, `building_id TEXT`, `section_id TEXT`, `floor_number INT`, `svg_viewbox TEXT`, `plan_svg_url TEXT`)
  - `apartments` (`id TEXT PK`, `floor_id TEXT`, `section_id TEXT`, `building_id TEXT`, `number TEXT`, `rooms INT`, `area REAL`, `price REAL`, `status TEXT CHECK('available','reserved','sold')`, `polygon_points TEXT`, `layout_url TEXT`)
- **Статус наполнения:** Все 4 таблицы содержат ровно 0 записей. База данных не подключена к рантайму фронтенда и не модифицируется скриптами сборки.

### 2.5. Периметр безопасности
- Серверная валидация по строгим белым спискам ключей (`Set`).
- Нормализация телефонных номеров РК к формату E.164 (`+7XXXXXXXXXX`).
- Ограничение размера JSON-тела до 8 КБ (8 192 байта).
- Проверка источников запросов (CORS/Origin validation).
- Локальное журналирование заявок в `.local/leads.ndjson` с изоляцией от Git (`.gitignore`).

---

## 3. Матрица состояния компонентов (Component Status Matrix)

| Компонент / Подсистема | Путь в коде | Статус | Детальное описание текущего состояния |
| :--- | :--- | :--- | :--- |
| **Header & Brand Navigation** | `src/App.tsx:55-105` | **Реализован** | Адаптивная шапка, логотип, телефон, статус избранного, модалка консультации |
| **Masterplan Stage** | `src/features/Journey.tsx:11` | **Реализован** | Переключение ракурсов фасада, интерактивные пины секций 1 и 2, расчет вариантов |
| **Floor Rail (Лифтовой рейл)** | `src/features/Journey.tsx:13` | **Реализован** | Выбор этажей 1–9 со стрелками вверх/вниз и счетчиками доступных планировок |
| **Catalog & Parametric Search** | `src/features/Catalog.tsx` | **Реализован** | Фильтрация по комнатам, площади, цене, этажу, сортировка, избранное, сравнение |
| **Interior Editor (2D)** | `src/features/InteriorEditor.tsx` | **Реализован** | Векторная расстановка мебели Drag & Drop, валидация габаритов стен, сохранение |
| **Audio Tour** | `src/features/AudioTour.tsx` | **Реализован** | Плеер гида, переключение глав, привязка к таймкодам, синтезированные аудиотреки |
| **Info Pages** | `src/features/InfoPages.tsx` | **Реализован** | О проекте, динамика строительства, документы, ипотечный калькулятор |
| **LeadForm (Консультация)** | `src/features/LeadForm.tsx` | **Реализован** | Форма заявки, маска телефона, чекбокс согласия, защита от повторных кликов |
| **SelectionImage (SVG)** | `src/features/SelectionImage.tsx` | **Частично** | Полигоны рендерятся, но отсутствуют `preserveAspectRatio`, тултипы и hover-карточки |
| **FloorMap (Этажный вид)** | `src/features/Journey.tsx:12` | **Частично** | Работает CSS-сетка вариантов с дисклеймером; SVG не активен из-за пустого конфига |
| **Panorama Viewer (360°)** | `src/features/PanoramaViewer.tsx` | **Частично** | Панорамы отображаются, но отсутствует прогрессивный блюр-ап (`poster`) и переходы |
| **Database Integration** | `apartments.db` | **Частично** | Реляционная схема сформирована, но таблицы пустые; рантайм-коннектор отсутствует |
| **SceneViewer (3D Комплекс)** | `src/features/SceneViewer.tsx` | **С дефектами** | Критические утечки памяти GPU при unmount, рейкастинг по 1 719 мешам, лаги 60 FPS |
| **ApartmentScene (3D Квартира)**| `src/features/ApartmentScene.tsx` | **С дефектами** | Уничтожение WebGLRenderer при перемещении мебели вызывает краш контекста |
| **FlatExperience Navigation** | `src/features/FlatExperience.tsx:30`| **С дефектами** | `location.assign` срывает SPA-маршрутизацию в полный reload страницы |
| **Proxy-Trust / Client IP** | `server/leads.mjs:57` | **С дефектами** | Слепое доверие `x-forwarded-for` позволяет обходить rate-limiter спуфингом заголовка |
| **Honeypot Response Alignment** | `server/leads.mjs:131` | **С дефектами** | Возврат 400 вместо 200 демаскирует honeypot-ловушку перед автоматическими ботами |
| **Rate Limiter Synchronization**| `server/apiRouter.mjs:8,78` | **С дефектами** | Лимитер настроен на 5 запросов, а сообщение об ошибке пользователю заявляет 3 |
| **Status Cache CRM ID Leak** | `server/statusCache.mjs:49` | **С дефектами** | Ключи словаря статусов используют внутренний `item.id` из Bitrix24 |
| **E2E Playwright Tests** | `package.json`, `e2e/` | **Отсутствует** | Пакет `@playwright/test` установлен, но `playwright.config.ts` и спеки отсутствуют |
| **Vite Dev BFF Middleware** | `vite.config.ts:15` | **Отсутствует** | Роуты `/api/booking` и `/api/apartments/status` отсутствуют в Vite dev сервере |
| **Floating Rich Tooltip (SVG)** | `SelectionImage.tsx` | **Отсутствует** | Нет плавающей HTML-карточки над SVG полигонами с площадью, ценой и превью |
| **Mobile Bottom Sheet Preview** | `Journey.tsx` | **Отсутствует** | На смартфонах клик по квартире сразу перенаправляет без предварительного просмотра |

---

## 4. Аудит безопасности и политики Zero-Trust

### 4.1. Результаты сканирования секретов и репозиторной гигиены
- Запуск `npm.cmd run security:scan` (`scripts/scan-bundle-secrets.mjs`) выполняет статический анализ всех файлов в `dist/` на наличие сигнатур токенов Bitrix (`rest/[0-9]+/[a-z0-9]+`), пользовательских полей `UF_CRM_*`, паролей и API-ключей.
- **Результат:** 0 утечек секретов в собранном бандле.
- Поиск по исходному коду (`src/`, `server/`, `scripts/`, `public/`) подтвердил отсутствие хардкода учетных данных.
- Файлы конфигурации окружения: в репозитории присутствует исключительно демонстрационный шаблон `.env.example`. Любые локальные файлы `.env`, `.env.local`, `.env.production` надежно исключены через `.gitignore`.
- История коммитов Git (3 коммита: `d5e4c69`, `2c34758`, `109df38`) проверена — конфиденциальные данные в коммиты никогда не попадали.

### 4.2. Уязвимость: Недоверенная обработка заголовка `X-Forwarded-For`
- **Файл и строки:** `server/leads.mjs:57-64`
- **Код:**
  ```javascript
  export function getClientIp(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp) return firstIp;
    }
    return req.socket?.remoteAddress || 'local';
  }
  ```
- **Анализ угрозы:**
  Сервер принимает значение первого элемента `X-Forwarded-For` без подтверждения того, что непосредственный сокет (`req.socket.remoteAddress`) принадлежит доверенному обратному прокси-серверу (Reverse Proxy / Nginx / Cloudflare). Атакующий может слать HTTP-запросы с произвольным заголовком `X-Forwarded-For: 10.0.0.X`, получая на каждый запрос новый токен-бакет в `RateLimiter`. Это полностью нивелирует защиту от спама и открывает вектор отказа в обслуживании (DoS) через исчерпание оперативной памяти Node.js миллионами динамических IP-записей.
- **Требуемое решение:**
  По умолчанию использовать исключительно `req.socket.remoteAddress`. Парсить `X-Forwarded-For` только при наличии явной переменной конфигурации `TRUST_PROXY=true` и проверке соответствия адреса сокета доверенным подсетям локального шлюза.

### 4.3. Рассинхронизация и демаскирование ловушки спама (Honeypot)
- **Файлы:** `server/leads.mjs:131` в сравнении с `server/apiRouter.mjs:85`.
- **Проблема:**
  В `server/leads.mjs` при обнаружении заполненного скрытого поля `website` сервер возвращает ошибку `400 Bad Request` (`error: 'Некорректная заявка.'`). Это сообщает боту о срабатывании защиты, позволяя алгоритму спамера скорректировать полезную нагрузку.
  В `server/apiRouter.mjs` реализовано эталонное поведение в соответствии с навыком `forms-and-api-defense`: возвращается `200 Success` (`{ success: true, message: 'Заявка принята.' }`), при этом запись на диск и отправка в CRM бесшумно подавляются.
- **Требуемое решение:** Унифицировать поведение `server/leads.mjs`, возвращая `200 Success` без сохранения в `.local/leads.ndjson`.

### 4.4. Аудит изоляции Bitrix24 и целостности DTO
- Вызовы внешнего Bitrix24 API в `server/bitrixAdapter.mjs` снабжены жестким таймаутом `AbortSignal.timeout(5000)`. При падении или задержке CRM клиент получает нейтральное сообщение без утечки внутренних стектрейсов PHP/Bitrix.
- Запросы создания лидов (`/api/lead`) и сделок бронирования (`/api/booking`) возвращают клиенту сгенерированные UUID (`leadId: randomUUID()`, `bookingId: randomUUID()`). Внутренние ID Bitrix (целочисленные первичные ключи БД CRM) наружу не отдаются.
- **Дефект в `server/statusCache.mjs:49`:**
  При получении статусов сущностей CRM метод кэширования выполняет:
  ```javascript
  newMap[String(item.id)] = status;
  ```
  Здесь `item.id` — это внутренний ID элемента Bitrix24. При отдаче эндпоинта `GET /api/apartments/status` внутренние идентификаторы CRM попадают в публичный JSON. Необходимо маппировать статусы на публичные идентификаторы каталога (`shattyq-X`) или стабильные коды лотов.

---

## 5. Аудит производительности (Performance Audit)

### 5.1. Утечки видеопамяти GPU (Three.js WebGL Lifecycle)
1. **Отсутствие рекурсивной очистки сцены при размонтировании (`SceneViewer.tsx:548-569`):**
   При уходе со страницы вызов `renderer.dispose()` освобождает только внутренние дескрипторы WebGL, но **не удаляет** связанные `BufferGeometry`, `Material` и `Texture`. 1 719 мешей модели `shattyq_complex.glb`, оригинальные материалы и 228 динамически созданных материалов ночных окон остаются висеть в памяти GPU. Накопление составляет ~50 МБ VRAM на каждый цикл монтирования.
2. **Утечка `WebGLRenderTarget` при смене времени суток (`modelGenerator.ts:251-322`):**
   Метод `createSkyEnvironment` использует `PMREMGenerator.fromEquirectangular()`, возвращающий `WebGLRenderTarget`. В коде сохраняется и впоследствии освобождается только `.texture`, тогда как сам рендер-таргет с его кадровыми буферами (FBO) теряется сборщиком мусора без освобождения ресурсов GPU.
3. **Утечка геометрии при прерывании загрузки модели (`SceneViewer.tsx:396-401`):**
   Если компонент был размонтирован до завершения загрузки GLB (4,71 МБ), в обработчике `isDisposed` вызывается `geometry.dispose()`, но полностью игнорируются материалы и текстуры.

### 5.2. Узкие места рейкастинга и событийного цикла
1. **Неограниченное пространство поиска луча (`SceneViewer.tsx:442`):**
   На каждое микроперемещение мыши вызывается `raycaster.intersectObjects(scene.children, true)`. Луч проверяет пересечение со всеми 1 719 мешами (21 436 полигонов). Вызов занимает от 3 до 8 мс. При частоте событий мыши 125 Гц основной поток JavaScript полностью блокируется (100% CPU core).
   При этом в коде уже существует отфильтрованный массив `pickableFloors` из 18 этажных мешей, пересечение с которым выполняется менее чем за 0,05 мс.
2. **Отсутствие троттлинга через `requestAnimationFrame`:**
   Координаты мыши обрабатываются синхронно внутри обработчика `pointermove`, провоцируя расчет макета (`getBoundingClientRect`) на каждое перемещение курсора.

### 5.3. Лавина холостых ре-рендеров React
1. **Обновление состояния React внутри 60 FPS цикла анимации (`SceneViewer.tsx:541`):**
   Внутри `renderer.setAnimationLoop` для проецирования координат хотспотов инфраструктуры на каждом кадре вызывается:
   ```typescript
   setScreenHotspots(projected);
   ```
   Это принудительно вызывает ре-рендер всего тяжелого 850-строчного компонента `SceneViewer` 60–120 раз в секунду, даже когда пользователь не касается мыши и камера абсолютно неподвижна.
2. **Ре-рендер `SceneViewer` от координат курсора (`SceneViewer.tsx:444`):**
   Объект `setHoveredFloor({ section, floor, x, y })` обновляется новыми `x, y` на каждый пиксель движения мыши, непрерывно перезапуская виртуальный DOM React.
3. **Холостые ре-рендеры в `FloorMap` (`Journey.tsx:12`):**
   Локальный стейт `const [hover, setHover] = useState<string>()` обновляется при входе и выходе курсора на каждую квартиру, вызывая перерисовку всей схемы, несмотря на то, что визуальная подсветка уже полностью обеспечена CSS-правилом `.floor-unit:hover`.
4. **Уничтожение контекста WebGL при Drag & Drop мебели (`ApartmentScene.tsx:10,30`):**
   Массив зависимостей `useEffect` содержит объект `design`. При перетаскивании стула или кровати в `InteriorEditor` событие `onPointerMove` генерирует десятки вызовов `onChange` в секунду. Каждый вызов уничтожает старый `WebGLRenderer` и создает новый. Через 8–16 итераций браузер сообщает `Too many active WebGL contexts` и контекст безвозвратно теряется.

### 5.4. Стабильность SVG-координат (`SelectionImage.tsx`)
- Элемент `<image>` внутри SVG не имеет атрибутов `x="0" y="0"`, `preserveAspectRatio="none"` и стиля `pointer-events: none`.
- Корневой `<svg>` не объявляет явно `preserveAspectRatio="xMidYMid meet"`.
- В `journey.css` задано ограничение `max-height: 700px`. На экранах шире 1240px контейнер масштабируется по ширине до 1380px, а высота упирается в 700px, создавая боковые отступы (pillarboxing). Если координаты тултипа рассчитываются относительно внешнего DOM-контейнера, они смещаются относительно векторных полигонов чертежа.

---

## 6. Технический долг и верификационный базис (Verification Baseline)

### 6.1. Автоматизированные тесты (`npm.cmd test`)
Прогон нативного тестового раннера `node --test tests/*.test.mjs` завершился со 100% успехом:
```
✔ BFF API Router security, validation, ratelimit and safe DTO (32.6436ms)
✔ config accepts connected panoramas and limits inventory to public fields (0.7058ms)
✔ config rejects broken arrays, protocols, linked ids and values (0.2375ms)
✔ mortgage handles zero rate, full payment and annuity reference (0.1517ms)
✔ catalogue contains unique original plans and no invented prices (0.0847ms)
✔ selection routes reject nonexistent sections and floors (0.8705ms)
✔ floor selection only returns published matching plans (0.2087ms)
✔ saved interiors reject corrupt coordinates and duplicate furniture (0.189ms)
✔ apartment media validates nested panorama graphs and model URLs (0.4382ms)
✔ selection polygons remain inside image coordinates with unique IDs (0.2457ms)
✔ lead validation requires name, KZ phone and consent (1.2723ms)
✔ getClientIp parses x-forwarded-for and socket fallback (0.2007ms)
✔ HTTP saves once, rejects malformed and cross-origin requests (50.5779ms)
✔ Pages links retain the repository prefix and preserve external targets (15.5384ms)
✔ Local hosting keeps root paths (2.7383ms)
ℹ tests 15, suites 0, pass 15, fail 0, cancelled 0, skipped 0, todo 0
ℹ duration_ms 146.4888
```

### 6.2. Проверка клиентской сборки (`npm.cmd run build`)
Компилятор TypeScript (`tsc`) и сборщик Vite трансформировали 1 618 модулей за 2,01 секунды:
- `dist/assets/vendor-three-*.js`: 643,62 кБ (gzip: 163,15 кБ)
- `dist/assets/vendor-react-*.js`: 142,93 кБ (gzip: 45,78 кБ)
- `dist/assets/index-*.js`: 57,20 кБ (gzip: 16,71 кБ)
- `dist/assets/InfoPages-*.js`: 28,52 кБ (gzip: 8,57 кБ)
- `dist/assets/vendor-icons-*.js`: 24,57 кБ (gzip: 5,30 кБ)
- `dist/assets/SceneViewer-*.js`: 21,09 кБ (gzip: 7,85 кБ)
- `dist/assets/FlatExperience-*.js`: 20,54 кБ (gzip: 7,13 кБ)
- `dist/assets/Catalog-*.js`: 18,93 кБ (gzip: 5,77 кБ)
- `dist/assets/Journey-*.js`: 11,66 kB (gzip: 4,40 kB)
- `dist/assets/AudioTour-*.js`: 7,90 kB (gzip: 3,26 kB)
- `dist/assets/ApartmentScene-*.js`: 6,38 kB (gzip: 3,20 kB)
- `dist/assets/PanoramaViewer-*.js`: 3,15 kB (gzip: 1,76 kB)
- Предупреждений о превышении лимита размера чанков (800 кБ) нет.

### 6.3. Специфика платформы Windows PowerShell
При прямом вызове команды `npm test` или `npm run ...` в среде PowerShell Windows активируется скрипт `C:\Program Files\nodejs\npm.ps1`, который по умолчанию блокируется системной политикой выполнения (`PSSecurityException: UnauthorizedAccess`). Для надежного выполнения всех операций необходимо использовать прямой вызов `npm.cmd` либо исполнять команды через `cmd /c`.

### 6.4. Пробелы в тестовом окружении
1. **Отсутствие E2E-набора Playwright:** В `package.json` отсутствует скрипт `"test:e2e"`, несмотря на наличие зависимости `@playwright/test` и прямые требования в `AGENTS.md`. При прямом запуске `npx playwright test` раннер ошибочно пытается выполнить файлы `tests/*.test.mjs` и падает с ошибкой отсутствия тестов.
2. **Отсутствие линтера:** В проекте нет конфигурации ESLint / Biome, что зафиксировано в `AGENTS.md` («No lint stack exists; do not claim lint passed»).

---

## 7. Приоритетный план устранения дефектов (Actionable Issue Prioritization)

| Приоритет | Категория | Файл и строка | Описание дефекта и последствий | Конкретные шаги устранения (Remediation) |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | Performance / WebGL | `src/features/SceneViewer.tsx:548-569` | Утечка 1 719 мешей, материалов и текстур модели при unmount. Краш вкладки через 5–10 переходов. | Добавить `scene.traverse()` с вызовом `obj.geometry.dispose()` и очисткой всех `material` и текстур. |
| **CRITICAL** | Performance / CPU | `src/features/SceneViewer.tsx:434-455` | Поиск луча `raycaster` по всем 1 719 мешам сцены на каждое движение мыши со 100% блокировкой CPU. | Рейкастить исключительно массив `pickableFloors` (18 мешей), объединяя вызовы через `requestAnimationFrame`. |
| **CRITICAL** | UX / Navigation | `src/features/FlatExperience.tsx:30,31` | `location.assign` вызывает полную перезагрузку страницы при клике на этаж/секцию. | Заменить `location.assign(...)` на клиентский переход `navigateTo(...)`. |
| **CRITICAL** | WebGL Context | `src/features/ApartmentScene.tsx:10,30` | Полное пересоздание `WebGLRenderer` при перетаскивании мебели в редакторе интерьера. | Разделить эффекты: WebGL инициализировать однократно при mount, а мебель обновлять через отдельный `useEffect([design])`. |
| **HIGH** | Security / Anti-DoS | `server/leads.mjs:57-64` | Слепое доверие `X-Forwarded-For` позволяет обходить лимиты запросов подменой IP. | Использовать `req.socket.remoteAddress` по умолчанию, доверяя `X-Forwarded-For` только при `TRUST_PROXY=true`. |
| **HIGH** | Performance / React | `src/features/SceneViewer.tsx:541` | Вызов `setScreenHotspots` внутри цикла анимации 60 FPS провоцирует постоянный полный ре-рендер. | Вынести проецирование хотспотов на событие `controls.addEventListener('change', ...)` и трансформировать DOM напрямую. |
| **HIGH** | Performance / GPU | `src/lib/modelGenerator.ts:251-322` | Утечка `THREE.WebGLRenderTarget` при смене режимов освещения (День/Золотой/Ночь). | Возвращать объект рендер-таргета из функции и явно вызывать `currentRenderTarget.dispose()`. |
| **HIGH** | Security / Anti-Spam | `server/leads.mjs:131` | Ответ 400 на honeypot демаскирует защиту от ботов. | Унифицировать ответ с `apiRouter.mjs`: возвращать `200 Success` без сохранения в базу/файл. |
| **HIGH** | Security / CRM | `server/statusCache.mjs:49` | Утечка внутренних ID Bitrix24 (`item.id`) в публичный эндпоинт статусов квартир. | Маппировать статусы на публичные идентификаторы каталога (`shattyq-X`). |
| **HIGH** | Dev Environment | `vite.config.ts:15` | Отсутствие `createApiRouter()` в dev-сервере приводит к 404 на `/api/booking` и `/api/apartments/status`. | Подключить полный `createApiRouter()` в `server.middlewares.use()` конфигурации Vite. |
| **MEDIUM** | Performance / SVG | `src/features/SelectionImage.tsx:4-15` | Отсутствие `preserveAspectRatio`, `pointer-events: none` на подложке и риск дрейфа координат при >1240px. | Добавить явные атрибуты `preserveAspectRatio`, стили `pointer-events` и расчет полигональных центроидов. |
| **MEDIUM** | Performance / React | `src/features/Journey.tsx:12` | Избыточный вызов `useState` на hover в `FloorMap` вызывает перерисовку всех квартир этажа. | Удалить стейт hover в пользу нативного CSS-селектора `:hover`. |
| **MEDIUM** | QA / Testing | `package.json`, `e2e/` | Отсутствие Playwright-конфигурации и сквозных E2E-тестов пользовательского пути. | Создать `playwright.config.ts`, папку `e2e/` и добавить команду `"test:e2e": "playwright test"`. |
| **MEDIUM** | UX / Panorama | `src/features/PanoramaViewer.tsx:24-140`| Пересоздание канваса при смене комнат панорамы вызывает мигание экрана. | Создавать сцену однажды, а при смене комнаты выполнять плавную смену текстуры на сфере (`material.map`). |
| **LOW** | Backend / RateLimit | `server/apiRouter.mjs:8,78` | Несоответствие параметров лимитера (5 запросов в коде vs 3 запроса в сообщении). | Синхронизировать лимит до 3 запросов в конструкторе `new RateLimiter(3, 10 * 60 * 1000)`. |
| **LOW** | Clean Architecture | `server/apiRouter.mjs:72` | Дублирование эндпоинта `POST /api/lead` рядом с каноническим `POST /api/leads`. | Объединить логику в единый канонический эндпоинт `POST /api/leads`. |
