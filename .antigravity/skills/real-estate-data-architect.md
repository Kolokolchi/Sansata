# Real Estate Data Architect

## Роль
Архитектор схемы данных, доменных моделей и структур для интерактивных планов недвижимости, поэтажных схем, шахматок и баз данных квартирографии.

---

## Архитектурные правила и стандарты

### 1. Единая иерархическая типизация сущностей
Вся система оперирует строгой четырехуровневой иерархией:
$$\text{Building (Дом/Корпус)} \longrightarrow \text{Section (Секция/Подъезд)} \longrightarrow \text{Floor (Этаж)} \longrightarrow \text{Apartment (Квартира/Лот)}$$

```typescript
export type ApartmentStatus = 'available' | 'reserved' | 'sold';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Модель сущности Квартира (Apartment)
 */
export interface Apartment {
  id: string;                    // Уникальный идентификатор (UUID или строковый slug)
  number: string;                // Номер квартиры на объекте (строка, так как бывают '42-А')
  rooms: number;                 // Количество комнат (0 для студий, 1, 2, 3, 4+)
  area: number;                  // Общая приведенная площадь (кв. м)
  price: number;                 // Полная стоимость в валюте проекта (рубли/тенге)
  status: ApartmentStatus;       // Строгий статус: 'available' | 'reserved' | 'sold'
  polygonPoints: Point2D[];      // Массив вершин полигона на плане этажа во внутренней сетке viewBox
  
  // Метаданные связи и планировки
  floorId: string;               // Ссылка на родительский этаж
  sectionId: string;             // Ссылка на секцию
  buildingId: string;            // Ссылка на здание
  layoutUrl?: string;            // Ссылка на детальный рендер/планировку квартиры
  pricePerMeter?: number;        // Стоимость за квадратный метр (вычисляемое или фиксированное)
}

/**
 * Модель сущности Этаж (Floor)
 */
export interface Floor {
  id: string;
  buildingId: string;
  sectionId: string;
  number: number;                // Порядковый номер этажа (-1, 1, 2...)
  svgViewBox: string;            // Исходный viewBox этажа (например "0 0 1920 1080")
  planSvgUrl?: string;           // URL векторной или растровой подложки плана этажа
  apartments: Apartment[];       // Список квартир на этаже
}

/**
 * Модель сущности Секция (Section)
 */
export interface Section {
  id: string;
  buildingId: string;
  number: string | number;       // Номер или литера секции ("Секция 1", "Блок B")
  floors: Floor[];
}

/**
 * Модель сущности Здание / Корпус (Building)
 */
export interface Building {
  id: string;
  name: string;                  // Например: "Корпус 3 (Башня Восток)"
  sections: Section[];
  totalApartments?: number;
  availableApartments?: number;
}
```

---

## 2. Быстрая O(1) индексация и состояние в UI
Для обеспечения плавного 60-120 FPS отклика при hover-событиях над десятками и сотнями полигонов:
- **Запрет линейного поиска `array.find()`**: Недопустимо выполнять `apartments.find(a => a.id === hoveredId)` в обработчиках событий мыши `mousemove` или `mouseenter`.
- **Нормализованный словарь (Lookup Map)**:
  Все данные индексируются при инициализации или загрузке:
  ```typescript
  export interface NormalizedFloorState {
    apartmentsById: Record<string, Apartment>;
    statusIndex: {
      available: Set<string>;
      reserved: Set<string>;
      sold: Set<string>;
    };
    roomsIndex: Map<number, Set<string>>;
  }
  
  export function createFloorIndex(apartments: Apartment[]): NormalizedFloorState {
    const apartmentsById: Record<string, Apartment> = {};
    const statusIndex = {
      available: new Set<string>(),
      reserved: new Set<string>(),
      sold: new Set<string>()
    };
    const roomsIndex = new Map<number, Set<string>>();

    for (const apt of apartments) {
      apartmentsById[apt.id] = apt;
      statusIndex[apt.status].add(apt.id);

      if (!roomsIndex.has(apt.rooms)) {
        roomsIndex.set(apt.rooms, new Set());
      }
      roomsIndex.get(apt.rooms)!.add(apt.id);
    }

    return { apartmentsById, statusIndex, roomsIndex };
  }
  ```

---

## 3. Схема реляционной базы данных (SQLite)

Локальная база данных `apartments.db` структурирована с индексами по внешним ключам и статусам:

```sql
CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    number TEXT NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    floor_number INTEGER NOT NULL,
    svg_viewbox TEXT NOT NULL,
    plan_svg_url TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apartments (
    id TEXT PRIMARY KEY,
    floor_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    building_id TEXT NOT NULL,
    number TEXT NOT NULL,
    rooms INTEGER NOT NULL,
    area REAL NOT NULL,
    price REAL NOT NULL,
    status TEXT CHECK(status IN ('available', 'reserved', 'sold')) NOT NULL,
    polygon_points TEXT NOT NULL, -- JSON-сериализованный массив: [{"x":10,"y":20},...]
    layout_url TEXT,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- Индексы для мгновенной выборки
CREATE INDEX IF NOT EXISTS idx_apartments_floor_id ON apartments(floor_id);
CREATE INDEX IF NOT EXISTS idx_apartments_status ON apartments(status);
CREATE INDEX IF NOT EXISTS idx_apartments_rooms ON apartments(rooms);
CREATE INDEX IF NOT EXISTS idx_apartments_price ON apartments(price);
```
