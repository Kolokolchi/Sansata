import snapshot from '../data/saf-stock-snapshot.json';
import { siteUrl } from '../lib/site';

const byPlan = new Map<string, typeof snapshot.observations>();
for (const observation of snapshot.observations) {
  if (!observation.planCode) continue;
  const entries = byPlan.get(observation.planCode) || [];
  entries.push(observation);
  byPlan.set(observation.planCode, entries);
}
export function SafPlanEvidence({ code }: { code: string }) {
  const entries = byPlan.get(code) || [];
  if (!entries.length) return null;
  return <section className="saf-plan-evidence"><h2>Связанные квартиры в снимке</h2><p>Прямая связь из публичного каталога на 28.09.2026. Текущее наличие уточняется.</p><div>{entries.map(entry => <a key={entry.id} href={siteUrl(`/saf/stock?section=${entry.section}&floor=${entry.floor}&unit=${entry.id}`)}>Секция {entry.section} · этаж {entry.floor} · № {entry.number} ↗</a>)}</div><a href={siteUrl(`/saf/materials?tab=floors&block=${entries[0].section}`)}>Схемы блока из официального буклета →</a></section>;
}
