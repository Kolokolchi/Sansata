import { SelectionImage } from '../types';

/**
 * Создаёт SVG Data URL для архитектурной подложки этажа.
 * Рисует несущие стены, лифтовое ядро, лестницу, коридоры и балконные блоки.
 */
function createFloorPlanSvg(section: number, floor: number, isFourUnits = true): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0ece6" stroke-width="1"/>
    </pattern>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2c3444"/>
      <stop offset="100%" stop-color="#1b2230"/>
    </linearGradient>
    <linearGradient id="coreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e8e2d8"/>
      <stop offset="100%" stop-color="#ded6c9"/>
    </linearGradient>
  </defs>

  <!-- Фон чертежа -->
  <rect width="1200" height="800" fill="#faf8f5"/>
  <rect width="1200" height="800" fill="url(#grid)"/>

  <!-- Внешний периметр здания (контур) -->
  <rect x="80" y="60" width="1040" height="680" rx="6" fill="#ffffff" stroke="#2c3444" stroke-width="4"/>

  <!-- Лифтовой холл и лестничное ядро (центр здания) -->
  <rect x="490" y="270" width="220" height="260" rx="4" fill="url(#coreGrad)" stroke="#8d8171" stroke-width="2"/>
  <text x="600" y="380" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#584e41" text-anchor="middle" letter-spacing="2">ЛИФТОВЫЙ ХОЛЛ</text>
  <text x="600" y="405" font-family="system-ui, sans-serif" font-size="12" fill="#7d7264" text-anchor="middle">СЕКЦИЯ ${section} · ЭТАЖ ${floor}</text>
  
  <!-- Лифтовые шахты -->
  <rect x="510" y="290" width="85" height="60" fill="#d2c8b8" stroke="#8d8171" stroke-width="1.5"/>
  <line x1="510" y1="290" x2="595" y2="350" stroke="#8d8171" stroke-width="1"/>
  <line x1="595" y1="290" x2="510" y2="350" stroke="#8d8171" stroke-width="1"/>
  <rect x="605" y="290" width="85" height="60" fill="#d2c8b8" stroke="#8d8171" stroke-width="1.5"/>
  <line x1="605" y1="290" x2="690" y2="350" stroke="#8d8171" stroke-width="1"/>
  <line x1="690" y1="290" x2="605" y2="350" stroke="#8d8171" stroke-width="1"/>

  <!-- Лестничная клетка -->
  <rect x="520" y="440" width="160" height="70" fill="#e0d7cb" stroke="#8d8171" stroke-width="1.5"/>
  <path d="M 530 450 L 670 450 M 530 460 L 670 460 M 530 470 L 670 470 M 530 480 L 670 480 M 530 490 L 670 490 M 530 500 L 670 500" stroke="#b5a999" stroke-width="1"/>

  <!-- Межквартирные перегородки и коридоры -->
  <!-- Горизонтальный коридор -->
  <rect x="80" y="370" width="410" height="60" fill="#f5f0e8"/>
  <rect x="710" y="370" width="410" height="60" fill="#f5f0e8"/>
  
  <!-- Несущие пилоны / стены (темные акценты) -->
  <rect x="480" y="60" width="16" height="310" fill="url(#wallGrad)"/>
  <rect x="704" y="60" width="16" height="310" fill="url(#wallGrad)"/>
  <rect x="480" y="430" width="16" height="310" fill="url(#wallGrad)"/>
  <rect x="704" y="430" width="16" height="310" fill="url(#wallGrad)"/>

  ${isFourUnits ? `
  <!-- Разделитель левой части на 2 квартиры -->
  <rect x="80" y="362" width="400" height="8" fill="url(#wallGrad)"/>
  <!-- Разделитель правой части на 2 квартиры -->
  <rect x="720" y="362" width="400" height="8" fill="url(#wallGrad)"/>
  ` : `
  <!-- Разделитель для 3 квартир -->
  <rect x="80" y="362" width="400" height="8" fill="url(#wallGrad)"/>
  `}

  <!-- Окна и остекление по фасаду -->
  <line x1="160" y1="60" x2="400" y2="60" stroke="#79a2d8" stroke-width="6"/>
  <line x1="800" y1="60" x2="1040" y2="60" stroke="#79a2d8" stroke-width="6"/>
  <line x1="160" y1="740" x2="400" y2="740" stroke="#79a2d8" stroke-width="6"/>
  <line x1="800" y1="740" x2="1040" y2="740" stroke="#79a2d8" stroke-width="6"/>
  <line x1="80" y1="160" x2="80" y2="300" stroke="#79a2d8" stroke-width="6"/>
  <line x1="80" y1="500" x2="80" y2="640" stroke="#79a2d8" stroke-width="6"/>
  <line x1="1120" y1="160" x2="1120" y2="300" stroke="#79a2d8" stroke-width="6"/>
  <line x1="1120" y1="500" x2="1120" y2="640" stroke="#79a2d8" stroke-width="6"/>

  <!-- Компас на чертеже -->
  <g transform="translate(1120, 110)">
    <circle r="22" fill="#ffffff" stroke="#c9c0b3" stroke-width="1.5"/>
    <polygon points="0,-16 5,-3 0,0 -5,-3" fill="#1946b8"/>
    <polygon points="0,16 5,3 0,0 -5,3" fill="#9da8b6"/>
    <text x="0" y="-20" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#1946b8" text-anchor="middle">С</text>
    <text x="0" y="27" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#9da8b6" text-anchor="middle">Ю</text>
  </g>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Стандартные замкнутые полигоны для 4 квартир на этаже (Секция 1 / Секция 2).
 * Система координат: 1200 x 800 px.
 */
