import { chapterPath } from "@/lib/bible/refs";

/** A [start, end) slice of a verse's text. */
export type VerseRange = [number, number];

export interface BibleVerse {
  /** Verse number. */
  n: number;
  /** Verse text. */
  t: string;
  /**
   * Spans of `t` that are the words of Jesus, for red-letter setting. Absent on the great
   * majority of verses, which have none.
   */
  w?: VerseRange[];
}

/**
 * Splits a verse into alternating plain and red-letter runs, in order and with no gaps, so the
 * whole verse can be rendered by mapping over the result.
 */
export function verseRuns(verse: BibleVerse): { text: string; wj: boolean }[] {
  if (!verse.w || verse.w.length === 0) return [{ text: verse.t, wj: false }];

  const runs: { text: string; wj: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of verse.w) {
    // Defensive: ignore a range that a bad payload put out of order or out of bounds.
    if (start < cursor || end > verse.t.length || end <= start) continue;
    if (start > cursor) runs.push({ text: verse.t.slice(cursor, start), wj: false });
    runs.push({ text: verse.t.slice(start, end), wj: true });
    cursor = end;
  }
  if (cursor < verse.t.length) runs.push({ text: verse.t.slice(cursor), wj: false });
  return runs;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

/**
 * Chapters already fetched in this session.
 *
 * The text never changes between deploys, so a chapter is worth holding onto: flipping back and
 * forth between two chapters, or reopening the one a devotion points at, should not re-request
 * anything. The service worker caches the same responses across sessions (see public/sw.js).
 */
const cache = new Map<string, BibleChapter>();

const isChapter = (value: unknown): value is BibleChapter => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<BibleChapter>;
  return (
    typeof candidate.book === "string" &&
    typeof candidate.chapter === "number" &&
    Array.isArray(candidate.verses) &&
    candidate.verses.every((v) => typeof v?.n === "number" && typeof v?.t === "string")
  );
};

/**
 * Loads one chapter of the bundled World English Bible.
 *
 * Throws on a failed or malformed response so callers can show a retry rather than an empty
 * chapter that reads as though the text were missing.
 */
export async function loadChapter(bookId: string, chapter: number): Promise<BibleChapter> {
  const key = `${bookId}.${chapter}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const response = await fetch(chapterPath(bookId, chapter));
  if (!response.ok) throw new Error(`chapter ${key}: HTTP ${response.status}`);

  const data: unknown = await response.json();
  if (!isChapter(data)) throw new Error(`chapter ${key}: unexpected payload`);

  cache.set(key, data);
  return data;
}

/** Test seam — drops anything held in memory. */
export function clearChapterCache(): void {
  cache.clear();
}
