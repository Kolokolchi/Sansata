import snapshot from '../data/saf-stock-snapshot.json';

// Historical public observations remain separate from current saleable inventory.
export const safObservedDate = '28.09.2026';
export const safApartments = snapshot.observations.filter(unit => unit.kind === 'residential');
export type SafObservedApartment = (typeof safApartments)[number];
export const safApartmentById = new Map(safApartments.map(unit => [unit.id, unit]));
export const safSectionUnits = new Map<string, SafObservedApartment[]>();
export const safFloorUnits = new Map<string, SafObservedApartment[]>();
for (const unit of safApartments) {
  const section = safSectionUnits.get(unit.section) || [];
  section.push(unit); safSectionUnits.set(unit.section, section);
  const key = `${unit.section}/${unit.floor}`;
  const floor = safFloorUnits.get(key) || [];
  floor.push(unit); safFloorUnits.set(key, floor);
}
export function safSectionFloors(section: string) {
  return [...new Set((safSectionUnits.get(section) || []).map(unit => unit.floor))].sort((a, b) => b - a);
}
export const safApartmentPath = (id: string) => `/saf/apartment/${encodeURIComponent(id)}`;
export const safFloorPath = (section: string, floor: number) => `/saf/visual/block/${section}/floor/${floor}`;
export const safObservedLabels: Record<string, string> = { available: 'Свободно', reserved: 'Бронь', sold: 'Продано', unknown: 'Неизвестно' };
