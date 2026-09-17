# Архитектурные контракты и спецификации Sansata (Architecture Contracts)

**Дата утверждения:** 16–17 сентября 2026  
**Версия спецификации:** 1.0.0 (Фаза 1 — Baseline & Contracts)  
**Проект:** Интерактивный визуализатор ЖК «Shattyq» (Sensata Group)  
**Статус:** Обязательный стандарт для всех последующих рабочих задач (Workers) и верификаторов (Verifiers)

---

## 1. Каноническая доменная иерархия (Canonical Domain Hierarchy)

Архитектурная модель данных визуализатора Sansata организуется в строгую четырехуровневую древовидную иерархию:

$$\text{Complex / Building} \longrightarrow \text{Section} \longrightarrow \text{Floor} \longrightarrow \text{Apartment (Lot)}$$

```
+-------------------------------------------------------------+
| Комплекс / Здание (Building)                                |
| id: 'shattyq', name: 'ЖК Shattyq'                           |
+-------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
+-----------------------------+       +-----------------------------+
| Секция 1 (Section 1)        |       | Секция 2 (Section 2)        |
| id: 'section-1', number: '1'|       | id: 'section-2', number: '2'|
+-----------------------------+       +-----------------------------+
       |                                             |
       v (Этажи 1..9)                                v (Этажи 1..9)
+-----------------------------+       +-----------------------------+
| Этаж (Floor)                |       | Этаж (Floor)                |
| id: 's1-f7', floorNumber: 7 |       | id: 's2-f3', floorNumber: 3 |
| svgViewBox: '0 0 1920 1080' |       | svgViewBox: '0 0 1920 1080' |
+-----------------------------+       +-----------------------------+
       |                                             |
       v (Квартиры лота)                             v (Квартиры лота)
+-----------------------------+       +-----------------------------+
| Квартира / Лот (Apartment)  |       | Квартира / Лот (Apartment)  |
| id: 'shattyq-1-7-1'         |       | id: 'shattyq-2-3-4'         |
| rooms: 2, area: 68.5        |       | rooms: 3, area: 94.2        |
| status: 'available'|'unk..' |       | status: 'reserved'|'unk..'  |
+-----------------------------+       +-----------------------------+
```

### 1.1. Разделение сущностей: «Вариант планировки» vs «Физический лот»
**МАНДАТ ЦЕЛОСТНОСТИ ДАННЫХ (Integrity Mandate):**
1. **Вариант планировки (Layout Variant):**
   - Источник: `src/data/shattyq.json` (20 опубликованных архитектурных проектов).
   - Поля: `id` (например, `'shattyq-1'`), `rooms` (1..4), `area` (м²), `images`, `features`.
   - Статус: Варианты планировок являются чертежами/типовыми проектами застройщика. Они **не имеют** физических номеров квартир и фиксированных цен в открытом доступе.
   - **Правило:** В каталоге и на схемах вариантов цена **обязана быть `null`** («Цена по запросу»), а статус — **`'unknown'`** («Наличие уточняется»).
2. **Физический лот / Квартира (Authoritative Apartment Lot):**
   - Источник: Реляционная база `apartments.db` (схема таблиц `buildings`, `sections`, `floors`, `apartments`).
   - Поля: Конкретный номер квартиры на этаже (`number: '142'`), точная подтвержденная цена (`price: 45200000`), статус сделки (`status: 'available' | 'reserved' | 'sold'`), векторные координаты полигона на конкретном этажном чертеже (`polygon_points`).
   - **Правило:** Пока в базу данных девелопером не загружен официальный шахматный реестр конкретных квартир, категорически **запрещается генерировать синтетические номера квартир или придумывать фиктивные цены**. Приложение обязано сохранять статус вариантов.

---

## 2. Спецификация публичных DTO (Public Data Transfer Objects)

Все публичные интерфейсы между фронтендом, BFF-сервером и внешними клиентами должны строго следовать приведенным ниже TypeScript-контрактам. Никакие служебные поля баз данных или CRM не могут присутствовать в этих структурах.

