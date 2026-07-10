import { describe, it, expect, beforeEach } from "vitest";
import { computeStreak, loadProgress, markComplete, toggleFavorite, isFavorite } from "@/lib/progress";

beforeEach(() => localStorage.clear());

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
});
