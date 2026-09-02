import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { verseLines, verseRuns, type BibleVerse } from "@/lib/bible/chapter";
import { BIBLE_BOOKS, BIBLE_SECTIONS, BIBLE_VERSIONS } from "@/lib/bible/books";

describe("verseRuns", () => {
  it("returns one plain run when there are no words of Jesus", () => {
    expect(verseRuns({ n: 1, t: "In the beginning." })).toEqual([
      { text: "In the beginning.", wj: false },
    ]);
    expect(verseRuns({ n: 1, t: "In the beginning.", w: [] })).toEqual([
      { text: "In the beginning.", wj: false },
    ]);
  });

  it("splits a verse that opens with narration and closes in red", () => {
    const verse: BibleVerse = { n: 1, t: "He said, follow me.", w: [[9, 19]] };
    expect(verseRuns(verse)).toEqual([
      { text: "He said, ", wj: false },
      { text: "follow me.", wj: true },
    ]);
  });

  it("handles red text at the very start and several spans", () => {
    const verse: BibleVerse = { n: 1, t: "abcdefghij", w: [[0, 3], [6, 9]] };
    expect(verseRuns(verse)).toEqual([
      { text: "abc", wj: true },
      { text: "def", wj: false },
      { text: "ghi", wj: true },
      { text: "j", wj: false },
    ]);
  });

  it("always reconstructs the original text exactly", () => {
    const verse: BibleVerse = { n: 1, t: "one two three four", w: [[4, 7], [8, 13]] };
    expect(verseRuns(verse).map((r) => r.text).join("")).toBe(verse.t);
  });

  it("ignores ranges that are out of bounds, empty or out of order", () => {
    const text = "abcdef";
    expect(verseRuns({ n: 1, t: text, w: [[2, 2]] })).toEqual([{ text, wj: false }]);
    expect(verseRuns({ n: 1, t: text, w: [[4, 99]] })).toEqual([{ text, wj: false }]);
    expect(verseRuns({ n: 1, t: text, w: [[3, 5], [1, 2]] })).toEqual([
      { text: "abc", wj: false },
      { text: "de", wj: true },
      { text: "f", wj: false },
    ]);
  });
});

describe("verseLines", () => {
  it("returns prose as a single level-0 line", () => {
    expect(verseLines({ n: 1, t: "In the beginning." })).toEqual([
      { level: 0, spaced: false, runs: [{ text: "In the beginning.", wj: false }] },
    ]);
  });

  it("splits poetry into indented lines", () => {
    const verse: BibleVerse = { n: 1, t: "first half second half", q: [[0, 1], [11, 2]] };
    expect(verseLines(verse)).toEqual([
      { level: 1, spaced: false, runs: [{ text: "first half ", wj: false }] },
      { level: 2, spaced: false, runs: [{ text: "second half", wj: false }] },
    ]);
  });

  it("carries the stanza break flag", () => {
    const verse: BibleVerse = { n: 1, t: "aaaa bbbb", q: [[0, 1], [5, 1, 1]] };
    expect(verseLines(verse).map((l) => l.spaced)).toEqual([false, true]);
  });

  it("resolves poetry and red letters together when they overlap", () => {
    // Jesus quoting a psalm: the red span runs across a line break.
    const verse: BibleVerse = { n: 1, t: "he said come to me", w: [[8, 18]], q: [[0, 1], [8, 2]] };
    expect(verseLines(verse)).toEqual([
      { level: 1, spaced: false, runs: [{ text: "he said ", wj: false }] },
      { level: 2, spaced: false, runs: [{ text: "come to me", wj: true }] },
    ]);
  });

  it("keeps text that precedes the first line mark", () => {
    const verse: BibleVerse = { n: 2, t: "tail start", q: [[5, 1]] };
    expect(verseLines(verse).map((l) => l.runs.map((r) => r.text).join(""))).toEqual([
      "tail ",
      "start",
    ]);
  });

  it("always reconstructs the verse text exactly", () => {
    const verse: BibleVerse = { n: 1, t: "alpha beta gamma delta", w: [[6, 10]], q: [[0, 1], [11, 2]] };
    const rebuilt = verseLines(verse)
      .flatMap((line) => line.runs.map((run) => run.text))
      .join("");
    expect(rebuilt).toBe(verse.t);
  });
});

describe("BIBLE_SECTIONS", () => {
  it("covers all 66 books exactly once, in canonical order", () => {
    const flattened = BIBLE_SECTIONS.flatMap((s) => s.books.map((b) => b.id));
    expect(flattened).toEqual(BIBLE_BOOKS.map((b) => b.id));
  });

  it("groups into the traditional divisions", () => {
    expect(BIBLE_SECTIONS.map((s) => s.name)).toEqual([
      "Law",
      "History",
      "Wisdom",
      "Major Prophets",
      "Minor Prophets",
      "Gospels",
      "Acts",
      "Paul's Letters",
      "General Letters",
      "Revelation",
    ]);
  });

  it("sizes the divisions correctly", () => {
    const size = (name: string) => BIBLE_SECTIONS.find((s) => s.name === name)?.books.length;
    expect(size("Law")).toBe(5);
    expect(size("Gospels")).toBe(4);
    expect(size("Acts")).toBe(1);
    expect(size("Paul's Letters")).toBe(13);
    expect(size("Minor Prophets")).toBe(12);
    expect(size("Revelation")).toBe(1);
  });

  it("keeps every section within one testament", () => {
    for (const section of BIBLE_SECTIONS) {
      expect(section.books.every((b) => b.testament === section.testament)).toBe(true);
    }
  });
});