### 2.1. Контракт здания и секции
```typescript
export interface BuildingDto {
  id: string;                      // Уникальный строковый идентификатор ('shattyq')
  name: string;                    // Официальное название комплекса ('ЖК Shattyq')
  sectionsCount: number;           // Количество секций (2)
  floorsCount: number;             // Максимальная этажность (9)
  address?: string;                // Адрес объекта
}

export interface SectionDto {
  id: string;                      // Идентификатор секции ('section-1')
  buildingId: string;              // Ссылка на здание ('shattyq')
  number: number;                  // Номер секции (1, 2)
  floorsCount: number;             // Количество этажей в секции (9)
  variantsCount: number;           // Количество доступных планировочных решений
}
```

### 2.2. Контракт этажа и векторного чертежа
```typescript
export interface FloorRegionDto {
  id: string;                      // ID квартиры/планировки ('shattyq-1')
  apartmentNumber?: string;        // Официальный номер (если подтвержден реестром)
  points: [number, number][];      // Массив полигональных точек [[x1, y1], [x2, y2], ...]
  centroid?: [number, number];     // Предрассчитанная точка привязки тултипа [x, y]
}

export interface FloorDto {
  id: string;                      // Идентификатор этажа ('shattyq-s1-f7')
  buildingId: string;              // 'shattyq'
  sectionId: string;               // 'section-1'
  floorNumber: number;             // Номер этажа (1..9)
  svgViewBox: string;              // Координатная сетка чертежа ('0 0 1920 1080')
  planImageUrl: string;            // URL фонового растрового плана ('/plans/s1_f7.webp')
  regions: FloorRegionDto[];       // Массив интерактивных векторных зон
}
```

### 2.3. Контракт квартиры и статусов
```typescript
export type ApartmentStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export interface ApartmentDto {
  id: string;                      // Публичный идентификатор лота или планировки
  number?: string;                 // Номер квартиры (null / undefined для вариантов)
  rooms: number;                   // Число комнат (1, 2, 3, 4)
  section: number;                 // Номер секции (1, 2)
  floor: number;                   // Номер этажа (1..9)
  area: number;                    // Общая площадь в м²
  livingArea?: number;             // Жилая площадь в м²
  price: number | null;            // Цена в тенге или null («Цена по запросу»)
  pricePerMeter?: number | null;   // Цена за м² или null
  status: ApartmentStatus;         // Статус лота
  layoutUrl: string;               // Ссылка на изображение схемы планировки
  features?: string[];             // Маркетинговые теги ('Витражные окна', 'Мастер-спальня')
}

export interface ApartmentStatusResponseDto {
  updatedAt: string;               // ISO-строка времени актуализации ('2026-09-17T00:00:00Z')
  statuses: Record<string, ApartmentStatus>; // Словарь: { "shattyq-1": "available", ... }
}
```

### 2.4. Контракты лидов и бронирования (Lead & Booking Requests)
```typescript
// POST /api/leads (или POST /api/booking)
export interface LeadRequestDto {
  name: string;                    // Имя клиента (2..80 символов, без <>, \x00-\x1f)
  phone: string;                   // Телефон в формате Казахстана/СНГ (нормализуется в E.164: +7XXXXXXXXXX)
  topic?: string;                  // Тема обращения (до 600 символов)
  consent: true;                   // Обязательное явное согласие на обработку данных (строго true)
  requestId: string;               // Идемпотентный ключ клиента (UUID / hex, 8..80 символов)
  website?: string;                // Honeypot-поле ловушки ботов (обязано быть пустым)
  apartmentId?: string;            // Идентификатор интересующей квартиры (опционально)
}

export interface LeadResponseDto {
  success: boolean;                // Результат операции (true)
  id: string;                      // Публичный UUID квитанции заявки
  mode: 'crm' | 'local';           // Режим сохранения (запись в CRM или локальный журнал)
  message: string;                 // Локализованный статус для пользователя
}
```

---

## 3. Контракты периметра безопасности (Security Boundary Contracts)

### 3.1. Архитектурное правило Zero-Trust
Взаимодействие клиента с внешними CRM-системами строится строго по однонаправленной цепочке доверия:

$$\text{Browser} \xrightarrow[\text{Public DTO}]{\text{HTTPS}} \text{Public API (BFF)} \xrightarrow[\text{Internal}]{\text{App Service}} \text{Bitrix Adapter} \xrightarrow[\text{Secrets/Webhook}]{\text{TLS REST}} \text{Bitrix24 CRM}$$

