export interface SoapEntry {
  observation: string;
  application: string;
  prayer: string;
}

export interface Progress {
  completedDates: string[];
  favorites: string[];
  entries: Record<string, SoapEntry>;
  notes: Record<string, string>; // legacy; read-only in UI, never destroyed
}

const EMPTY_ENTRY: SoapEntry = { observation: "", application: "", prayer: "" };

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
  if (typeof window === "undefined") return { completedDates: [], favorites: [], entries: {}, notes: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completedDates: [], favorites: [], entries: {}, notes: {} };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedDates: parsed.completedDates ?? [],
      favorites: parsed.favorites ?? [],
      entries: parsed.entries ?? {},
      notes: parsed.notes ?? {},
    };
  } catch {
    return { completedDates: [], favorites: [], entries: {}, notes: {} };
  }
}

function save(p: Progress): Progress {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

/** Overwrite the entire stored progress. Used by backup import. */
export function replaceProgress(p: Progress): Progress {
  return save(p);
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

export function getEntry(p: Progress, date: string): SoapEntry {
  return { ...EMPTY_ENTRY, ...(p.entries[date] ?? {}) };
}

function isEmptyEntry(e: SoapEntry): boolean {
  return e.observation.trim() === "" && e.application.trim() === "" && e.prayer.trim() === "";
}

/** Auto-save one SOAP field for a date. Removes the entry entirely when all fields go blank. */
export function setSoapField(date: string, field: keyof SoapEntry, text: string): Progress {
  const p = loadProgress();
  const next: SoapEntry = { ...getEntry(p, date), [field]: text };
  const entries = { ...p.entries };
  if (isEmptyEntry(next)) delete entries[date];
  else entries[date] = next;
  p.entries = entries;
  return save(p);
}

export function hasWrittenEntry(p: Progress, date: string): boolean {
  const e = p.entries[date];
  return e !== undefined && !isEmptyEntry(e);
}

/** Dates that have a SOAP entry or a legacy note, most recent first, de-duplicated. */
export function entryDates(p: Progress): string[] {
  const dates = new Set<string>();
  for (const [date, e] of Object.entries(p.entries)) if (!isEmptyEntry(e)) dates.add(date);
  for (const date of Object.keys(p.notes)) dates.add(date);
  return [...dates].sort().reverse();
}

/** The non-empty SOAP parts joined for sharing. */
export function soapText(entry: SoapEntry): string {
  return [entry.observation, entry.application, entry.prayer].map((s) => s.trim()).filter(Boolean).join("\n\n");
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
