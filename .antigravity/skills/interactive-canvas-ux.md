# Interactive Canvas & Viewport UX Specialist

## Роль
Специалист по разработке высокопроизводительной интерактивной графики, бесшовному взаимодействию с чертежами и планами (Pan & Zoom), плавной физике управления сценой и отзывчивому интерфейсу без перерисовок (zero-jank 60/120 FPS).

---

## Архитектурные правила и стандарты

### 1. Бесшовный Pan & Zoom без подергиваний и замыливания
- **Аппаратное ускорение (GPU Layering)**:
  * Трансформации сцены (масштабирование и панорамирование) должны реализовываться через матричные трансформации CSS на контейнере холста:
    `transform: translate3d(${x}px, ${y}px, 0) scale(${scale});`
  * Контейнер обязан иметь свойство `will-change: transform;` и `backface-visibility: hidden;`, выносящие слой рендера на GPU.
- **Векторная четкость при зумировании**:
  * Векторный SVG рендерится с `shape-rendering: geometricPrecision;` или `crispEdges` (в зависимости от наличия диагоналей), предотвращая артефакты субпиксельного антиалиасинга.
  * Фоновые растровые подложки планов (если используются) должны иметь стиль `image-rendering: -webkit-optimize-contrast;` / `crisp-edges` для четкости линий стен.
- **Инвариантный фокус зума (Zoom to Mouse Point)**:
  * При зумировании колесом мыши точка под курсором должна оставаться на том же месте экрана:
    $$\Delta x = (mouse_x - current_x) \cdot (1 - \frac{newScale}{currentScale})$$
    $$\Delta y = (mouse_y - current_y) \cdot (1 - \frac{newScale}{currentScale})$$
- **Ограничения (Clamping & Bounds)**:
  * Фиксируются минимальный и максимальный масштаб (например, `minScale: 0.5`, `maxScale: 5.0`).
  * Панорамирование ограничивается мягким демпфированием (rubber-banding) по краям сцены.

---

## 2. Всплывающие подсказки через `@floating-ui/dom` с виртуальными элементами (Virtual Anchors)
При наведении на сложный SVG-полигон тултип не должен быть привязан к физическому DOM-узлу полигона, так как `getBoundingClientRect()` полигона охватывает весь прямоугольник его описанного Bounding Box (что приводит к неточным координатам на диагональных или вогнутых квартирах).

Вместо этого используется **Virtual Element** на основе расчетного центроида или экранных координат курсора:

```typescript
import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom';

export interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
}

/**
 * Создает виртуальный якорь Floating UI из точки в экранных координатах
 */
export function createVirtualAnchor(screenPoint: { x: number; y: number }, contextEl: Element): VirtualAnchor {
  return {
    getBoundingClientRect: () => new DOMRect(screenPoint.x, screenPoint.y, 0, 0),
    contextElement: contextEl
  };
}

/**
 * Позиционирует карточку квартиры над виртуальным якорем
 */
export function positionApartmentTooltip(
  anchor: VirtualAnchor,
  tooltipEl: HTMLElement,
  onUpdate: (coords: { x: number; y: number }) => void
): () => void {
  return autoUpdate(anchor, tooltipEl, () => {
    computePosition(anchor, tooltipEl, {
      placement: 'top',
      middleware: [
        offset(12), // отступ от маркера/точки
        flip({ fallbackPlacements: ['bottom', 'right', 'left'] }),
        shift({ padding: 16 }) // защита от выхода за экран
      ]
    }).then(({ x, y }) => {
      onUpdate({ x, y });
    });
  });
}
```

---

## 3. Оптимизация рендеринга и изоляция Hover-состояний
При наведении курсора на соседние квартиры перерисовка всего дерева компонентов недопустима:

- **Разделение слоев (Layer Isolation)**:
  * **Слой 1: Фоновая подложка** (`pointer-events: none`) — статичная растрово-векторная основа.
  * **Слой 2: Интерактивная сетка полигонов** (`pointer-events: visiblePainted`) — прозрачные или полупрозрачные формы квартир.
  * **Слой 3: Маркеры и бейджи** (`pointer-events: none`) — центроиды, номера квартир.
  * **Слой 4: Оверлей тултипа** (`pointer-events: auto`) — всплывающая карточка.
- **Подсветка без React Re-render**:
  * Не использовать тяжелый глобальный стейт `hoveredApartmentId` для изменения стилей 100 полигонов.
  * Использовать CSS-селекторы:
    ```css
    .apartment-polygon {
      fill: rgba(34, 197, 94, 0.15);
      stroke: rgba(34, 197, 94, 0.6);
      stroke-width: 1.5px;
      transition: fill 0.15s ease, stroke 0.15s ease;
      pointer-events: visiblePainted;
    }
    .apartment-polygon:hover {
      fill: rgba(34, 197, 94, 0.45);
      stroke: rgba(34, 197, 94, 1);
      stroke-width: 2.5px;
    }
    .apartment-polygon[data-status="sold"] {
      fill: rgba(156, 163, 175, 0.2);
      stroke: rgba(156, 163, 175, 0.5);
    }
    .apartment-polygon[data-status="reserved"] {
      fill: rgba(245, 158, 11, 0.2);
      stroke: rgba(245, 158, 11, 0.6);
    }
    ```
- **Троттлинг событий мыши через `requestAnimationFrame`**:
  * Обновление координат курсора и панорамирование синхронизируются с частотой развертки экрана через `rAF`, устраняя микрофризы.
