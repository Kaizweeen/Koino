import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { verseRuns, type BibleVerse } from "@/lib/bible/chapter";
import { BIBLE_BOOKS, BIBLE_SECTIONS } from "@/lib/bible/books";

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

/**
 * The red-letter offsets are produced by scripts/build-bible.mjs by locating each <wj> run inside
 * the normalised verse, so a drift between those two normalisations would mislocate the colour
 * rather than fail loudly. These sweep the generated data for that.
 */
describe("generated red-letter data", () => {
  const chapters = function* () {
    for (const dir of readdirSync(join(process.cwd(), "public", "bible"))) {
      for (const file of readdirSync(join(process.cwd(), "public", "bible", dir))) {
        yield JSON.parse(
          readFileSync(join(process.cwd(), "public", "bible", dir, file), "utf8"),
        ) as { book: string; verses: BibleVerse[] };
      }
    }
  };

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
      expect(chapter.verses.some((v) => v.w), `${chapter.book} has red letters`).toBe(false);
    }
  });

  it("never leaves an empty or whitespace-only span", () => {
    for (const chapter of chapters()) {
      for (const verse of chapter.verses) {
        for (const [start, end] of verse.w ?? []) {
          expect(verse.t.slice(start, end).trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
