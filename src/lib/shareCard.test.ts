import { describe, it, expect } from "vitest";
import { wrapText, shareFilename, buildCardSvg } from "@/lib/shareCard";

describe("wrapText", () => {
  it("wraps words into lines under the max length", () => {
    const lines = wrapText("be still and know that I am God", 12);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(12);
    expect(lines.join(" ")).toBe("be still and know that I am God");
  });

  it("keeps a single short phrase on one line", () => {
    expect(wrapText("Psalm 46:10", 40)).toEqual(["Psalm 46:10"]);
  });
});

describe("shareFilename", () => {
  it("slugifies a verse reference", () => {
    expect(shareFilename("Psalm 46:10")).toBe("koino-psalm-46-10.png");
    expect(shareFilename("1 Thessalonians 5:18")).toBe("koino-1-thessalonians-5-18.png");
  });
});

describe("buildCardSvg", () => {
  const base = {
    verseText: "Be still, and know that I am God.",
    verseRef: "Psalm 46:10",
    themeName: "Peace",
    accent: "#0F6E56",
    accentSoft: "#E1F5EE",
  };

  it("produces an SVG containing the verse, uppercased reference, theme, and accent", () => {
    const svg = buildCardSvg(base);
    expect(svg.startsWith("<svg")).toBe(true);
    // The verse wraps across tspans, so assert on a fragment rather than the whole line.
    expect(svg).toContain("that I am God.");
    expect(svg).toContain("PSALM 46:10");
    expect(svg).toContain("Peace");
    expect(svg).toContain("#0F6E56");
    expect(svg).toContain("Koino");
  });

  it("omits the note unless one is provided", () => {
    expect(buildCardSvg(base)).not.toContain("font-style=\"italic\"");
    expect(buildCardSvg({ ...base, note: "my quiet response" })).toContain("my quiet response");
  });

  it("escapes XML-sensitive characters in the verse", () => {
    const svg = buildCardSvg({ ...base, verseText: "grace & truth <come>" });
    expect(svg).toContain("grace &amp; truth &lt;come&gt;");
  });
});
