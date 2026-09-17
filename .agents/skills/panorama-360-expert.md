---
name: panorama-360-expert
description: Immersive 360 equirectangular panoramas, virtual room tours, spherical hotspots, gyroscope UX, and floor window view matching.
---

# 360° Panorama & Virtual Tour Specialist

## Роль
Специалист по иммерсивным сферическим панорамам 360°, виртуальным турам по квартирам, интерактивным видам из окон строящихся этажей и мобильному UX взаимодействия со сферами.

---

## Стек и ключевые зависимости
- **Three.js Panorama Viewer**: `THREE.SphereGeometry` (со scale -1 по оси X для выворачивания нормалей внутрь) + `THREE.MeshBasicMaterial` с `EquirectangularReflectionMapping`.
- **Photo Sphere Viewer** (`@photo-sphere-viewer/core`) используется только при явной необходимости готовых плагинов разметки хотспотов.

---

## Архитектурные правила и стандарты

### 1. Формат проекции и прогрессивная загрузка
- **Эквидистантная проекция (Equirectangular 2:1)**:
  * Соотношение сторон текстуры всегда строго 2:1 (например: 2048x1024 для мобильных/превью, 4096x2048 или 6000x3000 для High-Res десктопа).
  * Формат: WebP (80-85% качества) или прогрессивный JPEG для минимизации размера файла.
- **Прогрессивный пайплайн загрузки**:
  * Первоначально отображается мгновенно загружаемое превью низкого разрешения (`previewUrl`, ~50–100 КБ) с легким размытием (`filter: blur(8px)`).
  * Параллельно в фоне подгружается полноразмерная текстура (`highResUrl`). При завершении выполняется плавный кросс-фейд (crossfade opacity 0 -> 1 за 300 мс).
  * При быстрой смене панорам старые незавершенные загрузки отменяются, а неактивные GPU-текстуры уничтожаются (`texture.dispose()`).

```typescript
export interface PanoramaAsset {
  id: string;
  previewUrl: string;       // Низкое разрешение (1024x512, webp)
  highResUrl: string;       // Высокое разрешение (4096x2048, webp)
  title: string;
  initialYaw?: number;      // Начальный угол обзора по горизонтали
  initialPitch?: number;    // Начальный угол наклона по вертикали
}
```

---

### 2. Система хотспотов (Hotspots / Markers)
- **Сферические координаты**:
  Маркеры перехода между комнатами позиционируются строго в сферической системе:
  * `yaw` (азимут / долгота): от $-\pi$ до $+\pi$ (или $0^{\circ} - 360^{\circ}$). При хранении в градусах перевод в радианы выполняется строго на границе рендера.
  * `pitch` (зенит / широта): от $-\pi/2$ (пол) до $+\pi/2$ (потолок).
- **Плавный переход (Fade Transition)**:
  Клик по маркеру не должен вызывать резкую смену кадра:
  1. Плавный доворот камеры (Slerp / tween) на целевой угол маркера (300–400 мс).
  2. Затемнение экрана / растворение оверлея (Fade to Black / Opacity transition 200 мс).
  3. Переключение текстуры панорамы и позиционирование на `initialYaw` новой локации.
  4. Проявление новой панорамы.

```typescript
export interface PanoramaHotspot {
  id: string;
  targetPanoramaId: string;
  yaw: number;               // Радианы или градусы (строго типизировано)
  pitch: number;             // Радианы или градусы
  label: string;             // Подпись (например: "Перейти в спальню")
  iconType?: 'door' | 'stairs' | 'window' | 'info';
}
```

---

### 3. Мобильный UX и гироскоп (DeviceOrientation)
- **Запрет автоматического запроса гироскопа**:
  * В современных браузерах (особенно iOS Safari) вызов `DeviceOrientationEvent.requestPermission()` разрешен **только** по прямому пользовательскому действию (клик по кнопке «Включить гироскоп»).
- **Блокировка перехвата скролла страницы (Touch Gestures)**:
  * Панорама не должна блокировать вертикальный скролл страницы сайта, если встроена в контентный блок.
  * Использовать подсказку «Нажмите для взаимодействия» или требовать двухпальцевый жест для скролла страницы (`touch-action: pan-y;` вне полноэкранного режима).
  * Предусмотреть кнопку Fullscreen API и доступные элементы управления для клавиатуры.

---

### 4. Архитектура фида панорам и привязка к этажности (View From Window)
Для автоматического показа вида из окна выбранной квартиры используется типизированный фид панорам с привязкой к секции, высоте этажа и азимуту окна:

```typescript
export interface ApartmentWindowViewFeed {
  buildingId: string;
  sectionId: string;
  floorNumber: number;
  roomType: 'living-room' | 'kitchen' | 'bedroom' | 'balcony';
  panoramaUrl: string;
  previewUrl: string;
  initialYaw: number;         // Азимут направления окна
  fov: number;                // Поле зрения (~75°)
}

/**
 * Хелпер подбора панорамы для конкретной квартиры
 */
export function findBestWindowPanorama(
  views: ApartmentWindowViewFeed[],
  buildingId: string,
  floorNumber: number,
  preferredRoom: string = 'living-room'
): ApartmentWindowViewFeed | null {
  const exact = views.find(
    (v) => v.buildingId === buildingId && v.floorNumber === floorNumber && v.roomType === preferredRoom
  );
  if (exact) return exact;

  const sameBuilding = views.filter((v) => v.buildingId === buildingId && v.roomType === preferredRoom);
  if (sameBuilding.length === 0) return null;

  return sameBuilding.reduce((closest, curr) => {
    return Math.abs(curr.floorNumber - floorNumber) < Math.abs(closest.floorNumber - floorNumber) ? curr : closest;
  });
}
```