export function getFourUnitPolygons(ids: [string, string, string, string]): SelectionImage['regions'] {
  return [
    // Квартира 1: Верхний левый угол
    {
      id: ids[0],
      points: [
        [82, 62],
        [480, 62],
        [480, 362],
        [82, 362]
      ]
    },
    // Квартира 2: Верхний правый угол
    {
      id: ids[1],
      points: [
        [720, 62],
        [1118, 62],
        [1118, 362],
        [720, 362]
      ]
    },
    // Квартира 3: Нижний левый угол
    {
      id: ids[2],
      points: [
        [82, 438],
        [480, 438],
        [480, 738],
        [82, 738]
      ]
    },
    // Квартира 4: Нижний правый угол
    {
      id: ids[3],
      points: [
        [720, 438],
        [1118, 438],
        [1118, 738],
        [720, 738]
      ]
    }
  ];
}

/**
 * Стандартные замкнутые полигоны для 3 квартир на этаже.
 */
export function getThreeUnitPolygons(ids: [string, string, string]): SelectionImage['regions'] {
  return [
    // Квартира 1: Верхняя левая часть
    {
      id: ids[0],
      points: [
        [82, 62],
        [480, 62],
        [480, 362],
        [82, 362]
      ]
    },
    // Квартира 2: Верхний правый угол + торец
    {
      id: ids[1],
      points: [
        [720, 62],
        [1118, 62],
        [1118, 738],
        [720, 738],
        [720, 438],
        [720, 362]
      ]
    },
    // Квартира 3: Нижний левый угол
    {
      id: ids[2],
      points: [
        [82, 438],
        [480, 438],
        [480, 738],
        [82, 738]
      ]
    }
  ];
}

/**
 * Реестр эталонных векторных поэтажных планов ЖК Shattyq.
 * Ключ: `${section}-${floor}`.
 */
export const defaultFloorPlans: Record<string, SelectionImage> = {
  // Секция 1, 7 этаж (4 квартиры: shattyq-1, shattyq-3, shattyq-11, shattyq-12)
  '1-7': {
    image: createFloorPlanSvg(1, 7, true),
    width: 1200,
    height: 800,
    regions: getFourUnitPolygons(['shattyq-1', 'shattyq-3', 'shattyq-11', 'shattyq-12'])
  },
  // Секция 1, 3 этаж (4 квартиры: shattyq-2, shattyq-4, shattyq-13, shattyq-14)
  '1-3': {
    image: createFloorPlanSvg(1, 3, true),
    width: 1200,
    height: 800,
    regions: getFourUnitPolygons(['shattyq-2', 'shattyq-4', 'shattyq-13', 'shattyq-14'])
  },
  // Секция 1, 2 этаж (3 квартиры: shattyq-5, shattyq-9, shattyq-10)
  '1-2': {
    image: createFloorPlanSvg(1, 2, false),
    width: 1200,
    height: 800,
    regions: getThreeUnitPolygons(['shattyq-5', 'shattyq-9', 'shattyq-10'])
  },
  // Секция 2, 9 этаж (3 квартиры: shattyq-6, shattyq-15, shattyq-19)
  '2-9': {
    image: createFloorPlanSvg(2, 9, false),
    width: 1200,
    height: 800,
    regions: getThreeUnitPolygons(['shattyq-6', 'shattyq-15', 'shattyq-19'])
  },
  // Секция 2, 3 этаж (3 квартиры: shattyq-7, shattyq-16, shattyq-20)
  '2-3': {
    image: createFloorPlanSvg(2, 3, false),
    width: 1200,
    height: 800,
    regions: getThreeUnitPolygons(['shattyq-7', 'shattyq-16', 'shattyq-20'])
  },
  // Секция 2, 2 этаж (3 квартиры: shattyq-8, shattyq-17, shattyq-18)
  '2-2': {
    image: createFloorPlanSvg(2, 2, false),
    width: 1200,
    height: 800,
    regions: getThreeUnitPolygons(['shattyq-8', 'shattyq-17', 'shattyq-18'])
  }
};

/**
 * Получить или сгенерировать план этажа для секции и этажа.
 * Если для этажа нет индивидуального набора, возвращает типовой план секции.
 */
export function getFloorPlanMedia(section: number, floor: number): SelectionImage {
  const key = `${section}-${floor}`;
  if (defaultFloorPlans[key]) {
    return defaultFloorPlans[key];
  }

  // Для остальных этажей формируем типовой этаж
  if (section === 1) {
    const isOdd = floor % 2 === 1;
    const baseIds = isOdd
      ? (['shattyq-1', 'shattyq-3', 'shattyq-11', 'shattyq-12'] as [string, string, string, string])
      : (['shattyq-2', 'shattyq-4', 'shattyq-13', 'shattyq-14'] as [string, string, string, string]);
    return {
      image: createFloorPlanSvg(section, floor, true),
      width: 1200,
      height: 800,
      regions: getFourUnitPolygons(baseIds)
    };
  }

  // Секция 2 (3 квартиры на этаже)
  const isHigh = floor > 5;
  const baseIds = isHigh
    ? (['shattyq-6', 'shattyq-15', 'shattyq-19'] as [string, string, string])
    : (['shattyq-7', 'shattyq-16', 'shattyq-20'] as [string, string, string]);
  return {
    image: createFloorPlanSvg(section, floor, false),
    width: 1200,
    height: 800,
    regions: getThreeUnitPolygons(baseIds)
  };
}
