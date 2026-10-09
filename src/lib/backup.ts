import { loadProgress, replaceProgress, type Progress, type SoapEntry, type VerseReflection } from "@/lib/progress";
import { isMoodSlug } from "@/lib/themes";

export interface BackupFile {
  app: "koino";
  version: 1;
  exportedAt: string;
  progress: Progress;
}

/** The current progress serialized as a downloadable backup document. */
export function exportProgress(): string {
  const backup: BackupFile = {
    app: "koino",
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(date: Date = new Date()): string {
  return `koino-journal-${date.toISOString().slice(0, 10)}.json`;
}

const uniqueSorted = (a: string[], b: string[]): string[] => [...new Set([...a, ...b])].sort();

/** Union completed dates and favorites; incoming entries, notes and reflections win on a key conflict. */
export function mergeProgress(base: Progress, incoming: Progress): Progress {
  return {
    completedDates: uniqueSorted(base.completedDates, incoming.completedDates),
    favorites: uniqueSorted(base.favorites, incoming.favorites),
    entries: { ...base.entries, ...incoming.entries },
    notes: { ...base.notes, ...incoming.notes },
    // A reflection's id is its day and its verse, so a conflict here means the two devices really
    // are the same sitting; taking the incoming one matches how entries and notes merge.
    reflections: { ...base.reflections, ...incoming.reflections },
  };
}

function asStringArray(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];
}

function asRecord(x: unknown): Record<string, unknown> {
  return typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};
}

function asSoapEntry(x: unknown): SoapEntry {
  const e = asRecord(x);
  return {
    observation: typeof e.observation === "string" ? e.observation : "",
    application: typeof e.application === "string" ? e.application : "",
    prayer: typeof e.prayer === "string" ? e.prayer : "",
  };
}

/** Pull a sanitized Progress out of parsed JSON, accepting a wrapped backup or a bare progress. */
export function extractProgress(value: unknown): Progress | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  const p = asRecord("progress" in obj ? obj.progress : obj);

  const looksLikeProgress = ["completedDates", "favorites", "entries", "notes", "reflections"].some((k) => k in p);
  if (!looksLikeProgress) return null;

  const entries: Record<string, SoapEntry> = {};
  for (const [date, raw] of Object.entries(asRecord(p.entries))) {
    entries[date] = asSoapEntry(raw);
  }

  const notes: Record<string, string> = {};
  for (const [date, raw] of Object.entries(asRecord(p.notes))) {
    if (typeof raw === "string") notes[date] = raw;
  }

  // A reflection carries its own verse, so a malformed one cannot be repaired from anything else
  // in the file: anything missing its text or reference is dropped rather than imported as a card
  // with nothing on it.
  const reflections: Record<string, VerseReflection> = {};
  for (const [id, raw] of Object.entries(asRecord(p.reflections))) {
    const r = asRecord(raw);
    if (typeof r.verseRef !== "string" || typeof r.verseText !== "string") continue;
    reflections[id] = {
      id,
      date: typeof r.date === "string" ? r.date : "",
      createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
      verseRef: r.verseRef,
      verseText: r.verseText,
      mood: isMoodSlug(r.mood) ? r.mood : "open",
      soap: asSoapEntry(r.soap),
      favorite: r.favorite === true,
    };
  }

  return {
    completedDates: asStringArray(p.completedDates),
    favorites: asStringArray(p.favorites),
    entries,
    notes,
    reflections,
  };
}

/** Parse a backup file and merge it into stored progress. Throws a friendly error on bad input. */
export function importProgress(json: string): Progress {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const incoming = extractProgress(parsed);
  if (!incoming) throw new Error("That doesn't look like a Koino backup.");
  return replaceProgress(mergeProgress(loadProgress(), incoming));
}
