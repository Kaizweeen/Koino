import { describe, it, expect, beforeEach, vi } from "vitest";
import { computeStreak, longestStreak, loadProgress, markComplete, toggleFavorite, isFavorite, setNote, getNote, notedDates, setSoapField, getEntry, hasWrittenEntry, entryDates, soapText, reflectionIdFor, setReflectionField, getReflection, toggleReflectionFavorite, reflectionList } from "@/lib/progress";

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

describe("chosen-verse reflections", () => {
  const seed = {
    id: reflectionIdFor("2026-08-30", "Psalms 46:10"),
    date: "2026-08-30",
    verseRef: "Psalms 46:10",
    verseText: "Be still, and know that I am God.",
    mood: "open" as const,
  };

  it("keeps the verse alongside what was written, so the journal needs nothing else", () => {
    setReflectionField(seed, "observation", "God does the stilling");
    const r = getReflection(loadProgress(), seed.id);
    expect(r?.verseRef).toBe("Psalms 46:10");
    expect(r?.verseText).toBe("Be still, and know that I am God.");
    expect(r?.soap.observation).toBe("God does the stilling");
    expect(r?.favorite).toBe(false);
  });

  it("writes nothing until there are words, and lets go again when they are cleared", () => {
    setReflectionField(seed, "observation", "");
    expect(loadProgress().reflections[seed.id]).toBeUndefined();

    setReflectionField(seed, "observation", "something");
    setReflectionField(seed, "observation", "");
    expect(loadProgress().reflections[seed.id]).toBeUndefined();
  });

  it("resumes the same reflection for the same verse on the same day", () => {
    setReflectionField(seed, "observation", "first");
    setReflectionField(seed, "prayer", "second");
    const p = loadProgress();
    expect(Object.keys(p.reflections)).toHaveLength(1);
    expect(getReflection(p, seed.id)?.soap).toEqual({ observation: "first", application: "", prayer: "second" });
  });

  it("keeps the same verse on a different day apart", () => {
    setReflectionField(seed, "observation", "today");
    setReflectionField({ ...seed, id: reflectionIdFor("2026-08-31", seed.verseRef), date: "2026-08-31" }, "observation", "tomorrow");
    expect(Object.keys(loadProgress().reflections)).toHaveLength(2);
  });

  it("toggles a favorite, and ignores an id nothing was written to", () => {
    setReflectionField(seed, "observation", "x");
    toggleReflectionFavorite(seed.id);
    expect(getReflection(loadProgress(), seed.id)?.favorite).toBe(true);
    toggleReflectionFavorite(seed.id);
    expect(getReflection(loadProgress(), seed.id)?.favorite).toBe(false);

    toggleReflectionFavorite("nothing-here");
    expect(loadProgress().reflections["nothing-here"]).toBeUndefined();
  });

  it("lists reflections most recent first, newest within a day leading", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-29T08:00:00Z"));
      setReflectionField({ ...seed, id: "a", date: "2026-08-29", verseRef: "John 15:5" }, "observation", "a");
      vi.setSystemTime(new Date("2026-08-30T08:00:00Z"));
      setReflectionField({ ...seed, id: "b", date: "2026-08-30", verseRef: "Psalms 46:10" }, "observation", "b");
      vi.setSystemTime(new Date("2026-08-30T21:00:00Z"));
      setReflectionField({ ...seed, id: "c", date: "2026-08-30", verseRef: "Romans 8:38" }, "observation", "c");
      expect(reflectionList(loadProgress()).map((r) => r.id)).toEqual(["c", "b", "a"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tolerates a store written before chosen verses existed", () => {
    localStorage.setItem("koino.progress.v1", JSON.stringify({ completedDates: ["2026-06-25"], favorites: [], entries: {} }));
    expect(loadProgress().reflections).toEqual({});
  });
});
