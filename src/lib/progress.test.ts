import { describe, it, expect, beforeEach } from "vitest";
import { computeStreak, longestStreak, loadProgress, markComplete, toggleFavorite, isFavorite, setNote, getNote, notedDates, setSoapField, getEntry, hasWrittenEntry, entryDates, soapText } from "@/lib/progress";

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

describe("SOAP entries", () => {
  it("defaults to an empty entry map and empty entry", () => {
    expect(loadProgress().entries).toEqual({});
    expect(getEntry(loadProgress(), "2026-06-25")).toEqual({ observation: "", application: "", prayer: "" });
  });

  it("saves one field at a time and round-trips", () => {
    setSoapField("2026-06-25", "observation", "God is near");
    setSoapField("2026-06-25", "prayer", "quiet me");
    const e = getEntry(loadProgress(), "2026-06-25");
    expect(e.observation).toBe("God is near");
    expect(e.prayer).toBe("quiet me");
    expect(e.application).toBe("");
  });

  it("removes the entry when all fields are cleared", () => {
    setSoapField("2026-06-25", "observation", "x");
    setSoapField("2026-06-25", "observation", "");
    expect(hasWrittenEntry(loadProgress(), "2026-06-25")).toBe(false);
    expect(loadProgress().entries["2026-06-25"]).toBeUndefined();
  });

  it("tolerates a legacy store with notes and no entries, and lists legacy noted dates", () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: [], favorites: [], notes: { "2026-06-20": "old note" } }));
    const p = loadProgress();
    expect(p.entries).toEqual({});
    expect(entryDates(p)).toContain("2026-06-20");
  });

  it("lists entry dates most-recent first", () => {
    setSoapField("2026-06-20", "observation", "a");
    setSoapField("2026-06-25", "observation", "b");
    expect(entryDates(loadProgress())).toEqual(["2026-06-25", "2026-06-20"]);
  });

  it("composes non-empty parts into shareable text", () => {
    expect(soapText({ observation: "O", application: "", prayer: "P" })).toBe("O\n\nP");
    expect(soapText({ observation: "", application: "", prayer: "" })).toBe("");
  });
});
