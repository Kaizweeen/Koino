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
  /**
   * Where each poetic line begins: [offset, indentLevel] and a third element of 1 when a stanza
   * break stands before it. Absent on prose, which is most of the Bible outside the Psalms,
   * Proverbs, Job and the prophets.
   */
  q?: (number[])[];
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

/** A heading standing outside the numbered verses, before the verse it introduces. */
export interface BibleHeading {
  /** The verse this heading stands before. */
  v: number;
  t: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  /** Psalm superscriptions and the Hebrew-letter stanza headings of Psalm 119. */
  headings?: BibleHeading[];
  verses: BibleVerse[];
}

/** One poetic line of a verse: its indent level, whether a stanza break precedes it, and its runs. */
export interface VerseLine {
  /** 1 or 2 for poetry; 0 for prose. */
  level: number;
  /** A blank line stands before this one. */
  spaced: boolean;
  runs: { text: string; wj: boolean }[];
}

/**
 * Splits a verse into its poetic lines, each already broken into plain and red-letter runs.
 *
 * Poetry and the words of Jesus are both stored as offsets into the same string and freely
 * overlap — Jesus quotes the Psalms in verse — so they have to be resolved together rather than
 * one after the other. Prose comes back as a single line at level 0.
 */
export function verseLines(verse: BibleVerse): VerseLine[] {
  const marks = verse.q && verse.q.length > 0 ? verse.q : null;
  const bounds = marks
    ? marks.map((mark, i) => ({
        start: mark[0],
        end: i + 1 < marks.length ? marks[i + 1][0] : verse.t.length,
        level: mark[1],
        spaced: mark[2] === 1,
      }))
    : [{ start: 0, end: verse.t.length, level: 0, spaced: false }];

  // A verse can begin mid-line when its first mark starts past 0; that leading text is still part
  // of the preceding line, so it opens the verse rather than being dropped.
  if (bounds.length > 0 && bounds[0].start > 0) {
    bounds.unshift({ start: 0, end: bounds[0].start, level: bounds[0].level, spaced: false });
  }

  return bounds
    .filter((bound) => bound.end > bound.start)
    .map((bound) => ({
      level: bound.level,
      spaced: bound.spaced,
      runs: runsWithin(verse, bound.start, bound.end),
    }))
    .filter((line) => line.runs.some((run) => run.text.trim().length > 0));
}

/** The plain/red-letter runs of one slice of a verse. */
function runsWithin(verse: BibleVerse, start: number, end: number): { text: string; wj: boolean }[] {
  const runs: { text: string; wj: boolean }[] = [];
  let cursor = start;
  for (const [from, to] of verse.w ?? []) {
    const overlapStart = Math.max(from, start);
    const overlapEnd = Math.min(to, end);
    if (overlapEnd <= overlapStart || overlapStart < cursor) continue;
    if (overlapStart > cursor) runs.push({ text: verse.t.slice(cursor, overlapStart), wj: false });
    runs.push({ text: verse.t.slice(overlapStart, overlapEnd), wj: true });
    cursor = overlapEnd;
  }
  if (cursor < end) runs.push({ text: verse.t.slice(cursor, end), wj: false });
  return runs;
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
