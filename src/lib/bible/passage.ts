import { loadChapter } from "@/lib/bible/chapter";
import { formatReference, type BibleRef } from "@/lib/bible/refs";

/** A verse span lifted out of a chapter, ready to be read as a devotion's verse. */
export interface Passage {
  /** The canonical reference for what was actually found, e.g. "Psalms 46:10". */
  ref: string;
  /** The verses of the span, joined into one flowing paragraph. */
  text: string;
}

/**
 * Loads the text of a verse span from the bundled World English Bible.
 *
 * The span is clamped to the verses the chapter really has rather than trusted: a reference can be
 * typed by hand or arrive in a link, and "Psalm 23:1-40" should quietly give back the six verses
 * that exist instead of failing. The returned `ref` describes what was found, so the verse a
 * person ends up sitting with is always the one named above it.
 *
 * Throws when the span lands nowhere at all, which callers show as "we couldn't find that verse".
 */
export async function loadPassage(reference: BibleRef): Promise<Passage> {
  const chapter = await loadChapter(reference.book.id, reference.chapter);
  const verses = chapter.verses.filter((v) => v.n >= reference.verse && v.n <= reference.endVerse);
  if (verses.length === 0) throw new Error(`${formatReference(reference)}: no such verse`);

  return {
    ref: formatReference({
      ...reference,
      verse: verses[0].n,
      endVerse: verses[verses.length - 1].n,
    }),
    // Poetry is stored as offsets into the same string the prose uses, so joining the plain text is
    // enough here: the verse is being quoted, not set as verse.
    text: verses.map((v) => v.t.trim()).filter(Boolean).join(" "),
  };
}

/** The query string that points the reader (or the SOAP flow) at a reference. */
export function referenceQuery(reference: BibleRef): string {
  const span = reference.endVerse > reference.verse ? `${reference.verse}-${reference.endVerse}` : `${reference.verse}`;
  return `b=${reference.book.id}&c=${reference.chapter}&v=${span}`;
}
