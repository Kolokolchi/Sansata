import { Flat } from '../lib/experience';

export interface VisualSection {
  id: number;
  label: string;
  floors: string;
  points: string;
  badgePos: { x: number; y: number };
}

export interface VisualPOI {
  id: string;
  label: string;
  x: number;
  y: number;
  type: '360' | 'yard' | 'school' | 'info';
}

export interface VisualAngle {
  id: 'cam5' | 'cam6';
  rotateId: string;
  title: string;
  subtitle: string;
  image: string;
  width: number;
  height: number;
  sections: VisualSection[];
  poiPins: VisualPOI[];
}

export const SHATTYQ_VISUAL_ANGLES: VisualAngle[] = [
  {
    id: 'cam5',
    rotateId: '57',
    title: 'Главный фасад и проспект',
    subtitle: 'Аэроракурс 1 · Вид со стороны проспекта и горного хребта',
    image: '/images/3d_tour/visual_cam5.jpg',
    width: 2560,
    height: 1440,
    sections: [
      {
        id: 1,
        label: 'Секция 1',
        floors: '9 этажей',
        points:
          '885,1440 885,410 1090,260 1330,310 1330,480 1130,480 1130,530 1375,525 1535,605 1535,1130 1395,1440 885,1440',
        badgePos: { x: 1150, y: 650 }
      },
      {
        id: 2,
        label: 'Секция 2',
        floors: '12 этажей',
        points:
          '1570,1440 1535,1130 1535,605 1440,530 1440,215 1770,260 1770,480 1600,520 1600,720 1970,850 1970,1220 1750,1440 1570,1440',
        badgePos: { x: 1700, y: 600 }
      }
    ],
    poiPins: [
      {
        id: 'tour360',
        label: '360° Тур во дворе',
        x: 1540,
        y: 920,
        type: '360'
      },
      {
        id: 'courtyard',
        label: 'Благоустроенный двор',
        x: 1500,
        y: 1040,
        type: 'yard'
      },
      {
        id: 'avenue',
        label: 'Проспект и выезд в город',
        x: 230,
        y: 880,
        type: 'info'
      }
    ]
  },
  {
    id: 'cam6',
    rotateId: '64',
    title: 'Двор и пешеходный бульвар',
    subtitle: 'Аэроракурс 2 · Вид со стороны школы и придомовой территории',
    image: '/images/3d_tour/visual_cam6.jpg',
    width: 2560,
    height: 1440,
    sections: [
      {
        id: 1,
        label: 'Секция 1',
        floors: '9 этажей',
        points:
          '560,1440 360,980 360,680 580,580 640,540 850,560 850,620 980,640 980,980 780,1440 560,1440',
        badgePos: { x: 650, y: 700 }
      },
      {
        id: 2,
        label: 'Секция 2',
        floors: '12 этажей',
        points:
          '1100,1440 1090,1020 1090,790 1320,690 1380,520 1740,550 1740,780 1630,840 1630,1080 1570,1440 1100,1440',
        badgePos: { x: 1350, y: 800 }
      }
    ],
    poiPins: [
      {
        id: 'tour360',
        label: '360° Тур во дворе',
        x: 1060,
        y: 920,
        type: '360'
      },
      {
        id: 'courtyard',
        label: 'Двор без машин',
        x: 1020,
        y: 1040,
        type: 'yard'
      },
      {
        id: 'school',
        label: 'Школа и детский сад',
        x: 1950,
        y: 950,
        type: 'school'
      }
    ]
  }
];

export function resolveVisualAngle(queryParam?: string | null): VisualAngle {
  if (!queryParam) return SHATTYQ_VISUAL_ANGLES[0];
  const found = SHATTYQ_VISUAL_ANGLES.find(
    (a) =>
      a.rotateId === queryParam ||
      a.id === queryParam ||
      (queryParam === '1' && a.id === 'cam6') ||
      (queryParam === '0' && a.id === 'cam5')
  );
  return found || SHATTYQ_VISUAL_ANGLES[0];
}

export function getSectionPlansSummary(flats: Flat[], sectionId: number) {
  const sectionFlats = flats.filter((f) => f.section === sectionId);
  const roomsMap = new Map<number, number>();
  let minArea = Infinity;
  let maxArea = -Infinity;

  for (const f of sectionFlats) {
    roomsMap.set(f.rooms, (roomsMap.get(f.rooms) || 0) + 1);
    if (typeof f.area === 'number') {
      if (f.area < minArea) minArea = f.area;
      if (f.area > maxArea) maxArea = f.area;
    }
  }

  const roomLabels = Array.from(roomsMap.keys())
    .sort((a, b) => a - b)
    .map((r) => `${r}-комн.`);

  return {
    totalPlans: sectionFlats.length,
    roomsMap,
    roomLabels,
    minArea: Number.isFinite(minArea) ? minArea : 42,
    maxArea: Number.isFinite(maxArea) ? maxArea : 115
  };
}
