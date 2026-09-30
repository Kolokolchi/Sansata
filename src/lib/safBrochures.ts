import documents from '../data/saf-brochures.json';
const pages = import.meta.glob<string>('../assets/saf-brochures/*.jpg', { eager: true, query: '?url', import: 'default' });
export function brochurePage(document: string, page: number) {
  return pages[`../assets/saf-brochures/${document}-${String(page).padStart(2, '0')}.jpg`];
}
// Page labels verified visually in the original PDF; typical floors have no asserted range.
export const floorSheets = [
  { page: 13, blocks: [1], label: 'Блок 1 · типовой этаж' },
  { page: 14, blocks: [1], label: 'Блок 1 · 12 этаж' },
  { page: 15, blocks: [2, 3, 4], label: 'Блоки 2, 3, 4 · типовой этаж' },
  { page: 16, blocks: [2], label: 'Блок 2 · 2 этаж' },
  { page: 17, blocks: [3], label: 'Блок 3 · 2 этаж' },
  { page: 18, blocks: [4], label: 'Блок 4 · 2 этаж' },
  { page: 19, blocks: [2, 3, 4], label: 'Блоки 2, 3, 4 · 12 этаж' },
  { page: 20, blocks: [5], label: 'Блок 5 · типовой этаж' },
  { page: 21, blocks: [5], label: 'Блок 5 · 9 этаж' },
  { page: 22, blocks: [6], label: 'Блок 6 · типовой этаж' },
  { page: 23, blocks: [6], label: 'Блок 6 · 12 этаж' },
  { page: 24, blocks: [7], label: 'Блок 7 · типовой этаж' },
  { page: 25, blocks: [7], label: 'Блок 7 · 13 этаж' },
];
export { documents };
