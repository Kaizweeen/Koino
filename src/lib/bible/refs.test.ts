import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BIBLE_BOOKS, BIBLE_VERSIONS, DEFAULT_VERSION_ID } from "@/lib/bible/books";
import { chapterPath, findBook, formatReference, parseReference } from "@/lib/bible/refs";
import { DEFAULT_VERSION, getVersion, isVersionId } from "@/lib/bible/versions";
import { DEVOTIONS } from "@/lib/devotions/content";

describe("BIBLE_BOOKS", () => {
  it("holds the 66 canonical books in order", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(BIBLE_BOOKS[0]).toMatchObject({ id: "GEN", name: "Genesis", testament: "ot" });
    expect(BIBLE_BOOKS[38]).toMatchObject({ id: "MAL", testament: "ot" });
    expect(BIBLE_BOOKS[39]).toMatchObject({ id: "MAT", testament: "nt" });
    expect(BIBLE_BOOKS[65]).toMatchObject({ id: "REV", name: "Revelation", testament: "nt" });
    expect(BIBLE_BOOKS.filter((b) => b.testament === "ot")).toHaveLength(39);
    expect(BIBLE_BOOKS.filter((b) => b.testament === "nt")).toHaveLength(27);
  });

  it("knows the chapter counts", () => {
    const chapters = (id: string) => BIBLE_BOOKS.find((b) => b.id === id)?.chapters;
    expect(chapters("PSA")).toBe(150);
    expect(chapters("GEN")).toBe(50);
    expect(chapters("REV")).toBe(22);
    expect(chapters("OBA")).toBe(1);
    expect(chapters("JUD")).toBe(1);
  });
});

describe("findBook", () => {
  it("resolves display names, ids and casing", () => {
    expect(findBook("Genesis")?.id).toBe("GEN");
    expect(findBook("genesis")?.id).toBe("GEN");
    expect(findBook("PSA")?.id).toBe("PSA");
  });

  it("resolves the singular Psalm the devotions are written with", () => {
    expect(findBook("Psalm")?.id).toBe("PSA");
    expect(findBook("Psalms")?.id).toBe("PSA");
  });

  it("resolves numbered books however they are written", () => {
    expect(findBook("1 John")?.id).toBe("1JN");
    expect(findBook("1st John")?.id).toBe("1JN");
    expect(findBook("I John")?.id).toBe("1JN");
    expect(findBook("III John")?.id).toBe("3JN");
  });

  it("returns null for something that is not a book", () => {
    expect(findBook("Hesitations")).toBeNull();
    expect(findBook("")).toBeNull();
  });
});

describe("parseReference", () => {
  it("parses a single verse", () => {
    expect(parseReference("Psalm 46:10")).toMatchObject({ chapter: 46, verse: 10, endVerse: 10 });
    expect(parseReference("Psalm 46:10")?.book.id).toBe("PSA");
  });

  it("parses a numbered book", () => {
    const ref = parseReference("1 Thessalonians 5:18");
    expect(ref?.book.id).toBe("1TH");
    expect(ref).toMatchObject({ chapter: 5, verse: 18 });
  });

  it("parses a verse range, including an en dash", () => {
    expect(parseReference("Lamentations 3:22-23")).toMatchObject({ verse: 22, endVerse: 23 });
    expect(parseReference("Numbers 6:24–26")).toMatchObject({ verse: 24, endVerse: 26 });
  });

  it("treats a bare number in a one-chapter book as a verse", () => {
    expect(parseReference("Jude 24")).toMatchObject({ chapter: 1, verse: 24 });
  });

  it("treats a bare number elsewhere as a whole chapter", () => {
    expect(parseReference("Psalm 23")).toMatchObject({ chapter: 23, verse: 1, endVerse: 1 });
  });

  it("returns null rather than throwing on nonsense", () => {
    expect(parseReference("")).toBeNull();
    expect(parseReference("not a reference")).toBeNull();
    expect(parseReference("Psalm 151:1")).toBeNull();
    expect(parseReference("Genesis 1:5-2")).toBeNull();
  });
});

describe("formatReference", () => {
  it("renders single verses and ranges", () => {
    expect(formatReference(parseReference("Psalm 46:10")!)).toBe("Psalms 46:10");
    expect(formatReference(parseReference("Numbers 6:24-26")!)).toBe("Numbers 6:24-26");
  });
});

