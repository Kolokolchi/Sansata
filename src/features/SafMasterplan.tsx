import { SelectionImage } from './SelectionImage';
import regions from '../data/saf-masterplan-regions.json';
import image from '../assets/saf-avenue/af1114399be238d7.jpeg';
import type { SelectionImage as SelectionImageData } from '../types';
import { safSectionUnits } from '../lib/safInventory';

const data: SelectionImageData = { image, width: regions.width, height: regions.height, regions: regions.regions.map(region => ({ ...region, points: region.points as [number, number][] })) };
export function SafMasterplan({ section, onSelect }: { section?: string; onSelect: (section: string) => void }) {
  return <div className="saf-masterplan"><SelectionImage data={data} viewBox={regions.viewBox} selected={section} onSelect={onSelect} label={id => `Секция ${id}, ${safSectionUnits.get(id)?.length || 0} квартир в снимке`} /></div>;
}
