export interface Progress {
  completedDates: string[];
  favorites: string[];
}

const KEY = "koino.progress.v1";

function addDays(date: string, delta: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function computeStreak(completedDates: string[], today: string): number {
  const done = new Set(completedDates);
  let cursor = done.has(today) ? today : addDays(today, -1);
  if (!done.has(cursor)) return 0;
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { completedDates: [], favorites: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completedDates: [], favorites: [] };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { completedDates: parsed.completedDates ?? [], favorites: parsed.favorites ?? [] };
  } catch {
    return { completedDates: [], favorites: [] };
  }
}

function save(p: Progress): Progress {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export function markComplete(date: string): Progress {
  const p = loadProgress();
  if (!p.completedDates.includes(date)) p.completedDates = [...p.completedDates, date].sort();
  return save(p);
}

export function toggleFavorite(date: string): Progress {
  const p = loadProgress();
  p.favorites = p.favorites.includes(date)
    ? p.favorites.filter((d) => d !== date)
    : [...p.favorites, date].sort();
  return save(p);
}

export function isFavorite(p: Progress, date: string): boolean {
  return p.favorites.includes(date);
}
