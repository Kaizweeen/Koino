import { BIBLE_BOOKS, type BibleBook } from "@/lib/bible/books";

export interface BibleRef {
  book: BibleBook;
  chapter: number;
  /** First verse of the reference. */
  verse: number;
  /** Last verse of a range, equal to `verse` for a single-verse reference. */
  endVerse: number;
}

const normalise = (name: string) =>
  name
    .toLowerCase()
    .replace(/[.]/g, "")
    // "1st John", "I John" and "1 John" should all land on the same book.
    .replace(/^(1|2|3)(?:st|nd|rd)?\s+/, "$1 ")
    .replace(/^i{1,3}\s+/, (m) => `${m.trim().length} `)
    .replace(/\s+/g, " ")
    .trim();

/**
 * Alternate spellings that appear in devotion references and in ordinary use but are not the
 * book's display name. "Psalm" is the one that matters most: every Psalms reference in
 * src/lib/devotions/content.ts is written in the singular.
 */
const ALIASES: Record<string, string> = {
  psalm: "PSA",
  psalms: "PSA",
  song: "SNG",
  "song of songs": "SNG",
  "song of solomon": "SNG",
  canticles: "SNG",
  ecclesiastes: "ECC",
  revelations: "REV",
  revelation: "REV",
  "revelation of john": "REV",
  acts: "ACT",
  "acts of the apostles": "ACT",
  philemon: "PHM",
  philippians: "PHP",
};

const BY_NAME = new Map<string, BibleBook>();
for (const book of BIBLE_BOOKS) {
  BY_NAME.set(normalise(book.name), book);
  BY_NAME.set(book.id.toLowerCase(), book);
}
for (const [alias, id] of Object.entries(ALIASES)) {
  const book = BIBLE_BOOKS.find((b) => b.id === id);
  if (book) BY_NAME.set(normalise(alias), book);
}

export function findBook(name: string): BibleBook | null {
  return BY_NAME.get(normalise(name)) ?? null;
}

export function getBook(id: string): BibleBook | null {
  return BIBLE_BOOKS.find((b) => b.id === id) ?? null;
}

/**
 * Parses a human-written reference such as "Psalm 46:10", "1 Thessalonians 5:18" or
 * "Lamentations 3:22-23" into the book, chapter and verse span it points at.
 *
 * Returns null rather than throwing for anything it cannot resolve, because the callers — the
 * devotion's "read the chapter" affordance and the reader's deep links — should quietly do
 * nothing on a reference they don't understand rather than break the screen around them.
 */
export function parseReference(reference: string): BibleRef | null {
  const match = /^\s*(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/.exec(reference);
  if (!match) return null;

  const [, name, chapterText, verseText, endVerseText] = match;
  const book = findBook(name);
  if (!book) return null;

  const chapter = Number.parseInt(chapterText, 10);

  // A single-chapter book is often cited as "Jude 24" — a verse, not a chapter. This has to be
  // decided before the chapter is range-checked, or the verse number fails that check.
  if (book.chapters === 1 && verseText === undefined) {
    if (chapter < 1) return null;
    return { book, chapter: 1, verse: chapter, endVerse: chapter };
  }

  if (chapter < 1 || chapter > book.chapters) return null;

  const verse = verseText === undefined ? 1 : Number.parseInt(verseText, 10);
  const endVerse = endVerseText === undefined ? verse : Number.parseInt(endVerseText, 10);
  if (verse < 1 || endVerse < verse) return null;

  return { book, chapter, verse, endVerse };
}

/**
 * The reference a `?b=PSA&c=46&v=10-11` query points at, or null when it points nowhere.
 *
 * The reader keeps its position in the query string and hands the same shape to the SOAP flow, so
 * both resolve it through `parseReference` rather than each rolling its own number parsing. A
 * query with no `v` resolves to the chapter's first verse.
 */
export function referenceFromQuery(
  bookId: string | null,
  chapter: string | null,
  verses: string | null,
): BibleRef | null {
  const book = getBook(bookId ?? "");
  if (!book || !chapter) return null;
  return parseReference(`${book.name} ${chapter}${verses ? `:${verses}` : ""}`);
}

/** The canonical display form of a reference, e.g. "Psalms 46:10". */
export function formatReference(ref: BibleRef): string {
  const span = ref.endVerse > ref.verse ? `${ref.verse}-${ref.endVerse}` : `${ref.verse}`;
  return `${ref.book.name} ${ref.chapter}:${span}`;
}

/** Path of the chapter's JSON payload under public/. */
export function chapterPath(bookId: string, chapter: number): string {
  return `/bible/${bookId}/${chapter}.json`;
}
