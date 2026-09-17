import original from '../data/shattyq.json';
import {
  Flat,
  Panorama,
  MediaAlbum,
  ProjectDocument,
  CameraStream,
  ExperienceConfig,
  MortgageCalculationResult
} from '../types';

export type { Flat, Panorama, MediaAlbum, ProjectDocument, CameraStream, ExperienceConfig };

// Секции и этажи по оригинальным чертежам
const positions: [number, number][] = [
  [1, 7], [1, 3], [1, 7], [1, 3], [1, 2],
  [2, 9], [2, 3], [2, 2], [1, 2], [1, 2],
  [1, 7], [1, 7], [1, 3], [1, 3], [2, 9],
  [2, 3], [2, 2], [2, 2], [2, 9], [2, 3]
];

// Только проверенные площади помещений, подсчитанные по чертежам
const measuredAreas: Record<number, number[]> = {
  1: [5.73, 10.99, 14.92, 15.05, 21.66, 1.96],
  6: [3.70, 4.08, 4.51, 8.72, 5.72, 29.26, 6.40, 15.05, 21.63, 2.01],
  18: [34.08, 6.53, 6.53, 5.08, 6.90, 7.75, 11.75, 5.72, 5.28, 3.96, 3.72, 25.80, 18.41, 17.14, 2.01]
};

export const flats: Flat[] = original.plans.map((plan, index) => {
  const [section, floor] = positions[index];
  const measured = measuredAreas[index + 1];
  const area = measured
    ? Math.round(measured.reduce((acc, val) => acc + val, 0) * 100) / 100
    : null;

  return {
    ...plan,
    section,
    floor,
    area,
    areaKind: 'calculated',
    price: null,
    status: 'unknown',
    features: ['Лоджия', ...(plan.rooms === 4 ? ['Гардеробная'] : [])]
  };
});

export const fallbackConfig: ExperienceConfig = {
  version: 1,
  model: {
    url: '/models/shattyq_complex.glb',
    label: 'ЖК Shattyq · 3D-модель комплекса',
    scale: 1
  },
  panoramas: [],
  constructionAlbums: [],
  cameras: [],
  documents: [],
  inventory: [],
  leadEndpoint: '/api/leads',
  source: original.source
};

/**
 * Форматирование суммы в казахстанских тенге (₸).
 */
export const money = (amount: number): string =>
  new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 }).format(amount) + ' ₸';

/**
 * Человекочитаемая подпись площади.
 */
export const areaLabel = (flat: Flat): string => {
  if (flat.area === null) {
    return 'Площадь на чертеже';
  }
  return `${flat.areaKind === 'calculated' ? '≈ ' : ''}${flat.area.toLocaleString('ru-RU')} м²`;
};

export const statusLabel: Record<Flat['status'], string> = {
  unknown: 'Наличие уточняется',
  available: 'В продаже',
  reserved: 'Забронирована',
  sold: 'Продана'
};

/**
 * Расчет аннуитетного ипотечного платежа.
 */
export function calculateMortgage(
  price: number,
  downPayment: number,
  years: number,
  annualRate: number
): MortgageCalculationResult {
  const principal = Math.max(0, price - downPayment);
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualRate / 1200;

  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const interest = Math.max(0, payment * months - principal);
  const total = payment * months + downPayment;

  return {
    principal,
    payment,
    interest,
    total
  };
}