/** Every generated chapter of every shipped translation, tagged with where it came from. */
const chapters = function* () {
  const root = join(process.cwd(), "public", "bible");
  for (const version of BIBLE_VERSIONS) {
    for (const book of readdirSync(join(root, version.id))) {
      for (const file of readdirSync(join(root, version.id, book))) {
        yield {
          where: `${version.id} ${book} ${file}`,
          version: version.id,
          ...(JSON.parse(readFileSync(join(root, version.id, book, file), "utf8")) as {
            book: string;
            verses: BibleVerse[];
          }),
        };
      }
    }
  }
};

const read = (versionId: string, book: string, chapter: number) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "public", "bible", versionId, book, `${chapter}.json`), "utf8"),
  ) as { headings?: { v: number; t: string }[]; verses: BibleVerse[] };

/**
 * The red-letter offsets are produced by scripts/build-bible.mjs by locating each run of Jesus'
 * words inside the normalised verse, so a drift between those two normalisations would mislocate
 * the colour rather than fail loudly. These sweep the generated data for that.
 */
describe("generated red-letter data", () => {
  it("keeps every span inside its verse and in ascending order", () => {
    let spans = 0;
    for (const chapter of chapters()) {
      for (const verse of chapter.verses) {
        if (!verse.w) continue;
        let previousEnd = 0;
        for (const [start, end] of verse.w) {
          expect(start).toBeGreaterThanOrEqual(previousEnd);
          expect(end).toBeGreaterThan(start);
          expect(end).toBeLessThanOrEqual(verse.t.length);
          previousEnd = end;
          spans += 1;
        }
      }
    }
    expect(spans).toBeGreaterThan(2000);
  });

  it("marks words of Jesus only in the New Testament", () => {
    const ot = new Set(BIBLE_BOOKS.filter((b) => b.testament === "ot").map((b) => b.id));
    for (const chapter of chapters()) {
      if (!ot.has(chapter.book)) continue;
      expect(chapter.verses.some((v) => v.w), `${chapter.where} has red letters`).toBe(false);
    }
  });

  it("never leaves an empty or whitespace-only span", () => {
    for (const chapter of chapters()) {
      for (const verse of chapter.verses) {
        for (const [start, end] of verse.w ?? []) {
          expect(verse.t.slice(start, end).trim().length, chapter.where).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("generated poetry and headings", () => {
  it("never loses a character when a verse is split into lines", () => {
    for (const chapter of chapters()) {
      for (const verse of chapter.verses) {
        const rebuilt = verseLines(verse)
          .flatMap((line) => line.runs.map((run) => run.text))
          .join("");
        expect(rebuilt, `${chapter.where} v${verse.n}`).toBe(verse.t);
      }
    }
  });

  it("gives the Psalms their superscriptions", () => {
    for (const version of BIBLE_VERSIONS) {
      const headings = read(version.id, "PSA", 3).headings ?? [];
      expect(headings.some((h) => h.v === 1 && h.t.includes("David")), version.id).toBe(true);
    }
  });

  it("keeps all twenty-two stanza headings of Psalm 119", () => {
    // Each stanza is eight verses long, so the Hebrew letters land every eighth verse. Asserted as
    // "a heading stands here" rather than by counting, because a version may also print a section
    // title over the psalm, which is not one of the twenty-two.
    const stanzaStarts = Array.from({ length: 22 }, (_, i) => i * 8 + 1);
    for (const version of BIBLE_VERSIONS) {
      const headings = read(version.id, "PSA", 119).headings ?? [];
      for (const start of stanzaStarts) {
        expect(headings.some((h) => h.v === start), `${version.id} Psalm 119:${start}`).toBe(true);
      }
      expect(headings.some((h) => h.v === 1 && h.t.startsWith("ALEPH")), version.id).toBe(true);
      expect(headings.some((h) => h.v === 169 && h.t.startsWith("TA")), version.id).toBe(true);
    }
  });

  it("sets the Psalms as poetry and narrative prose as prose, where a version marks its poetry", () => {
    expect(read("web", "PSA", 23).verses[0].q).toBeDefined();
    expect(read("bsb", "PSA", 23).verses[0].q).toBeDefined();
    for (const version of BIBLE_VERSIONS) {
      expect(read(version.id, "GEN", 1).verses[0].q, version.id).toBeUndefined();
      expect(read(version.id, "ROM", 1).verses[0].q, version.id).toBeUndefined();
    }
  });

  it("keeps every line mark in bounds and ascending", () => {
    for (const chapter of chapters()) {
      for (const verse of chapter.verses) {
        let previous = -1;
        for (const mark of verse.q ?? []) {
          expect(mark[0], chapter.where).toBeGreaterThan(previous);
          expect(mark[0], chapter.where).toBeLessThan(verse.t.length);
          expect([1, 2], chapter.where).toContain(mark[1]);
          previous = mark[0];
        }
      }
    }
  });
});