describe("BIBLE_VERSIONS", () => {
  it("ships several public-domain translations, the default among them", () => {
    expect(BIBLE_VERSIONS.length).toBeGreaterThan(1);
    expect(BIBLE_VERSIONS.map((v) => v.id)).toContain(DEFAULT_VERSION_ID);
    expect(DEFAULT_VERSION.id).toBe(DEFAULT_VERSION_ID);
  });

  it("gives every version a unique id and something to show in the picker", () => {
    expect(new Set(BIBLE_VERSIONS.map((v) => v.id)).size).toBe(BIBLE_VERSIONS.length);
    expect(new Set(BIBLE_VERSIONS.map((v) => v.short)).size).toBe(BIBLE_VERSIONS.length);
    for (const version of BIBLE_VERSIONS) {
      expect(version.name.length, version.id).toBeGreaterThan(0);
      expect(version.blurb.length, version.id).toBeGreaterThan(0);
      expect(version.notice, version.id).toContain("public domain");
    }
  });

  it("falls back to the default rather than leaving a reader without a Bible", () => {
    expect(getVersion("kjv").id).toBe("kjv");
    expect(getVersion("a-version-we-dropped")).toBe(DEFAULT_VERSION);
    expect(getVersion(null)).toBe(DEFAULT_VERSION);
    expect(isVersionId("kjv")).toBe(true);
    expect(isVersionId("a-version-we-dropped")).toBe(false);
    expect(isVersionId(7)).toBe(false);
  });
});

describe("chapterPath", () => {
  it("addresses a chapter within one translation", () => {
    expect(chapterPath("kjv", "PSA", 46)).toBe("/bible/kjv/PSA/46.json");
  });
});

/**
 * The shipped text is generated by scripts/build-bible.mjs from the upstream source files, so it is
 * only as trustworthy as that parser. The devotions carry 37 verses that were already checked
 * against the WEB by `npm run verify:verses`, which makes them a ready-made fixture: if the
 * generated chapters contain each of those verses, the parser reproduced the translation faithfully.
 */
describe("generated chapter data", () => {
  const readChapter = (versionId: string, bookId: string, chapter: number) =>
    JSON.parse(
      readFileSync(join(process.cwd(), "public", chapterPath(versionId, bookId, chapter)), "utf8"),
    ) as {
      book: string;
      chapter: number;
      verses: { n: number; t: string }[];
    };

  const normalise = (s: string) =>
    s
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^a-z' ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  it("resolves every devotion reference", () => {
    for (const devotion of DEVOTIONS) {
      expect(parseReference(devotion.verseRef), devotion.verseRef).not.toBeNull();
    }
  });

  it("reproduces the WEB text each devotion quotes", () => {
    for (const devotion of DEVOTIONS) {
      const ref = parseReference(devotion.verseRef)!;
      const { verses } = readChapter("web", ref.book.id, ref.chapter);
      const span = verses
        .filter((v) => v.n >= ref.verse && v.n <= ref.endVerse)
        .map((v) => v.t)
        .join(" ");
      expect(span, `${devotion.verseRef} missing from generated data`).not.toBe("");
      expect(normalise(span), devotion.verseRef).toContain(normalise(devotion.verseText));
    }
  });

  it("has a contiguous, non-empty chapter for every book of every version", () => {
    for (const version of BIBLE_VERSIONS) {
      for (const book of BIBLE_BOOKS) {
        for (const chapter of [1, book.chapters]) {
          const data = readChapter(version.id, book.id, chapter);
          expect(data.book).toBe(book.id);
          expect(data.chapter).toBe(chapter);
          expect(data.verses.length).toBeGreaterThan(0);
          expect(data.verses[0].n).toBe(1);
          expect(data.verses.every((v) => v.t.trim().length > 0)).toBe(true);
        }
      }
    }
  });

  /**
   * The book list, the chapter grid and every deep link are shared across translations, so a
   * version that divided a book differently would offer chapters a reader could not open. The
   * build asserts this too; this is the check that survives into CI, where the build does not run.
   */
  it("gives every version the same chapters, so a link means the same thing in all of them", () => {
    for (const version of BIBLE_VERSIONS) {
      for (const book of BIBLE_BOOKS) {
        expect(() => readChapter(version.id, book.id, book.chapters), `${version.id} ${book.id}`).not.toThrow();
        expect(() => readChapter(version.id, book.id, book.chapters + 1)).toThrow();
      }
    }
  });

  it("resolves the same reference in every version", () => {
    for (const version of BIBLE_VERSIONS) {
      const { verses } = readChapter(version.id, "PSA", 23);
      expect(verses[0].t.toLowerCase(), version.id).toContain("shepherd");
    }
  });
});
