import { describe, it, expect, beforeEach } from "vitest";
import { loadPrefs, setOnboarded, setThemePref, setTextSize } from "@/lib/prefs";
import { milestoneFor } from "@/lib/streak";

beforeEach(() => localStorage.clear());

describe("prefs", () => {
  it("defaults to not onboarded, system theme, and regular text", () => {
    const p = loadPrefs();
    expect(p.onboarded).toBe(false);
    expect(p.theme).toBe("system");
    expect(p.textSize).toBe("regular");
  });

  it("persists the onboarded flag", () => {
    setOnboarded();
    expect(loadPrefs().onboarded).toBe(true);
  });

  it("persists theme and text size and stamps the document", () => {
    setThemePref("dark");
    setTextSize("large");
    expect(loadPrefs().theme).toBe("dark");
    expect(loadPrefs().textSize).toBe("large");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.text).toBe("large");
  });

  it("tolerates a missing or corrupt store", () => {
    localStorage.setItem("koino.prefs.v1", "{not json");
    expect(loadPrefs().onboarded).toBe(false);
    expect(loadPrefs().theme).toBe("system");
  });
});

describe("streak milestones", () => {
  it("returns a milestone only on notable streak counts", () => {
    expect(milestoneFor(7)?.days).toBe(7);
    expect(milestoneFor(30)?.title).toMatch(/month/i);
    expect(milestoneFor(1)).toBeNull();
    expect(milestoneFor(8)).toBeNull();
    expect(milestoneFor(0)).toBeNull();
  });
});
