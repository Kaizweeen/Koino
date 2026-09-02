import { loadChapter, type BibleVerse } from "@/lib/bible/chapter";
import { formatReference, type BibleRef } from "@/lib/bible/refs";

/** A passage lifted out of a chapter, ready to be sat with. */
export interface Passage {
  /** The canonical reference for what was actually found, e.g. "Psalms 46:10" or "Psalms 46". */
  ref: string;
  /**
   * The passage in words: the whole span for a verse or two, and the opening for a chapter.
   *
   * A chapter is read on screen from the bundled text rather than from here — this is what stands
   * in for it afterwards, on a journal card and a share card, where the whole of Psalm 119 would
   * be neither readable nor worth the space in a person's storage.
   */
  text: string;
}

/**
 * How much of a chapter stands in for it: long enough to recognise which chapter you sat with,
 * short enough to set on a share card without crowding out everything else.
 */
const OPENING_CHARS = 140;

/**
 * Loads a passage from the bundled World English Bible.
 *
 * A verse span is clamped to the verses the chapter really has rather than trusted: a reference
 * can be typed by hand or arrive in a link, and "Psalm 23:1-40" should quietly give back the six
 * verses that exist instead of failing. The returned `ref` describes what was found, so the
 * passage a person ends up sitting with is always the one named above it.
 *
 * Throws when the reference lands nowhere at all, which callers show as "we couldn't find that".
 */
export async function loadPassage(reference: BibleRef): Promise<Passage> {
  const chapter = await loadChapter(reference.book.id, reference.chapter);

  if (reference.wholeChapter) {
    if (chapter.verses.length === 0) throw new Error(`${formatReference(reference)}: no such chapter`);
    return { ref: formatReference(reference), text: opening(chapter.verses) };
  }

  const verses = chapter.verses.filter((v) => v.n >= reference.verse && v.n <= reference.endVerse);
  if (verses.length === 0) throw new Error(`${formatReference(reference)}: no such verse`);

  return {
    ref: formatReference({
      ...reference,
      verse: verses[0].n,
      endVerse: verses[verses.length - 1].n,
    }),
    // Poetry is stored as offsets into the same string the prose uses, so joining the plain text is
    // enough here: the passage is being quoted, not set as verse.
    text: joined(verses),
  };
}

const joined = (verses: BibleVerse[]): string =>
  verses.map((v) => v.t.trim()).filter(Boolean).join(" ");

/** The first words of a chapter, cut at a word so an excerpt never ends mid-word. */
function opening(verses: BibleVerse[]): string {
  const full = joined(verses);
  if (full.length <= OPENING_CHARS) return full;
  const cut = full.slice(0, OPENING_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`;
}

/**
 * The query string that points the reader (or the SOAP flow) at a reference.
 *
 * A whole chapter is written as the absence of `v` rather than as a span covering it: the chapter
 * has no fixed length to write down here, and "the whole thing" is what was actually asked for.
 */
export function referenceQuery(reference: BibleRef): string {
  const where = `b=${reference.book.id}&c=${reference.chapter}`;
  if (reference.wholeChapter) return where;
  const span = reference.endVerse > reference.verse ? `${reference.verse}-${reference.endVerse}` : `${reference.verse}`;
  return `${where}&v=${span}`;
}
