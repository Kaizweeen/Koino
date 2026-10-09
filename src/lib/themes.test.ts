import { describe, it, expect } from "vitest";
import { THEMES, OPEN_THEME, getTheme, getMood, isMoodSlug } from "@/lib/themes";

describe("theme registry", () => {
  it("defines all 12 themes with matching slugs", () => {
    const slugs = Object.keys(THEMES);
    expect(slugs).toHaveLength(12);
    for (const [key, theme] of Object.entries(THEMES)) {
      expect(theme.slug).toBe(key);
    }
  });

  it("gives every theme a non-empty accent hex", () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getTheme returns the requested theme", () => {
    expect(getTheme("peace").name).toBe("Peace");
  });

  it("keeps the chosen-verse mood out of the twelve, but reachable", () => {
    expect(Object.keys(THEMES)).not.toContain("open");
    expect(getMood("open")).toBe(OPEN_THEME);
    expect(getMood("lament").name).toBe("Lament");
    expect(OPEN_THEME.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("accepts only real moods, including ones inherited from Object.prototype", () => {
    expect(isMoodSlug("open")).toBe(true);
    expect(isMoodSlug("peace")).toBe(true);
    expect(isMoodSlug("nonsense")).toBe(false);
    expect(isMoodSlug(null)).toBe(false);
    // `in` would say yes to these, and getMood would then hand back a function.
    expect(isMoodSlug("toString")).toBe(false);
    expect(isMoodSlug("constructor")).toBe(false);
  });
});
