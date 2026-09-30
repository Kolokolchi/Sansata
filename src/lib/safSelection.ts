/** Public catalogue codes group layout variants; they are not apartment IDs. */
export const SAF_BLOCKS = [1, 2, 3, 4, 5, 6, 7] as const;
export const SAF_ROOMS = [1, 2, 3, 4, 5] as const;

export function parseSafPlanCode(code: string): { block: number; level: string } | null {
  const match = /^KV-P([1-7])-(E\d+|T\d+)-S\d+$/.exec(code);
  return match ? { block: Number(match[1]), level: match[2] } : null;
}

export function parseOptionalBound(value: string, fallback: number): number {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

export function groupSafPlans<T extends { code: string }>(plans: readonly T[]) {
  type Entry = { plan: T; place: { block: number; level: string } };
  const entries: Entry[] = [];
  const byCode = new Map<string, Entry>();
  const byBlock = new Map<number, T[]>();
  const byBlockLevel = new Map<number, Map<string, T[]>>();
  for (const plan of plans) {
    const place = parseSafPlanCode(plan.code);
    if (!place) continue;
    const entry = { plan, place };
    entries.push(entry);
    byCode.set(plan.code, entry);
    if (!byBlock.has(place.block)) byBlock.set(place.block, []);
    byBlock.get(place.block)!.push(plan);
    if (!byBlockLevel.has(place.block)) byBlockLevel.set(place.block, new Map());
    const levels = byBlockLevel.get(place.block)!;
    if (!levels.has(place.level)) levels.set(place.level, []);
    levels.get(place.level)!.push(plan);
  }
  return { entries, byCode, byBlock, byBlockLevel };
}

export function compareSafLevels(a: string, b: string): number {
  const aFloor = a.startsWith('E');
  const bFloor = b.startsWith('E');
  if (aFloor !== bFloor) return aFloor ? -1 : 1;
  return Number(a.slice(1)) - Number(b.slice(1));
}

export function safLevelLabel(level: string): string {
  return level.startsWith('E') ? `Этаж ${Number(level.slice(1))}` : `Уровень ${level}`;
}
