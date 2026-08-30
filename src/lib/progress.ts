import { markStorageFailed, readRaw, writeRaw } from "@/lib/storage";
import type { MoodSlug } from "@/lib/themes";

export interface SoapEntry {
  observation: string;
  application: string;
  prayer: string;
}

/**
 * A SOAP reflection on a verse the reader chose, rather than on the devotion of a given day.
 *
 * The daily entries can be keyed by date because a date resolves back to a devotion. A chosen
 * verse has no such anchor — nothing about "2026-08-30" says you sat with Romans 8, and a person
 * may well sit with two passages in one day — so a reflection carries its own id and keeps the
 * verse alongside what was written. Storing the text rather than just the reference is deliberate:
 * the journal has to render an entry without going back to the network for the words.
 */
export interface VerseReflection {
  id: string;
  /** The local date it was written, YYYY-MM-DD. */
  date: string;
  /** When the first words went in — what orders two reflections written on the same day. */
  createdAt: string;
  verseRef: string;
  verseText: string;
  mood: MoodSlug;
  soap: SoapEntry;
  favorite: boolean;
}

export interface Progress {
  completedDates: string[];
  favorites: string[];
  entries: Record<string, SoapEntry>;
  notes: Record<string, string>; // legacy; read-only in UI, never destroyed
  /** SOAP on verses the reader chose, keyed by the reflection's own id. */
  reflections: Record<string, VerseReflection>;
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

const empty = (): Progress => ({ completedDates: [], favorites: [], entries: {}, notes: {}, reflections: {} });

export function loadProgress(): Progress {
  const raw = readRaw(KEY);
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedDates: parsed.completedDates ?? [],
      favorites: parsed.favorites ?? [],
      entries: parsed.entries ?? {},
      notes: parsed.notes ?? {},
      // Absent in every store written before chosen verses existed, so this default is what keeps
      // an older device's journal loading rather than throwing on the first read.
      reflections: parsed.reflections ?? {},
    };
  } catch {
    return empty();
  }
}

function save(p: Progress): Progress {
  if (!writeRaw(KEY, JSON.stringify(p))) markStorageFailed();
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

/**
 * The id a reflection on this verse, on this day, carries.
 *
 * Derived rather than random so that reopening the same passage the same day picks up what you had
 * already written instead of starting a second, half-empty entry beside it — a reload mid-sentence
 * is the common case, wanting two separate takes on one verse in one day is not.
 */
export function reflectionIdFor(date: string, verseRef: string): string {
  return `${date}|${verseRef}`;
}

/** What a reflection knows about its verse, before anything has been written into it. */
export type ReflectionSeed = Pick<VerseReflection, "id" | "date" | "verseRef" | "verseText" | "mood">;

export function getReflection(p: Progress, id: string): VerseReflection | null {
  return p.reflections[id] ?? null;
}

/**
 * Auto-save one SOAP field of a chosen-verse reflection, writing the record on the first keystroke
 * and dropping it again when every field goes blank — the same rule the daily entries follow, so
 * a passage someone opened and thought better of never lingers in the journal.
 */
export function setReflectionField(seed: ReflectionSeed, field: keyof SoapEntry, text: string): Progress {
  const p = loadProgress();
  const existing = p.reflections[seed.id];
  const soap: SoapEntry = { ...(existing?.soap ?? EMPTY_ENTRY), [field]: text };
  const reflections = { ...p.reflections };
  if (isEmptyEntry(soap)) delete reflections[seed.id];
  else {
    reflections[seed.id] = {
      ...seed,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      soap,
      favorite: existing?.favorite ?? false,
    };
  }
  p.reflections = reflections;
  return save(p);
}

/** Keep (or let go of) a chosen-verse reflection. A no-op for an id that was never written to. */
export function toggleReflectionFavorite(id: string): Progress {
  const p = loadProgress();
  const existing = p.reflections[id];
  if (!existing) return p;
  p.reflections = { ...p.reflections, [id]: { ...existing, favorite: !existing.favorite } };
  return save(p);
}

/** Chosen-verse reflections, most recent first. */
export function reflectionList(p: Progress): VerseReflection[] {
  return Object.values(p.reflections).sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
  );
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
