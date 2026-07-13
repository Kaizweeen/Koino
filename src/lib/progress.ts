export interface Progress {
  completedDates: string[];
  favorites: string[];
  notes: Record<string, string>;
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
  if (typeof window === "undefined") return { completedDates: [], favorites: [], notes: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completedDates: [], favorites: [], notes: {} };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedDates: parsed.completedDates ?? [],
      favorites: parsed.favorites ?? [],
      notes: parsed.notes ?? {},
    };
  } catch {
    return { completedDates: [], favorites: [], notes: {} };
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

/** Save (or clear, if blank) the personal note for a devotion date. */
export function setNote(date: string, text: string): Progress {
  const p = loadProgress();
  const notes = { ...p.notes };
  if (text.trim() === "") delete notes[date];
  else notes[date] = text;
  p.notes = notes;
  return save(p);
}

export function getNote(p: Progress, date: string): string {
  return p.notes[date] ?? "";
}

/** Devotion dates that have a note, most recent first. */
export function notedDates(p: Progress): string[] {
  return Object.keys(p.notes).sort().reverse();
}

/** The longest run of consecutive completed days, anywhere in the history. */
export function longestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const done = new Set(completedDates);
  let best = 0;
  for (const date of done) {
    // Only start counting from the beginning of a run.
    if (done.has(addDays(date, -1))) continue;
    let run = 0;
    let cursor: string | null = date;
    while (cursor !== null && done.has(cursor)) {
      run += 1;
      cursor = addDays(cursor, 1);
    }
    if (run > best) best = run;
  }
  return best;
}
