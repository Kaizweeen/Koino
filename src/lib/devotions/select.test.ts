import { describe, it, expect } from "vitest";
import { getDevotionForDate, getTodayDevotion, getPlaylistId } from "@/lib/devotions/select";
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

  it("rotates playlists deterministically by date", () => {
    const theme = { playlistIds: ["x", "y"] } as any;
    expect(getPlaylistId(theme, "2026-06-24")).toBe(getPlaylistId(theme, "2026-06-24"));
    expect(getPlaylistId({ playlistIds: ["only"] } as any, "2026-06-24")).toBe("only");
  });
});
