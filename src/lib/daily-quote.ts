/** Local calendar date key (YYYY-MM-DD) for stable daily selection. */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Deterministic string hash (djb2 variant) for date → index mapping. */
export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Pick one item per local calendar day; same date always returns the same entry. */
export function pickDailyItem<T extends { id: string }>(items: T[], date = new Date()): T | undefined {
  if (items.length === 0) return undefined;
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const index = hashString(localDateKey(date)) % sorted.length;
  return sorted[index];
}