**Непреложные правила изоляции (Non-Negotiable Isolation Rules):**
1. **Никаких секретов в клиенте:** Токены вебхуков Bitrix24 (`BITRIX_WEBHOOK_URL`), ключи авторизации и пароли хранятся исключительно в переменных окружения сервера Node.js. Использование префиксов `VITE_*` или `REACT_APP_*` для секретов категорически запрещено.
2. **Никаких внутренних CRM ID в публичных DTO:** Идентификаторы сущностей Bitrix24 (числовые ID лидов, сделок, контактов, смарт-процессов) никогда не передаются в браузер. Серверный адаптер генерирует и возвращает клиенту безопасный маскирующий UUID v4.
3. **Никаких внутренних названий полей:** Пользовательские поля CRM (`UF_CRM_*`) изолированы внутри `server/bitrixAdapter.mjs`.

### 3.2. Контракт доверия к обратным прокси (Proxy Trust Contract)
```javascript
// server/leads.mjs & server/apiRouter.mjs
export function getClientIp(req) {
  // Проверять X-Forwarded-For ТОЛЬКО при наличии переменной TRUST_PROXY=true
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const parts = forwarded.split(',').map(s => s.trim());
      // Брать доверенный IP в соответствии с топологией
      if (parts.length > 0 && parts[0]) return parts[0];
    }
  }
  // По умолчанию брать исключительно прямой адрес физического сокета
  return req.socket?.remoteAddress || '127.0.0.1';
}
```

### 3.3. Контракт защиты от спам-ботов (Honeypot & Rate Limiting Contract)
1. **Тихий сброс ботов (Silent Honeypot Rejection):**
   Если входящий запрос содержит непустое значение в скрытом поле `website`:
   - Сервер обязан вернуть HTTP статус `200 OK` с валидной структурой квитанции `{ success: true, id: randomUUID(), message: 'Заявка принята.' }`.
   - Запись в локальный файл `.local/leads.ndjson` и отправка в Bitrix24 **не производятся**.
   - Ответ `400 Bad Request` запрещен, чтобы не информировать спам-скрипты о наличии защиты.
2. **Политика ограничения частоты (Rate Limiting):**
   - Лимит: **3 заявки за 10 минут на один IP-адрес**.
   - При превышении возвращается HTTP статус `429 Too Many Requests` с JSON `{ error: 'Слишком много заявок. Пожалуйста, подождите 10 минут.' }`.
   - Экземпляр `RateLimiter` обязан регулярно очищать просроченные бакеты, не допуская утечки оперативной памяти.

---

## 4. Контракт векторного SVG-визуализатора (SVG Visualizer Contract)

### 4.1. Стандарты стабильности координатной сетки
Чтобы векторные полигоны никогда не смещались относительно растрового чертежа этажа при любых изменениях размера окна, зуме и пропорциях экрана:
1. Корневой элемент `<svg>` обязан декларировать атрибуты:
   ```tsx
   <svg
     viewBox={`0 0 ${data.width} ${data.height}`}
     preserveAspectRatio="xMidYMid meet"
     className="selection-image"
   >
   ```
2. Подложка `<image>` обязана занимать полный прямоугольник виртуального пространства:
   ```tsx
   <image
     href={siteUrl(data.image)}
     x="0"
     y="0"
     width={data.width}
     height={data.height}
     preserveAspectRatio="none"
     style={{ pointerEvents: 'none' }}
   />
   ```
3. Интерактивные полигоны квартир `<polygon>` обязаны содержать:
   ```tsx
   <polygon
     points={region.points.map(p => p.join(',')).join(' ')}
     role="button"
     tabIndex={isDisabled ? -1 : 0}
     aria-label={label(region.id)}
     aria-disabled={isDisabled}
     aria-pressed={isSelected}
     style={{ pointerEvents: isDisabled ? 'none' : 'visiblePainted' }}
     className="selection-polygon"
   />
   ```
4. Стили полигонов в CSS обязаны включать:
   ```css
   .selection-polygon {
     vector-effect: non-scaling-stroke;
     stroke-width: 2px;
     cursor: pointer;
     transition: fill 0.15s ease, stroke 0.15s ease;
   }
   ```

