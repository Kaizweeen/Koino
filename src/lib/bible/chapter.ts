import { chapterPath } from "@/lib/bible/refs";

export interface BibleVerse {
  /** Verse number. */
  n: number;
  /** Verse text. */
  t: string;
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
