import { describe, it, expect, beforeEach } from "vitest";
import { computeStreak, longestStreak, loadProgress, markComplete, toggleFavorite, isFavorite, setNote, getNote, notedDates } from "@/lib/progress";

beforeEach(() => localStorage.clear());

describe("longestStreak", () => {
  it("is zero for no history", () => {
    expect(longestStreak([])).toBe(0);
  });
  it("finds the longest consecutive run regardless of order or gaps", () => {
    expect(longestStreak(["2026-07-01", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-09"])).toBe(3);
  });
  it("counts a single isolated day as 1", () => {
    expect(longestStreak(["2026-07-01"])).toBe(1);
  });
});

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-06-23", "2026-06-24", "2026-06-25"], "2026-06-25")).toBe(3);
  });
  it("still counts if today isn't done yet but yesterday was", () => {
    expect(computeStreak(["2026-06-23", "2026-06-24"], "2026-06-25")).toBe(2);
  });
  it("breaks when there's a gap", () => {
    expect(computeStreak(["2026-06-20", "2026-06-24", "2026-06-25"], "2026-06-25")).toBe(2);
  });
  it("is zero when the most recent completion is too old", () => {
    expect(computeStreak(["2026-06-20"], "2026-06-25")).toBe(0);
  });
});

describe("progress store", () => {
  it("marks a date complete and persists it", () => {
    markComplete("2026-06-25");
    expect(loadProgress().completedDates).toContain("2026-06-25");
  });
  it("toggles favorites", () => {
    let p = toggleFavorite("2026-06-25");
    expect(isFavorite(p, "2026-06-25")).toBe(true);
    p = toggleFavorite("2026-06-25");
    expect(isFavorite(p, "2026-06-25")).toBe(false);
  });
  it("saves, reads, and clears notes", () => {
    let p = setNote("2026-06-25", "be still");
    expect(getNote(p, "2026-06-25")).toBe("be still");
    expect(notedDates(p)).toEqual(["2026-06-25"]);
    p = setNote("2026-06-25", "   ");
    expect(getNote(p, "2026-06-25")).toBe("");
    expect(notedDates(p)).toEqual([]);
  });
  it("lists noted dates most recent first", () => {
    setNote("2026-06-25", "a");
    const p = setNote("2026-06-27", "b");
    expect(notedDates(p)).toEqual(["2026-06-27", "2026-06-25"]);
  });
});
