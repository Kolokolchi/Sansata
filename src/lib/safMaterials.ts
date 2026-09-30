import materials from '../data/saf-materials.json';
import original from '../data/saf-plans.json';

const files = import.meta.glob<string>('../assets/saf-avenue/*', { eager: true, query: '?url', import: 'default' });
const localBySource = new Map(materials.assets.map(asset => [asset.source, files[`../assets/saf-avenue/${asset.file}`]]));
export function safMediaUrl(source: string): string {
  const local = localBySource.get(source);
  if (!local) throw new Error('SAF media missing from local manifest');
  return local;
}
export const safPlans = { ...original, plans: original.plans.map(plan => ({ ...plan, image: safMediaUrl(plan.image) })) };
export const safHero = safMediaUrl('https://static.tildacdn.pro/tild3730-3865-4164-b332-323637353438/freepik__img1-make-t.jpeg');
export { materials };
