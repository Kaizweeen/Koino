import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadPassage, referenceQuery } from "@/lib/bible/passage";
import { clearChapterCache } from "@/lib/bible/chapter";
import { parseReference } from "@/lib/bible/refs";

const ref = (text: string) => {
  const parsed = parseReference(text);
  if (!parsed) throw new Error(`unparseable reference in test: ${text}`);
  return parsed;
};

const PSALM_46 = {
  book: "PSA",
  chapter: 46,
  verses: [
    { n: 9, t: "He makes wars cease to the end of the earth." },
    { n: 10, t: "Be still, and know that I am God." },
    { n: 11, t: "Yahweh of Armies is with us." },
  ],
};

beforeEach(() => {
  clearChapterCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => PSALM_46 })),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("loadPassage", () => {
  it("returns a single verse and its canonical reference", async () => {
    expect(await loadPassage(ref("Psalm 46:10"))).toEqual({
      ref: "Psalms 46:10",
      text: "Be still, and know that I am God.",
    });
  });

  it("joins a span into one paragraph", async () => {
    expect(await loadPassage(ref("Psalm 46:10-11"))).toEqual({
      ref: "Psalms 46:10-11",
      text: "Be still, and know that I am God. Yahweh of Armies is with us.",
    });
  });

  it("clamps a span that runs past the end of the chapter, and says what it found", async () => {
    expect(await loadPassage(ref("Psalm 46:10-40"))).toEqual({
      ref: "Psalms 46:10-11",
      text: "Be still, and know that I am God. Yahweh of Armies is with us.",
    });
  });

  it("throws when the span lands on no verse at all", async () => {
    await expect(loadPassage(ref("Psalm 46:40"))).rejects.toThrow(/no such verse/);
  });
});

describe("referenceQuery", () => {
  it("writes a single verse and a span the reader's query string understands", () => {
    expect(referenceQuery(ref("Psalm 46:10"))).toBe("b=PSA&c=46&v=10");
    expect(referenceQuery(ref("Romans 8:38-39"))).toBe("b=ROM&c=8&v=38-39");
  });
});