### 4.2. Правила предотвращения ре-рендеров (Re-render Avoidance)
1. **Изоляция подсветки:** Подсветка полигона при наведении курсора должна выполняться через CSS-псевдокласс `:hover`. Запрещается обновлять стейт родительского компонента React ради изменения цвета полигона.
2. **Изолированный тултип:** Информационный тултип должен рендериться в отдельном DOM-контейнере (Portal или оверлей) и позиционироваться через `transform: translate3d(x, y, 0)`.
3. **Мемоизация компонентов:** Компоненты `SelectionImage`, `FloorMap` и `PlanCard` должны быть обернуты в `React.memo` с компараторами свойств для предотвращения каскадной перерисовки списков.

---

## 5. Контракт жизненного цикла Three.js и WebGL (Three.js Lifecycle Contract)

### 5.1. Правило единственного контекста WebGL (Context Preservation)
1. Контекст WebGL (`THREE.WebGLRenderer`) является дорогим системным ресурсом. Запрещается уничтожать и пересоздавать рендерер при динамических изменениях пользовательского ввода (например, перетаскивание мебели в `InteriorEditor` или переключение комнат в `PanoramaViewer`).
2. Инициализация `WebGLRenderer`, сцены, камеры и OrbitControls выполняется **однократно** при монтировании компонента.
3. Динамические обновления (позиции мебели, материалы, смена текстуры панорамы `material.map = newTexture`) должны выполняться через точечные мутации Three.js графа без пересоздания канваса.

### 5.2. Протокол полной рекурсивной очистки ресурсов GPU (Explicit Disposal Protocol)
При размонтировании любого компонента Three.js (`SceneViewer`, `ApartmentScene`, `PanoramaViewer`) функция очистки эффекта (`cleanup`) обязана строго выполнить следующую последовательность:

```typescript
return () => {
  // 1. Остановка цикла анимации и отписка слушателей
  renderer.setAnimationLoop(null);
  resizeObserver.disconnect();
  controls.dispose();
  renderer.domElement.removeEventListener('pointerdown', onPointerDown);
  renderer.domElement.removeEventListener('pointermove', onPointerMove);
  renderer.domElement.removeEventListener('pointerup', onPointerUp);

  // 2. Рекурсивное освобождение геометрий, материалов и текстур сцены
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of materials) {
          // Освобождаем все текстурные карты материала
          Object.values(mat).forEach((val) => {
            if (val instanceof THREE.Texture) {
              val.dispose();
            }
          });
          mat.dispose();
        }
      }
    }
  });

  // 3. Освобождение процедурных текстур и WebGLRenderTarget окружения
  if (currentBgTex) currentBgTex.dispose();
  if (currentRenderTarget) currentRenderTarget.dispose(); // Обязательный dispose FBO!
  travertineTex.dispose();
  perforatedTex.dispose();
  paverTex.dispose();
  playgroundTex.dispose();
  windowDayTex.dispose();
  windowLitTex.dispose();

  // 4. Очистка рендерера и удаление DOM-элемента
  renderer.dispose();
  renderer.domElement.remove();
  scene.clear();
};
```

### 5.3. Контракт рейкастинга (Throttled Raycasting Contract)
1. **Ограничение целей:** `raycaster.intersectObjects` категорически запрещено вызывать на `scene.children, true` для комплексных моделей. Рейкастинг должен быть строго ограничен массивом интерактивных целевых объектов (например, 18 этажных сеток `pickableFloors`).
2. **Синхронизация с кадрами (RAF Coalescing):** Обработчик `pointermove` не выполняет расчет луча синхронно. Он лишь сохраняет нормализованные координаты курсора `(x, y)` и запрашивает один расчет луча на следующий кадр через `requestAnimationFrame`.
3. **Фильтрация стейта React:** Состояние `hoveredFloor` в React обновляется только в том случае, если изменился номер секции или этажа (`prev.section !== next.section || prev.floor !== next.floor`). Запрещается вызывать `setState` при смене пиксельных координат курсора над тем же объектом.

### 5.4. Контракт прогрессивной загрузки 3D и панорам (Progressive Loading Contract)
1. Во время загрузки тяжелой модели `shattyq_complex.glb` (4,71 МБ) на холсте должен отображаться легковесный процедурный контур здания (малополигональная геометрия из `modelGroup`), информирующий пользователя о прогрессе загрузки.
2. При загрузке 360° панорам 4K компонент `PanoramaViewer` обязан сначала подгружать легковесное превью низкого разрешения (`poster`), выполняя мягкий переход (cross-fade) после загрузки основной текстуры.
