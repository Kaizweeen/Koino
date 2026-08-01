import { describe, it, expect } from "vitest";
import { getDevotionForDate, getTodayDevotion, getDevotionShownOn, getPlaylistId, getSavedDevotions } from "@/lib/devotions/select";
import type { Devotion } from "@/lib/devotions/types";

const sample: Devotion[] = [
  { date: "2026-06-23", verseRef: "A 1:1", verseText: "a", theme: "peace", reflection: "r", prayer: "p" },
  { date: "2026-06-25", verseRef: "B 1:1", verseText: "b", theme: "joy",   reflection: "r", prayer: "p" },
];

describe("devotion selection", () => {
  it("returns an exact date match", () => {
    expect(getDevotionForDate(sample, "2026-06-25")?.verseRef).toBe("B 1:1");
  });

  it("returns null when no date matches", () => {
    expect(getDevotionForDate(sample, "2030-01-01")).toBeNull();
  });

  it("today falls back to the most recent past entry", () => {
    expect(getTodayDevotion(sample, "2026-06-24").date).toBe("2026-06-23");
  });

  it("today falls back to the first entry when all are in the future", () => {
    expect(getTodayDevotion(sample, "2026-01-01").date).toBe("2026-06-23");
  });

  it("throws when there are no devotions", () => {
    expect(() => getTodayDevotion([], "2026-06-25")).toThrow("no devotions available");
  });

  it("resolves an exact date, and a gap or pre-range date to the most recent prior (or first)", () => {
    expect(getDevotionShownOn(sample, "2026-06-25").date).toBe("2026-06-25");
    expect(getDevotionShownOn(sample, "2026-06-24").date).toBe("2026-06-23");
    expect(getDevotionShownOn(sample, "2026-01-01").date).toBe("2026-06-23");
  });

  it("rotates deterministically past the last dated devotion so it never runs out", () => {
    // sample's last date is 2026-06-25; later dates rotate through the pool by day-index.
    const a = getDevotionShownOn(sample, "2026-06-26");
    const b = getDevotionShownOn(sample, "2026-06-27");
    expect(sample).toContain(a);
    expect(a).not.toBe(b); // consecutive days rotate rather than repeating
    expect(getDevotionShownOn(sample, "2026-06-26")).toBe(a); // deterministic per date
  });

  it("rotates playlists deterministically by date", () => {
    const theme = { playlistIds: ["x", "y"] } as any;
    expect(getPlaylistId(theme, "2026-06-24")).toBe(getPlaylistId(theme, "2026-06-24"));
    expect(getPlaylistId({ playlistIds: ["only"] } as any, "2026-06-24")).toBe("only");
  });

  it("throws when a theme has no playlists", () => {
    expect(() => getPlaylistId({ playlistIds: [] } as any, "2026-06-24")).toThrow("no playlists for theme");
  });

  it("maps saved dates to devotions, most recent first, skipping unknowns", () => {
    const saved = getSavedDevotions(sample, ["2026-06-23", "2030-01-01", "2026-06-25"]);
    expect(saved.map((d) => d.date)).toEqual(["2026-06-25", "2026-06-23"]);
  });
});
