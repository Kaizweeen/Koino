import { describe, it, expect } from "vitest";
import { DEVOTIONS } from "@/lib/devotions/content";
import { THEMES } from "@/lib/themes";

describe("devotion content integrity", () => {
  it("covers every day from 2026-06-25 through 2026-07-31 exactly once, ascending", () => {
    expect(DEVOTIONS[0].date).toBe("2026-06-25");
    expect(DEVOTIONS[DEVOTIONS.length - 1].date).toBe("2026-07-31");
    expect(DEVOTIONS).toHaveLength(37);
    for (let i = 1; i < DEVOTIONS.length; i++) {
      const prev = Date.parse(`${DEVOTIONS[i - 1].date}T00:00:00Z`);
      const cur = Date.parse(`${DEVOTIONS[i].date}T00:00:00Z`);
      expect(cur - prev).toBe(86_400_000);
    }
  });

  it("uses only valid themes and non-empty fields", () => {
    for (const d of DEVOTIONS) {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Object.keys(THEMES)).toContain(d.theme);
      expect(d.verseRef.length).toBeGreaterThan(0);
      expect(d.verseText.length).toBeGreaterThan(0);
      expect(d.reflection.length).toBeGreaterThan(20);
      expect(d.prayer.length).toBeGreaterThan(10);
    }
  });

  it("never repeats a theme on consecutive days", () => {
    for (let i = 1; i < DEVOTIONS.length; i++) {
      expect(DEVOTIONS[i].theme).not.toBe(DEVOTIONS[i - 1].theme);
    }
  });
});
