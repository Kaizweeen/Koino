import { describe, it, expect } from "vitest";
import { THEMES, getTheme } from "@/lib/themes";

describe("theme registry", () => {
  it("defines all 12 themes with matching slugs", () => {
    const slugs = Object.keys(THEMES);
    expect(slugs).toHaveLength(12);
    for (const [key, theme] of Object.entries(THEMES)) {
      expect(theme.slug).toBe(key);
    }
  });

  it("gives every theme a non-empty accent hex and at least one playlist", () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.playlistIds.length).toBeGreaterThan(0);
    }
  });

  it("getTheme returns the requested theme", () => {
    expect(getTheme("peace").name).toBe("Peace");
  });
});
